# Prompt 05 — 05 Navigation And Role Routing

You are a senior Expo Router engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement role-based navigation and launch routing.

## Files and Folders to Create or Update

- `src/core/auth/authTypes.ts`
- `src/core/auth/authStore.ts`
- `src/core/auth/useAuthSession.ts`
- `src/core/auth/roleGuards.ts`
- `src/core/navigation/routeNames.ts`
- `src/core/navigation/roleRouter.ts`
- `src/core/navigation/deepLinks.ts`
- `app/_layout.tsx`
- `app/index.tsx`

## Required Tasks

1. Implement mock session state
2. Route unauthenticated users to auth
3. Route incomplete users to onboarding
4. Route students, parents, teachers to correct areas
5. Create student bottom tabs
6. Create parent bottom tabs
7. Create teacher navigation structure
8. Centralize route constants

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

- Launch routing works with mock session
- Role guards exist
- Navigation groups exist
- No feature logic is mixed into navigation

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
