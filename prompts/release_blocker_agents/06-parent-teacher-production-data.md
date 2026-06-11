# Agent Prompt: Parent And Teacher Production Data

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close audit `P0-9` and the parent/teacher portion of `WW-REL-010`: parent and teacher experiences are still backed by hardcoded local data and placeholder backend controllers.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/ux-flow/SKILL.md`.
6. Read `skills/supabase-postgres-best-practices/SKILL.md`.
7. Read this prompt.

## Scope

- Replace parent/teacher deterministic mock APIs with authenticated production API calls.
- Implement backend persistence for parent-student links, teacher classes, class students, assignments, reports, comments, and review visibility.
- Preserve demo behavior only behind explicit development gates.

## Files To Inspect

- `apps/mobile/src/features/parent/api/parentApi.ts`
- `apps/mobile/src/features/teacher/api/teacherApi.ts`
- `apps/mobile/src/features/parent/**`
- `apps/mobile/src/features/teacher/**`
- `services/api/src/features/parent/**`
- `services/api/src/features/teacher/**`
- `services/api/migrations/*.sql`
- `services/api/docs/AUTHORIZATION_RULES.md`
- `services/api/docs/API_CONTRACT.md`

## Requirements

- Parent data must load only through verified parent-student links.
- Teacher data must load only through verified class membership/employment/invite state.
- Revoked parent links and removed class memberships must immediately deny access.
- Teacher-created assignments and comments must persist server-side.
- Weekly reports must be server-backed and auditable.
- Remove or dev-gate hardcoded production-looking data paths.
- Add tests for linked/unlinked parent, valid/invalid teacher class, assignment create/publish, comment persistence, and access revocation.

## Acceptance Criteria

- Parent and teacher screens can hydrate from backend APIs.
- Mock data cannot appear in production builds as real data.
- Authorization is enforced by backend/RLS, not route gates.
- Docs and release checklist accurately describe remaining gaps.

## Validation

- Backend parent/teacher integration tests.
- RLS parent/teacher tests.
- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`

## Final Response

Include endpoints implemented, mobile mock paths removed/dev-gated, tests run, and remaining data-product gaps.
