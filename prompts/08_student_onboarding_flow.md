# Prompt 08 — 08 Student Onboarding Flow

You are a senior product engineer implementing onboarding.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Create the student onboarding flow that personalizes assignments and feedback.

## Files and Folders to Create or Update

- `src/features/onboarding/screens/`
- `src/features/onboarding/components/`
- `src/features/onboarding/stores/onboardingStore.ts`
- `src/features/onboarding/services/`
- `src/features/onboarding/api/onboardingApi.ts`
- `src/features/onboarding/types.ts`

## Required Tasks

1. Build role selection
2. Build grade selection grouped by elementary/middle/high
3. Build writing goals with multi-select
4. Build confidence screen
5. Build daily goal selection
6. Build personalized plan loading and summary
7. Validate required choices
8. Persist onboarding completion

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

- Onboarding state persists through the flow
- User cannot continue without required selections
- Plan summary reflects selected data
- Completion routes to student home

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
