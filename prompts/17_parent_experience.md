# Prompt 17 — 17 Parent Experience

You are a senior family learning product engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement parent dashboard, reports, assignment review, and settings.

## Files and Folders to Create or Update

- `src/features/parent/screens/`
- `src/features/parent/components/`
- `src/features/parent/hooks/`
- `src/features/parent/services/`
- `src/features/parent/api/parentApi.ts`
- `src/features/parent/types.ts`

## Required Tasks

1. Build parent home with student selector
2. Show weekly progress, streak, completed assignments, skill improvement, area to practice
3. Build detailed student report
4. Build assignment review with student work, canvas preview, AI feedback, rubric
5. Build parent settings

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

- Parent can view dashboard
- Parent can switch students
- Parent can view report and assignment
- Loading/empty/error states exist

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
