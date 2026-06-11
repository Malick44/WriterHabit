# Release Blocker Review: 01 Production Backend Runtime, Round 2

## 1. Executive summary

Round 1's P1 auth-boundary finding is resolved. The runtime principal now derives role from trusted `app_metadata.role` only and defaults missing/invalid trusted roles to `student`; client-writable `user_metadata.role` is ignored.

The `services/api` Fastify runtime shell meets this task's local approval bar: package scripts, build path, health endpoint, request IDs, CORS, request logging, standard error envelopes, Supabase JWT verification, authenticated profile/session smoke endpoints, fail-closed feature route shells, and integration tests are present. Focused backend validation passed.

Remaining production blockers are real but outside this runtime-shell task: production migration/RLS verification, deployed infrastructure, resource-level feature handlers, payment entitlement sync, signed storage, AI/provider wiring, notification workers, audit/retention workers, and mobile E2E automation.

## 2. Findings by severity

### P0/P1

No unresolved P0/P1 findings in this task's scope.

The reviewed auth boundary now uses `app_metadata.role` as the trusted source at `services/api/src/runtime/auth.ts:55` and falls back to `student` at `services/api/src/runtime/auth.ts:59`. Public profile metadata is still read from `user_metadata` at `services/api/src/runtime/auth.ts:49`, but role elevation is not. The principal returned by smoke endpoints is assembled at `services/api/src/runtime/auth.ts:72` and exposed by `services/api/src/routes/profile.ts:31`.

The regression coverage requested in round 1 exists: user-metadata role escalation is rejected at `services/api/src/__tests__/server.test.ts:164`, and trusted app-metadata role derivation is covered at `services/api/src/__tests__/server.test.ts:190`.

### P2/notes

No blocking P2 findings. The superseded Prompt 27 final QA report still contains older backend-readiness wording, but it is explicitly marked stale at `docs/FINAL_QA_REPORT.md:3` and points to the current audit state at `docs/FINAL_QA_REPORT.md:5`. Current release-tracking docs correctly distinguish the implemented runtime shell from the remaining production blockers.

## 3. Validation reviewed or run

Reviewed:

- Required startup context: `AGENTS.md`, `docs/00_CONTEXT_BRIEF.md`, `prompts/01_master_agent_rules.md`, `.codex/EXECUTION_STATE.md`, and `prompts/release_blocker_agents/01-production-backend-runtime.md`.
- Current working-tree status and diff from `HEAD`, including tracked docs changes and untracked runtime files.
- Backend runtime files under `services/api/src/server.ts`, `services/api/src/index.ts`, `services/api/src/runtime/`, `services/api/src/routes/`, and `services/api/src/__tests__/server.test.ts`.
- Backend feature endpoint contracts under `services/api/src/features/`.
- Mobile API boundary in `apps/mobile/src/core/api/apiClient.ts`.
- Backend/release docs, especially `services/api/README.md`, `services/api/docs/API_CONTRACT.md`, `services/api/docs/AUTHORIZATION_RULES.md`, `services/api/docs/ERROR_CODES.md`, `docs/KNOWN_ISSUES.md`, and `docs/RELEASE_CHECKLIST.md`.

Run:

- `cd services/api && npm run typecheck` - passed.
- `cd services/api && npm test` - passed, 1 test file and 9 tests.
- `cd services/api && npm run build` - passed, `dist/index.js` emitted successfully.
- `git diff --check HEAD` - passed.

Not run:

- Mobile typecheck/test/doctor were not rerun because this round-2 review focused on backend runtime/doc changes and no mobile source files changed.
- `cd services/api && npm run lint` was not run because no backend lint script exists.

## 4. Documentation/release-checklist accuracy

The current backend docs are honest about the implementation boundary:

- `services/api/README.md:7` lists the implemented runtime shell and `services/api/README.md:23` explicitly states persistence, resource authorization, migration runner, provider calls, workers, and deployment infrastructure are not implemented.
- `services/api/docs/API_CONTRACT.md:9` documents implemented health/profile/session endpoints and fail-closed feature routes.
- `services/api/docs/AUTHORIZATION_RULES.md:7` documents that only JWT verification exists today and resource-level authorization remains future work.
- `docs/KNOWN_ISSUES.md:7` marks WW-REL-001 resolved only for the runtime shell and keeps feature persistence, resource authorization, migrations, provider integrations, and deployment as separate blockers.
- `docs/RELEASE_CHECKLIST.md:83` checks off the runtime shell while `docs/RELEASE_CHECKLIST.md:84` and `docs/RELEASE_CHECKLIST.md:85` keep migrations/RLS and feature route handlers open.

This is sufficient for release-checklist accuracy for WW-REL-001.

## 5. Required implementation follow-up

No required follow-up for this runtime-shell task.

Next backend work should move to the remaining release blockers, starting with database migration/RLS verification and resource-level API authorization. Production feature handlers should continue failing closed until they have persistence, resource authorization, audit behavior, and route-specific validation.

## 6. Final decision

Approved for WW-REL-001. The runtime shell is production-credible as a fail-closed boundary, and the remaining production gaps are documented as separate blockers that cannot be completed by this task alone.

REVIEW_STATUS: approved
