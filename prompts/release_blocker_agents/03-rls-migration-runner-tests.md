# Agent Prompt: RLS Migration Runner And Policy Tests

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close `WW-REL-002` and audit `P0-4`: database schema/RLS are draft migrations, and there is a likely admin escalation path through broad self-update policy on `public.users`.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/supabase-postgres-best-practices/SKILL.md`.
6. Read this prompt.

## Scope

- Add a controlled migration/test workflow for Supabase/Postgres.
- Harden RLS policies around `users.role`, parent links, teacher classes, student data, and system-owned tables.
- Add role-based positive and negative tests.
- Do not commit local admin secrets.

## Files To Inspect

- `services/api/migrations/202606090001_initial_WriterHabit_schema.sql`
- `services/api/migrations/202606090002_privacy_rls_policies.sql`
- `services/api/migrations/202606100001_profile_settings_notification_sync.sql`
- `services/api/migrations/202606100002_canvas_document_stroke_count.sql`
- `scripts/supabase-admin.mjs`
- `.env.supabase-admin.example`
- `services/api/docs/DATABASE_SCHEMA.md`
- `services/api/docs/AUTHORIZATION_RULES.md`
- `docs/KNOWN_ISSUES.md`

## Requirements

- Drop or replace broad self-update policies that allow role escalation.
- Make role changes service/admin-only.
- Add trigger-level protection if useful.
- Add tests for:
  - student cannot become admin
  - student cannot read/write another student
  - parent can read linked child only
  - revoked parent link denies access
  - teacher can read class student submissions only while assigned
  - removed class membership denies access
  - public client cannot write system-owned review/feedback/progress transitions
  - service role can perform required backend transitions
- Add migration runner or documented command path that can be used in CI/staging.

## Acceptance Criteria

- RLS policies fail closed for unauthorized roles.
- Admin escalation path is closed.
- Migrations can run repeatably in a controlled environment.
- Tests can be run locally without exposing secrets in logs.
- Docs reflect the real verified policy boundaries.

## Validation

- `node scripts/supabase-admin.mjs health`
- Run the migration/test command added by this task.
- `./script/build_and_run.sh --typecheck`
- `./script/build_and_run.sh --test`

## Final Response

Include migration files changed, RLS tests added, validation results, and remaining database risks.
