# Agent Prompt: Auth Profiles And Onboarding Sync

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close `WW-REL-010`: student settings sync exists for some fields, but role profiles, onboarding records, parent links, and teacher class state are not fully persisted through production APIs.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/supabase-postgres-best-practices/SKILL.md`.
6. Read `skills/ux-flow/SKILL.md`.
7. Read this prompt.

## Scope

- Replace local/demo profile and onboarding metadata with server-backed records.
- Hydrate role profile, onboarding state, parent links, and teacher class state through authenticated APIs.
- Keep local fallbacks honest and dev-only where appropriate.

## Files To Inspect

- `apps/mobile/src/core/auth/**`
- `apps/mobile/src/features/onboarding/**`
- `apps/mobile/src/features/profile-settings/**`
- `apps/mobile/src/features/parent/**`
- `apps/mobile/src/features/teacher/**`
- `services/api/src/features/profiles/**`
- `services/api/src/features/parent/**`
- `services/api/src/features/teacher/**`
- `services/api/migrations/*.sql`
- `services/api/docs/API_CONTRACT.md`

## Requirements

- Onboarding completion must persist to server-owned profile/onboarding tables.
- Profile hydration must work cross-device.
- Parent links and teacher class memberships must hydrate from production APIs.
- Local persisted settings can be used for offline UI, but must reconcile with server truth.
- Role changes remain server/admin controlled.
- Add loading, stale/offline, sync failed, and retry states where needed.
- Add tests for onboarding completion, rehydration on new device, conflict handling, parent link hydration, teacher class hydration, and role immutability.

## Acceptance Criteria

- A user can sign in on a second device and get correct role/profile/onboarding state from backend.
- Production app does not depend on mutable auth metadata for profile truth.
- Parent/teacher links are server-backed.
- Docs describe offline/local cache behavior accurately.

## Validation

- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`
- Backend profile integration tests if added.

## Final Response

Include hydration model, files changed, tests run, and remaining parent/teacher/backend dependencies.
