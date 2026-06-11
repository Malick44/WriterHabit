# Agent Prompt: Production Backend Runtime

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close `WW-REL-001` and audit `P0-1`: `services/api/` is still docs, migrations, and framework-neutral stubs. Implement a real production backend runtime that the hardened mobile `apiClient` can call.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read this prompt.
6. Read `services/api/README.md`, `services/api/docs/`, `services/api/src/features/`, and `apps/mobile/src/core/api/apiClient.ts`.

## Scope

- Choose the smallest production-credible Node/TypeScript API runtime that fits this repo.
- Add a `services/api/package.json`, TypeScript config if needed, server entrypoint, health endpoint, request logging, request IDs, CORS policy, auth middleware, error middleware, and deployment-ready scripts.
- Wire endpoint shells for the existing feature boundaries without pretending incomplete features are done.
- Preserve the existing framework-neutral feature contracts where possible.
- Do not commit secrets or service-role values.

## Requirements

- API must accept Supabase bearer JWTs from the mobile app and reject unauthenticated protected requests.
- API must return the standard error shape documented in `services/api/docs/ERROR_CODES.md`.
- API must propagate or generate request IDs and include them in error responses.
- API must validate request bodies with Zod or existing shared schemas.
- API must expose at least:
  - `GET /health`
  - an authenticated session/profile smoke endpoint
  - placeholder-safe route registration for assignments, feedback, canvas, notifications, subscriptions, parent, and teacher features
- Do not fake production persistence for critical workflows. If an endpoint is not production-ready, fail closed with a typed `501`/feature-disabled response.
- Add integration tests for health, auth-required, invalid token, request-id propagation, and standardized errors.

## Files To Inspect

- `services/api/README.md`
- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/ERROR_CODES.md`
- `services/api/docs/AUTHORIZATION_RULES.md`
- `services/api/src/features/**`
- `packages/shared/src/**`
- `apps/mobile/src/core/api/**`
- `docs/KNOWN_ISSUES.md`
- `docs/RELEASE_CHECKLIST.md`

## Acceptance Criteria

- `services/api` has a runnable local server.
- Protected endpoints reject missing/invalid bearer tokens.
- Error shape matches docs and mobile `ApiError` expectations.
- Health endpoint works without auth.
- Integration tests cover the runtime shell.
- Docs accurately say what is implemented and what remains blocked.

## Validation

- `cd services/api && npm install`
- `cd services/api && npm run typecheck`
- `cd services/api && npm test`
- `cd services/api && npm run lint` if added
- `./script/build_and_run.sh --typecheck`
- `./script/build_and_run.sh --test`

## Final Response

Include summary, modified files, validation results, known limitations, and next backend issue to run.
