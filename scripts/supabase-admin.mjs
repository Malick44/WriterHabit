#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.supabase-admin");

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
  node scripts/supabase-admin.mjs health
  node scripts/supabase-admin.mjs schemas
  node scripts/supabase-admin.mjs tables [schema]
  node scripts/supabase-admin.mjs sql "select now()"
  node scripts/supabase-admin.mjs auth-users
  node scripts/supabase-admin.mjs buckets

Environment:
  Create .env.supabase-admin with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
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

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

const [command, ...args] = process.argv.slice(2);

try {
  switch (command) {
    case "health": {
      const [meta, authUsers, buckets] = await Promise.all([
        request("/pg/"),
        request("/auth/v1/admin/users?page=1&per_page=1"),
        request("/storage/v1/bucket"),
      ]);
      printJson({
        url: supabaseUrl,
        postgresMeta: meta,
        authUsersVisible: Array.isArray(authUsers.users),
        storageBucketCount: Array.isArray(buckets) ? buckets.length : null,
      });
      break;
    }

    case "schemas": {
      printJson(
        await runSql(`
          select schema_name
          from information_schema.schemata
          where schema_name not like 'pg_%'
          order by schema_name
        `),
      );
      break;
    }

    case "tables": {
      const schema = args[0] ?? "public";
      printJson(
        await runSql(`
          select table_schema, table_name, table_type
          from information_schema.tables
          where table_schema = '${schema.replaceAll("'", "''")}'
          order by table_name
        `),
      );
      break;
    }

    case "sql": {
      const query = args.join(" ").trim();
      if (!query) {
        throw new Error('Missing SQL string. Example: node scripts/supabase-admin.mjs sql "select now()"');
      }
      printJson(await runSql(query));
      break;
    }

    case "auth-users": {
      printJson(await request("/auth/v1/admin/users?page=1&per_page=50"));
      break;
    }

    case "buckets": {
      printJson(await request("/storage/v1/bucket"));
      break;
    }

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
