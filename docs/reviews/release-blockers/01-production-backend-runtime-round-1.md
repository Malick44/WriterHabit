# Release Blocker Review: 01 Production Backend Runtime, Round 1

## 1. Executive summary

The Fastify runtime shell is materially present: `services/api` now has a package manifest, local dev/build/test scripts, `/api/v1/health`, request IDs, CORS, standard error middleware, Supabase JWT verification, authenticated profile/session smoke endpoints, fail-closed feature route shells, and Vitest integration coverage. Focused backend validation passed.

I cannot approve the task yet because the runtime's authenticated principal derives `role` from client-writable Supabase `user_metadata`. That is inside this task's auth-boundary scope and must be corrected before this can be considered a production backend runtime shell.

## 2. Findings by severity

### P1 - Backend principal role trusts mutable Supabase user metadata

`services/api/src/runtime/auth.ts:50` parses `claims.user_metadata`, and `services/api/src/runtime/auth.ts:55` returns that parsed metadata immediately when `parsedUserMetadata.role !== "student"`. Only the default/student path attempts to prefer `app_metadata.role` at `services/api/src/runtime/auth.ts:59`. The resulting `principal.role` is returned by implemented smoke endpoints in `services/api/src/routes/profile.ts:16`.

That is not a safe production auth boundary for this app. The current mobile auth flow writes `role` into user metadata during sign-up at `apps/mobile/src/core/auth/sessionService.ts:164` and can update it during onboarding at `apps/mobile/src/core/auth/sessionService.ts:190`. Those values are client-visible and client-mutated in the current architecture. The runtime tests also reinforce the unsafe source by signing `user_metadata.role` directly in `services/api/src/__tests__/server.test.ts:38` and asserting it as the returned role at `services/api/src/__tests__/server.test.ts:151`.

Impact: the runtime normalizes an unsafe `principal.role` that future parent, teacher, admin, and entitlement handlers are likely to use for authorization. Even today, `/api/v1/auth/session` and `/api/v1/me/profile` can report a role derived from mutable user metadata. Resource handlers still fail closed with `501`, so this is not currently leaking feature data, but it is a P1 auth-boundary blocker for approving the runtime shell.

Required fix: derive backend roles only from server-owned data, such as trusted `app_metadata`, custom claims, or a server-owned profile table after verifying `sub`. Treat `user_metadata.role` as an untrusted onboarding/display hint at most, and default untrusted or missing roles to the least-privileged path. Add negative tests proving a token with `user_metadata.role = "teacher"` or `"admin"` does not elevate unless the trusted server-owned source grants that role.

### P2 - Release documentation still has stale backend-runtime statements

The touched canonical backend docs are mostly honest, especially `services/api/README.md`, `services/api/docs/API_CONTRACT.md`, `services/api/docs/AUTHORIZATION_RULES.md`, `docs/KNOWN_ISSUES.md`, and `docs/RELEASE_CHECKLIST.md`.

Several related docs still conflict with the new state:

- `docs/APP_IMPLEMENTATION_AUDIT.md:50` still lists `P0-1 backend runtime` as a remaining open finding even though the same file now marks the runtime shell resolved at `docs/APP_IMPLEMENTATION_AUDIT.md:98`.
- `docs/05_API_CONTRACT.md:34` still says there is no running WriterHabit backend runtime.
- `docs/SECURITY_PRIVACY.md:3` still says a production backend runtime does not exist.

Impact: release-readiness docs give mixed guidance about whether WW-REL-001 is still open. This is lower risk than the auth-boundary issue because the main release checklist still says not to release publicly and still tracks persistence, RLS, deployment, and resource authorization gaps.

Required fix: update these docs to distinguish the implemented local Fastify runtime shell from the still-missing deployed API infrastructure, production migration runner, persistence handlers, and server-side authorization.

## 3. Validation reviewed or run

Reviewed:

- Required startup context: `AGENTS.md`, `docs/00_CONTEXT_BRIEF.md`, `prompts/01_master_agent_rules.md`, `.codex/EXECUTION_STATE.md`, and `prompts/release_blocker_agents/01-production-backend-runtime.md`.
- Current HEAD diff and task-touched files.
- Backend runtime files under `services/api/src/server.ts`, `services/api/src/index.ts`, `services/api/src/runtime/`, `services/api/src/routes/`, and `services/api/src/__tests__/server.test.ts`.
- Mobile API/auth boundary files, especially `apps/mobile/src/core/api/apiClient.ts` and `apps/mobile/src/core/auth/sessionService.ts`.
- Release docs and backend API docs.

Run:

- `cd services/api && npm run typecheck` - passed.
- `cd services/api && npm test` - passed, 1 test file and 6 tests.
- `cd services/api && npm run build` - passed.
- `git diff --check HEAD` - passed.

Not run:

- Mobile typecheck/test/doctor were not rerun because this review focused on the backend runtime diff.
- `cd services/api && npm run lint` was not run because no backend lint script exists.

## 4. Documentation/release-checklist accuracy

`docs/KNOWN_ISSUES.md` and `docs/RELEASE_CHECKLIST.md` correctly keep public release blocked and correctly call out unfinished migrations/RLS, resource-level handlers, provider integrations, signed URLs, audit/retention, and deployment. They also add backend typecheck/test/build to release gates.

The stale docs listed in the P2 finding should be corrected before this task is marked fully clean. They do not hide the fact that the app is still not release-ready, but they make WW-REL-001 status ambiguous.

## 5. Required implementation follow-up

1. Fix `services/api/src/runtime/auth.ts` so backend roles come only from trusted server-owned role sources.
2. Add negative auth tests for user-metadata role escalation and positive tests for trusted role derivation.
3. Update stale docs to say the local Fastify runtime shell exists while deployment, production migration, persistence, and resource authorization remain open.

## 6. Final decision

The implementation can continue locally and has a clear fix path. No owner credentials or external infrastructure are required to resolve the P1 auth-boundary issue.

REVIEW_STATUS: changes_requested
