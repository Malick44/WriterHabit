# Agent Prompt: Server-Derived Roles And Authorization

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close audit `P0-2`: authorization and role trust are unsafe because mobile-visible Supabase metadata can drive app role and route decisions. Roles and entitlements must be derived from server-owned state.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/supabase-postgres-best-practices/SKILL.md`.
6. Read this prompt.

## Scope

- Remove production trust in client-mutable role metadata.
- Keep route gates as UX convenience only.
- Move role derivation to server-owned profile tables, admin-controlled metadata, or backend/custom-claim flow.
- Do not break local development/demo flows; keep any demo path strictly `__DEV__` gated.

## Files To Inspect

- `apps/mobile/src/core/auth/sessionService.ts`
- `apps/mobile/src/core/auth/authStore.ts`
- `apps/mobile/src/core/auth/authTypes.ts`
- `apps/mobile/src/core/auth/roleGuards.ts`
- `apps/mobile/src/core/navigation/RouteGate.tsx`
- `apps/mobile/src/features/onboarding/**`
- `services/api/docs/AUTHORIZATION_RULES.md`
- `services/api/migrations/*.sql`
- `docs/KNOWN_ISSUES.md`
- `docs/APP_IMPLEMENTATION_AUDIT.md`

## Requirements

- Mobile sign-up/onboarding must not be able to grant `admin`, `teacher`, or parent access by writing client metadata.
- Teacher access must require invite/admin/server approval.
- Parent access must require a server-backed parent-student link.
- Student profile role can be reflected in UI, but critical access must be enforced by backend/RLS.
- Add tests proving production session mapping does not trust unsafe metadata.
- Add or update docs that explain the new role source of truth.

## Acceptance Criteria

- No production code path lets mobile input directly elevate role.
- Role derivation has clear server/database ownership.
- Route gates still work for UX but are documented as non-security boundaries.
- Tests cover role escalation attempts.

## Validation

- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`
- Run any new backend/RLS tests added by this change.

## Final Response

Include changed files, role source-of-truth decision, tests run, and any follow-up needed for backend/RLS enforcement.
