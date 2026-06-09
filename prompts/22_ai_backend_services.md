# Prompt 22 — 22 Ai Backend Services

You are a senior AI backend engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement/scaffold AI backend services for safe coaching and review.

## Files and Folders to Create or Update

- `services/api/src/features/ai/coach/`
- `services/api/src/features/ai/review/`
- `services/api/src/features/ai/safety/`
- `services/api/src/features/ai/prompts/`
- `services/api/src/features/ai/moderation/`
- `services/api/src/features/ai/usage/`

## Required Tasks

1. Create AiCoachService, AiReviewService, AiPromptBuilderService, AiSafetyPolicyService, AcademicIntegrityService, AiModerationService, AiUsageLimitService
2. Implement structured feedback contract
3. Add mock provider
4. Add input/output moderation placeholders
5. Add usage limits and cost controls

## Product Requirements

- Preserve feature-based architecture.
- Keep route files thin.
- Use TypeScript strictly.
- Use localization-ready copy.
- Add accessibility labels to interactive controls.
- Include loading, empty, error, and success states where applicable.
- Do not add cheating-oriented AI actions.
- Do not rewrite unrelated files.

## Grade Adaptation Requirements

When the feature touches student UI, support these variants:

- Grades 1–5: larger controls, simpler wording, fewer visible metrics, friendly visual cues.
- Grades 6–8: structured learning cards, skill progress, paragraph and revision support.
- Grades 9–12: mature layout, essay tools, rubric detail, productivity-focused UI.

## Acceptance Criteria

- AI services are isolated
- Prompt builders are grade-aware
- Academic integrity policy exists
- Structured parser exists
- Mock provider works

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
