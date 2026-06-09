# Prompt 09 — 09 Student Home Dashboard

You are a senior mobile product engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement the student dashboard as the main daily hub.

## Files and Folders to Create or Update

- `src/features/student-home/screens/StudentHomeScreen.tsx`
- `src/features/student-home/components/`
- `src/features/student-home/hooks/useStudentHomeData.ts`
- `src/features/student-home/api/studentHomeApi.ts`
- `src/features/student-home/services/studentHomeViewModel.ts`
- `src/features/student-home/types.ts`

## Required Tasks

1. Show greeting
2. Show today’s assignment card
3. Show streak card
4. Show weekly writing minutes
5. Show skill progress preview
6. Show continue draft card
7. Show recent feedback
8. Add grade-adaptive layout

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

- Dashboard renders realistic mock/API data
- Cards navigate correctly
- Loading, empty, and error states exist
- UI adapts by grade group

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
