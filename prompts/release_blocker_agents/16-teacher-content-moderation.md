# Agent Prompt: Teacher Content Moderation And Audit

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close audit `P1-15`: teacher assignment prompts and comments currently have UI-level validation, but no backend academic-integrity moderation or audit enforcement before student visibility.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/ux-flow/SKILL.md`.
6. Read this prompt.

## Scope

- Moderate and audit teacher-created prompts/comments before publication or student visibility.
- Preserve the learning-app boundary: teachers can assign writing tasks and feedback, but system must still block unsafe or policy-violating content.

## Files To Inspect

- `apps/mobile/src/features/teacher/**`
- `services/api/src/features/teacher/**`
- `services/api/src/features/ai/**`
- `services/api/src/features/audit/**`
- `services/api/docs/AI_SAFETY_POLICY.md`
- `services/api/docs/AUDIT_LOGGING.md`
- `services/api/docs/API_CONTRACT.md`

## Requirements

- Add backend moderation step for teacher prompts/comments.
- Add status model: draft, pending moderation, approved, rejected, published.
- Student-visible content must be approved/published only.
- Rejection must provide teacher-safe, non-sensitive reason codes.
- Persist audit events for create, edit, moderation result, publish, unpublish, and delete.
- Add tests for valid publish, rejected unsafe prompt, rejected shortcut/cheating language, edit after publish requiring re-moderation, and unauthorized teacher actions.

## Acceptance Criteria

- Teacher content cannot become student-visible without backend moderation/approval.
- Moderation and publication events are auditable.
- UI exposes honest pending/rejected states.
- Product safety docs remain accurate.

## Validation

- Backend teacher moderation tests.
- Mobile teacher tests.
- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`

## Final Response

Include moderation model, files changed, tests run, and remaining provider/audit dependencies.
