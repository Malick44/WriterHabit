# Prompt 24 — 24 Testing Strategy Implementation

You are a senior QA automation engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement testing foundation for critical flows and logic.

## Files and Folders to Create or Update

- `docs/TESTING_STRATEGY.md`
- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`

## Required Tasks

1. Add unit tests for onboarding, assignment status, progress, streaks, badges, AI policy, canvas serialization, entitlement gates
2. Add component tests for shared and feature cards
3. Scaffold integration tests for onboarding, assignment, canvas, feedback
4. Document E2E scenarios for Flow 1 and Flow 2

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

- Testing strategy exists
- Core unit tests exist
- Tests run with one command
- No test uses real AI provider

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
