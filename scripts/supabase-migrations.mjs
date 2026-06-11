#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(repoRoot, ".env.supabase-admin");
const migrationsDir = resolve(repoRoot, "services/api/migrations");
const rlsVerificationSqlPath = resolve(repoRoot, "services/api/tests/rls/resource-policy-verification.sql");

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1).replace(/^"|"$/g, "");
    process.env[key] ??= value;
  }
}

loadEnvFile(envPath);

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function printUsage() {
  console.log(`Usage:
  node scripts/supabase-migrations.mjs status
  node scripts/supabase-migrations.mjs apply [--verify-rls]
  node scripts/supabase-migrations.mjs verify-rls
  node scripts/supabase-migrations.mjs apply-and-verify

Environment:
  Create .env.supabase-admin with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

Notes:
  - SQL files are read from services/api/migrations/ in filename order.
  - Applied checksums are recorded in public.writerhabit_schema_migrations.
  - Secret values are never printed.
`);
}

function requireConfig() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.supabase-admin");
  }
}

async function request(path, options = {}) {
  requireConfig();

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status}): ${JSON.stringify(body)}`);
  }

  return body;
}

async function runSql(query) {
  return request("/pg/query", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function checksum(value) {
  return createHash("sha256").update(value).digest("hex");
}

function getMigrationFiles() {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => {
      const path = resolve(migrationsDir, file);
      const sql = readFileSync(path, "utf8");
      return {
        checksumSha256: checksum(sql),
        filename: file,
        path,
        sql,
        version: basename(file, ".sql"),
      };
    });
}

async function ensureMigrationLedger() {
  await runSql(`
    create table if not exists public.writerhabit_schema_migrations (
      version text primary key,
      filename text not null,
      checksum_sha256 text not null,
      applied_at timestamptz not null default now()
    );

    alter table public.writerhabit_schema_migrations enable row level security;
    alter table public.writerhabit_schema_migrations force row level security;
    revoke all on table public.writerhabit_schema_migrations from anon;
    revoke all on table public.writerhabit_schema_migrations from authenticated;
  `);
}

async function getAppliedMigrations() {
  await ensureMigrationLedger();
  const rows = await runSql(`
    select version, filename, checksum_sha256, applied_at
    from public.writerhabit_schema_migrations
    order by version
  `);

  return new Map((rows ?? []).map((row) => [row.version, row]));
}

async function printStatus() {
  const migrationFiles = getMigrationFiles();
  const applied = await getAppliedMigrations();

  for (const migration of migrationFiles) {
    const appliedMigration = applied.get(migration.version);
    if (!appliedMigration) {
      console.log(`[pending] ${migration.filename}`);
      continue;
    }

    const checksumState =
      appliedMigration.checksum_sha256 === migration.checksumSha256 ? "checksum-ok" : "checksum-mismatch";
    console.log(`[applied:${checksumState}] ${migration.filename}`);
  }
}

async function applyMigrations() {
  const migrationFiles = getMigrationFiles();
  const applied = await getAppliedMigrations();

  for (const migration of migrationFiles) {
    const appliedMigration = applied.get(migration.version);
    if (appliedMigration) {
      if (appliedMigration.checksum_sha256 !== migration.checksumSha256) {
        throw new Error(
          `Applied migration checksum mismatch for ${migration.filename}. ` +
            "Create a new migration instead of editing an applied migration.",
        );
      }

      console.log(`Skipping already applied migration ${migration.filename}`);
      continue;
    }

    console.log(`Applying migration ${migration.filename}`);
    await runSql(`
      begin;
      select pg_advisory_xact_lock(hashtext('writerhabit_schema_migrations'));

      ${migration.sql}

      insert into public.writerhabit_schema_migrations (
        version,
        filename,
        checksum_sha256
      )
      values (
        ${sqlLiteral(migration.version)},
        ${sqlLiteral(migration.filename)},
        ${sqlLiteral(migration.checksumSha256)}
      );

      commit;
    `);

    applied.set(migration.version, {
      checksum_sha256: migration.checksumSha256,
      filename: migration.filename,
      version: migration.version,
    });
  }
}

async function verifyRlsPolicies() {
  const verificationSql = readFileSync(rlsVerificationSqlPath, "utf8");
  await runSql(verificationSql);
  console.log("Resource RLS verification passed.");
}

const [command, ...args] = process.argv.slice(2);
const shouldVerifyRls = args.includes("--verify-rls");

try {
  switch (command) {
    case "status":
      await printStatus();
      break;

    case "apply":
      await applyMigrations();
      if (shouldVerifyRls) {
        await verifyRlsPolicies();
      }
      break;

    case "verify-rls":
      await verifyRlsPolicies();
      break;

    case "apply-and-verify":
      await applyMigrations();
      await verifyRlsPolicies();
      break;

    case undefined:
    case "help":
    case "--help":
    case "-h":
      printUsage();
      break;

    default:
      throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
