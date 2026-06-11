# Agent Prompt: Catalog Seed Data

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close audit `P1-16`: versioned seed data is missing for rubrics, assignment templates, badges, and test fixtures. Mobile still references fixed default assignment UUIDs.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/supabase-postgres-best-practices/SKILL.md`.
6. Read this prompt.

## Scope

- Add versioned, repeatable seed migrations/data for core catalogs.
- Replace fragile fixed UUID assumptions where practical.
- Add tests/fixtures that support backend and E2E work.

## Files To Inspect

- `services/api/migrations/*.sql`
- `services/api/docs/DATABASE_SCHEMA.md`
- `services/api/docs/SEED_DATA.md` if present
- `apps/mobile/src/features/assignments/**`
- `apps/mobile/src/features/progress/**`
- `apps/mobile/src/features/student-home/**`
- `tests/**`

## Requirements

- Seed rubrics by grade band and assignment type.
- Seed assignment templates for Grades 1-2, 3-5, 6-8, and 9-12.
- Seed badges/progress catalog.
- Seed deterministic test fixtures for student, parent, teacher, class, assignment, submission, and feedback flows.
- Seeds must be idempotent.
- Avoid hardcoding production logic to test fixture UUIDs.
- Document how to load seed data locally/staging/CI.

## Acceptance Criteria

- Fresh database can be migrated and seeded into a usable development/staging state.
- Tests can rely on named fixture lookups instead of fragile magic UUIDs.
- Mobile default assignment logic resolves server/catalog data where production requires it.
- Docs explain seed ownership and versioning.

## Validation

- Migration/seed command added by this task.
- Seed idempotency test.
- `node scripts/supabase-admin.mjs health`
- `./script/build_and_run.sh --typecheck`
- `./script/build_and_run.sh --test`

## Final Response

Include seed files created, catalogs covered, tests run, and remaining fixture gaps.
