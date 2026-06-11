# Release Blocker Review: 04 Server-Side Workflow State Machines

## 1. Executive summary

The implementation moves the main submission, feedback publication, revision completion, assignment status, progress, and RLS write-boundary work substantially in the right direction. Backend submission/revision routes use authenticated API endpoints, production Supabase writes call service-role workflow RPCs, mobile no longer creates feedback/review/revision workflow rows directly in the reviewed production paths, and the configured development Supabase RLS verifier passed.

Changes are still required before approval because the AI review-job state machine is not durable on failure or safety-block paths. A failed review request can leave the persisted `review_jobs` row queued, while the client-facing feedback endpoint continues reporting `processing`.

## 2. Findings by severity

### P1 - Failed or safety-blocked AI review requests do not persist the review-job terminal state

`services/api/src/features/workflows/writing-workflow-state-machine.ts:11` defines review-job transitions and `assertReviewJobTransition`, but no route or database adapter uses them. In `services/api/src/routes/ai-review.ts:269`, the route calls `AiReviewService.requestReview`; when the service returns `failed` or `safety_blocked`, `services/api/src/routes/ai-review.ts:271` throws immediately through `createServiceError` without updating the existing `review_jobs` row created during submission. `services/api/src/routes/ai-review.ts:324` then reports feedback status from persisted feedback/job state, so the unchanged queued job is surfaced as `processing` instead of the true terminal failure.

This is reachable in current code. Submission accepts up to 40,000 characters in `services/api/src/routes/submissions.ts:39`, while the free review usage limit can reject requests above the single-review token budget in `services/api/src/features/ai/usage/ai-usage-limit.service.ts:79`. Safety and provider parse failures also return `failed` or `safety_blocked` from `services/api/src/features/ai/review/ai-review.service.ts:160` and `services/api/src/features/ai/review/ai-review.service.ts:196`.

Required fix: add a trusted database transition for review-job lifecycle updates, and call it from the review route before returning errors. At minimum, persist `processing`, `failed`, and `safety_blocked` with `started_at`, `failed_at` where applicable, and `safety_flags`. Add backend tests proving failed/safety-blocked review requests leave `GET /api/v1/submissions/:submissionId/feedback` and `GET /api/v1/ai/review/submissions/:submissionId/status` in the correct durable state.

## 3. Validation reviewed or run

- Reviewed startup context: `AGENTS.md`, `docs/00_CONTEXT_BRIEF.md`, `prompts/01_master_agent_rules.md`, `.codex/EXECUTION_STATE.md`, `skills/supabase-postgres-best-practices/SKILL.md`, `skills/writing-screen-review/SKILL.md`, and the task prompt.
- Inspected `git diff --stat HEAD` and `git diff --name-status HEAD`.
- Reviewed changed workflow/backend/mobile/RLS/docs files, including `services/api/src/routes/submissions.ts`, `services/api/src/routes/ai-review.ts`, `services/api/src/data/supabase-database.ts`, `services/api/migrations/202606110003_workflow_state_machines.sql`, `services/api/tests/rls/resource-policy-verification.sql`, and the changed mobile assignment/feedback/workspace API facades.
- Ran `npm test -- --run src/__tests__/writing-loop.test.ts` in `services/api`: passed, 31 tests.
- Ran `node scripts/supabase-migrations.mjs apply-and-verify`: passed, including resource RLS verification.
- Ran `npm run typecheck` in `services/api`: passed.
- Ran `npm test` in `services/api`: passed, 69 tests.
- Ran `./script/build_and_run.sh --typecheck`: passed.
- Ran `./script/build_and_run.sh --test`: passed, 46 suites and 201 tests.
- Ran `cd apps/mobile && npm run lint -- --max-warnings=0`: passed.

## 4. Documentation/release-checklist accuracy

The docs honestly capture the larger remaining production AI-provider and durable-worker blocker in `docs/KNOWN_ISSUES.md`. The workflow documentation should also mention, or the code should fix, the current local gap that review-job terminal failures are not persisted by the synchronous review route. Without that, docs overstate the completeness of the AI review request state machine.

RLS documentation is consistent with the verifier results for public-client write denial across workflow-owned rows.

## 5. Required implementation follow-up

- Implement persisted review-job lifecycle transitions for request start, failure, and safety block.
- Wire `POST /api/v1/ai/review/submissions/:submissionId` to persist the terminal job state before returning service errors.
- Add backend tests for at least one usage-limit or safety-block path and assert both review status endpoints report `failed` or `safety_blocked` durably.
- Update workflow docs if any review-job lifecycle behavior remains intentionally synchronous or deferred.

## 6. Final decision

REVIEW_STATUS: changes_requested
