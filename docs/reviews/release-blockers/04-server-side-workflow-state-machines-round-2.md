# Release Blocker Review: 04 Server-Side Workflow State Machines Round 2

## 1. Executive summary

Round 2 addresses the round-1 blocker. AI review request start, failure, and
safety-block states now persist through a backend-only review-job lifecycle
workflow; submission, feedback publication, revision completion, assignment
status changes, and progress side effects are backend-owned. Public-client RLS
write denial was verified against the configured development Supabase.

I found no unresolved P0/P1 issues in the release-blocker scope.

## 2. Findings by severity

No P0/P1 findings.

Non-blocking follow-up: the mobile workspace still has legacy direct Supabase
draft reads/writes in
`apps/mobile/src/features/writing-workspace/services/draftPersistenceService.ts`.
Draft rows are not system-owned workflow rows, and the main assignment-detail
entry path calls the backend start workflow before opening the workspace, so this
does not block this release-blocker approval. A later cleanup should route
authenticated draft sync through the backend draft endpoints consistently.

## 3. Validation reviewed or run

- Reviewed required startup context: `AGENTS.md`,
  `docs/00_CONTEXT_BRIEF.md`, `prompts/01_master_agent_rules.md`,
  `.codex/EXECUTION_STATE.md`, and
  `prompts/release_blocker_agents/04-server-side-workflow-state-machines.md`.
- Also reviewed task skills:
  `skills/supabase-postgres-best-practices/SKILL.md` and
  `skills/writing-screen-review/SKILL.md`.
- Inspected current diff from `HEAD`, including workflow routes, database
  adapters, mobile API callers, docs, migrations, and RLS verification SQL.
- `cd services/api && npm test -- writing-loop.test.ts`: passed, 33 tests.
- `cd services/api && npm run typecheck`: passed.
- `node scripts/supabase-migrations.mjs apply-and-verify`: passed; migrations
  through `202606110004_review_job_lifecycle.sql` were already applied and
  resource RLS verification passed.
- `./script/build_and_run.sh --typecheck`: passed.
- `./script/build_and_run.sh --test`: passed, 46 suites and 201 tests.
- `cd apps/mobile && npm run lint -- --max-warnings=0`: passed.

## 4. Documentation/release-checklist accuracy

The updated docs are accurate for this task's scope. They describe the backend
workflow transactions, RLS write boundaries, persisted review-job terminal
states, and remaining production AI-provider/durable-worker gaps without
claiming that production AI provider integration is complete.

`docs/KNOWN_ISSUES.md` still correctly tracks external release work such as
production AI provider/worker integration, canvas storage sync, payment
entitlement sync, mobile E2E automation, and backend lint/CI wiring.

## 5. Required implementation follow-up, if any

No blocking follow-up is required for release-blocker task 04.

Recommended non-blocking cleanup: migrate the remaining authenticated mobile
draft persistence path to the backend draft endpoints so deep-linked writing
workspace sessions get the same `not_started -> in_progress` behavior as the
assignment-detail start flow.

## 6. Final decision

REVIEW_STATUS: approved
