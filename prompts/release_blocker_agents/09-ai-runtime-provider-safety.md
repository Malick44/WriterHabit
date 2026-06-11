# Agent Prompt: AI Runtime Provider And Safety

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close `WW-REL-007` and the AI portion of audit `P1-9`: mobile AI coach and feedback review still use deterministic local mocks, and backend AI scaffolds are not connected to a production provider.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/writing-screen-review/SKILL.md`.
6. Read this prompt.

## Scope

- Route AI coach/review requests through the backend runtime.
- Add provider adapter boundary, moderation, rate limits, usage limits, structured output validation, and audit persistence.
- Preserve academic-integrity rules.

## Files To Inspect

- `apps/mobile/src/features/ai-coach/**`
- `apps/mobile/src/features/feedback-review/**`
- `services/api/src/features/ai/**`
- `services/api/docs/AI_SAFETY_POLICY.md`
- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/AUDIT_LOGGING.md`
- `docs/CONTENT_LOCALIZATION_STRATEGY.md`

## Requirements

- No mobile client direct provider calls.
- Provider API keys only live in backend environment/secret storage.
- Add moderation before and after provider calls where appropriate.
- Add grade-band safety and age-appropriate response constraints.
- AI output must never complete the assignment for the student.
- Validate structured AI responses before storing or showing them.
- Persist audit metadata without storing unnecessary full student drafts.
- Add rate limits and usage limits by user/student/subscription where appropriate.
- Add tests for forbidden request handling, structured response validation, moderation fail, provider error, rate limit, and audit event persistence.

## Acceptance Criteria

- Mobile AI paths call authenticated backend endpoints.
- Deterministic mocks are dev/test-only.
- Backend AI provider adapter is production-configurable.
- Safety policy is enforced and tested.

## Validation

- Backend AI tests.
- Mobile AI/feedback tests.
- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`

## Final Response

Include provider boundary, safety controls, files changed, tests run, and any environment/secrets owner actions.
