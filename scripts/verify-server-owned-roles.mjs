#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(repoRoot, ".env.supabase-admin");
const shouldApplyLocalMigration = process.argv.includes("--apply-local-migration");

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

function assertTriggerMetadata(rows) {
  const metadata = rows?.[0];

  if (!metadata) {
    throw new Error("Missing reject_client_user_role_change trigger metadata");
  }

  if (metadata.security_definer !== false) {
    throw new Error("reject_client_user_role_change must be SECURITY INVOKER");
  }

  if (metadata.trigger_enabled !== "O") {
    throw new Error("users_reject_client_role_change trigger is missing or disabled");
  }

  if (metadata.self_update_policy !== "users_self_update_profile_fields") {
    throw new Error("users_self_update_profile_fields policy is missing");
  }
}

const metadataSql = `
  select
    p.prosecdef as security_definer,
    t.tgenabled as trigger_enabled,
    pol.policyname as self_update_policy
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  left join pg_trigger t
    on t.tgfoid = p.oid
   and t.tgname = 'users_reject_client_role_change'
   and not t.tgisinternal
  left join pg_policies pol
    on pol.schemaname = 'public'
   and pol.tablename = 'users'
   and pol.policyname = 'users_self_update_profile_fields'
  where n.nspname = 'public'
    and p.proname = 'reject_client_user_role_change'
`;

const rlsVerificationSql = `
  begin;

  delete from auth.users
  where id = '02000000-0000-4000-8000-000000000102'::uuid;

  insert into auth.users (
    id,
    aud,
    role,
    email,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values (
    '02000000-0000-4000-8000-000000000102'::uuid,
    'authenticated',
    'authenticated',
    'rls-role-fixture-student@writerhabit.local',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RLS Role Fixture","role":"admin"}'::jsonb,
    now(),
    now()
  );

  do $$
  declare
    generated_role text;
  begin
    select role
    into generated_role
    from public.users
    where id = '02000000-0000-4000-8000-000000000102'::uuid;

    if generated_role is not null and generated_role <> 'student' then
      raise exception 'Auth metadata role on sign-up elevated public.users.role to %', generated_role;
    end if;
  end;
  $$;

  insert into public.users (id, email, display_name, role, locale)
  values (
    '02000000-0000-4000-8000-000000000102'::uuid,
    'rls-role-fixture-student@writerhabit.local',
    'RLS Role Fixture',
    'student',
    'en'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        locale = excluded.locale,
        updated_at = now();

  update auth.users
  set raw_user_meta_data = '{"display_name":"RLS Role Fixture","role":"teacher","onboarding_complete":true}'::jsonb
  where id = '02000000-0000-4000-8000-000000000102'::uuid;

  do $$
  declare
    synced_role text;
  begin
    select role
    into synced_role
    from public.users
    where id = '02000000-0000-4000-8000-000000000102'::uuid;

    if synced_role <> 'student' then
      raise exception 'Auth metadata update elevated public.users.role to %', synced_role;
    end if;
  end;
  $$;

  set local role authenticated;
  set local request.jwt.claim.sub = '02000000-0000-4000-8000-000000000102';
  set local request.jwt.claim.role = 'authenticated';
  set local request.jwt.claims = '{"sub":"02000000-0000-4000-8000-000000000102","role":"authenticated"}';

  update public.users
  set display_name = 'RLS Role Fixture Updated'
  where id = '02000000-0000-4000-8000-000000000102'::uuid;

  do $$
  declare
    attempted_role text;
    current_display_name text;
    observed_role text;
  begin
    select display_name
    into current_display_name
    from public.users
    where id = '02000000-0000-4000-8000-000000000102'::uuid;

    if current_display_name <> 'RLS Role Fixture Updated' then
      raise exception 'Authenticated safe profile update was not applied';
    end if;

    foreach attempted_role in array array['parent', 'teacher', 'admin'] loop
      begin
        update public.users
        set role = attempted_role
        where id = '02000000-0000-4000-8000-000000000102'::uuid;

        raise exception 'Authenticated user unexpectedly changed role to %', attempted_role;
      exception
        when insufficient_privilege then
          null;
      end;

      select role
      into observed_role
      from public.users
      where id = '02000000-0000-4000-8000-000000000102'::uuid;

      if observed_role <> 'student' then
        raise exception 'Role changed to % after blocked % escalation attempt', observed_role, attempted_role;
      end if;
    end loop;
  end;
  $$;

  reset role;

  do $$
  declare
    approved_role text;
    observed_role text;
  begin
    foreach approved_role in array array['parent', 'teacher', 'admin', 'student'] loop
      update public.users
      set role = approved_role
      where id = '02000000-0000-4000-8000-000000000102'::uuid;

      select role
      into observed_role
      from public.users
      where id = '02000000-0000-4000-8000-000000000102'::uuid;

      if observed_role <> approved_role then
        raise exception 'Admin role grant to % did not persist', approved_role;
      end if;
    end loop;
  end;
  $$;

  select 'server_owned_roles_rls'::text as check_name, true as passed;

  rollback;
`;

async function main() {
  if (shouldApplyLocalMigration) {
    const migrationSql = readFileSync(
      resolve(repoRoot, "services/api/migrations/202606110001_server_owned_roles.sql"),
      "utf8",
    );
    await runSql(migrationSql);
  }

  assertTriggerMetadata(await runSql(metadataSql));
  await runSql(rlsVerificationSql);

  console.log("Server-owned role RLS verification passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
