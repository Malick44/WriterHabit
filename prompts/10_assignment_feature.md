# Prompt 10 — 10 Assignment Feature

You are a senior education app engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement assignment detail, start, submit, and history flows.

## Files and Folders to Create or Update

- `src/features/assignments/screens/`
- `src/features/assignments/components/`
- `src/features/assignments/hooks/`
- `src/features/assignments/api/assignmentsApi.ts`
- `src/features/assignments/services/`
- `src/features/assignments/types.ts`

## Required Tasks

1. Build assignment detail screen
2. Show prompt, skill focus, estimated time, difficulty, rubric checklist
3. Add Start Writing and Start with Canvas CTAs
4. Build assignment history tabs: All, Drafts, Submitted, Reviewed
5. Implement assignment status service
6. Prepare final submission screen

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

- Student can open assignment detail
- Student can start typed writing or canvas
- Assignment history renders
- Rubric adapts by grade and assignment type

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
