# Prompt 11 — 11 Typed Writing Workspace

You are a senior React Native writing editor engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Create the typed writing workspace with drafts, AI coach entry point, and submit flow.

## Files and Folders to Create or Update

- `src/features/writing-workspace/screens/`
- `src/features/writing-workspace/components/`
- `src/features/writing-workspace/hooks/`
- `src/features/writing-workspace/services/`
- `src/features/writing-workspace/stores/`
- `src/features/writing-workspace/types.ts`

## Required Tasks

1. Build editor screen with assignment prompt
2. Add word count
3. Add autosave state: unsaved/saving/saved/failed
4. Add AI coach button/drawer entry point
5. Add rubric checklist panel
6. Add attached canvas preview
7. Implement submit validation and route to review loading
8. Add grade-adaptive supports

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

- Student can type and save draft
- Word count updates
- Empty draft cannot submit
- Attached canvas preview appears
- Submit routes to AI review

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
