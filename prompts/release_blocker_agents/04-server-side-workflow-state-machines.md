# Agent Prompt: Server-Side Workflow State Machines

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close audit `P0-5`: mobile currently performs workflow/system writes directly for submissions, review jobs, feedback, revision tasks, and assignment status transitions. Move these transitions behind trusted backend transactions.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/supabase-postgres-best-practices/SKILL.md`.
6. Read `skills/writing-screen-review/SKILL.md`.
7. Read this prompt.

## Scope

- Design and implement server-owned state machines for assignment submission, AI review request, feedback publication, revision submission, and progress updates.
- Restrict mobile to calling authenticated backend endpoints.
- Deny public-client writes to system-owned tables through RLS.

## Files To Inspect

- `apps/mobile/src/features/assignments/api/assignmentsApi.ts`
- `apps/mobile/src/features/writing-workspace/api/writingWorkspaceApi.ts`
- `apps/mobile/src/features/feedback-review/api/feedbackreviewApi.ts`
- `apps/mobile/src/features/assignments/services/assignmentStatusService.ts`
- `services/api/src/features/assignments/**`
- `services/api/src/features/feedback/**`
- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/AUTHORIZATION_RULES.md`
- `services/api/migrations/*.sql`

## Requirements

- Define allowed state transitions and invalid transition errors.
- Backend transaction must create submission/content/review job and update assignment status atomically.
- Feedback and revision tasks must be produced by trusted backend/AI flow, not forged by mobile.
- Mobile should show local/offline queue states separately from remote submitted/review-ready states.
- Add tests for invalid transitions, double submit, missing assignment, wrong owner, and offline/queued client behavior.

## Acceptance Criteria

- Mobile no longer directly marks assignments `feedback_ready` or creates system-owned feedback/review rows in production paths.
- RLS denies public client writes to system-owned workflow tables.
- Backend tests prove valid and invalid transitions.
- Student work remains protected if backend call fails.

## Validation

- Backend test command for workflow transitions.
- RLS test command for public-client write denial.
- `./script/build_and_run.sh --typecheck`
- `./script/build_and_run.sh --test`
- `cd apps/mobile && npm run lint -- --max-warnings=0`

## Final Response

Include state machine summary, files changed, tests run, and remaining production workflow gaps.
