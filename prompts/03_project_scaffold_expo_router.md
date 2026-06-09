# Prompt 03 — 03 Project Scaffold Expo Router

You are a senior Expo/React Native engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Create the base Expo Router scaffold using feature-based architecture.

## Files and Folders to Create or Update

- `apps/mobile/app/_layout.tsx`
- `apps/mobile/app/(auth)/`
- `apps/mobile/app/(onboarding)/`
- `apps/mobile/app/(student)/`
- `apps/mobile/app/(parent)/`
- `apps/mobile/app/(teacher)/`
- `apps/mobile/src/core/`
- `apps/mobile/src/shared/`
- `apps/mobile/src/features/`

## Required Tasks

1. Create route groups for auth, onboarding, student, parent, teacher, settings, paywall, upgrade
2. Configure TypeScript path aliases
3. Create AppProviders with QueryClientProvider placeholder
4. Create apiClient and appConfig
5. Create placeholder screens for every major feature
6. Keep all route files thin

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

- App compiles
- All route imports resolve
- Path aliases work
- No business logic exists inside route files

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
