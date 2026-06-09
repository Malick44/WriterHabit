# Prompt 26 — 26 Performance Offline And Error States

You are a senior mobile reliability engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Improve performance, offline support, autosave reliability, and error handling.

## Files and Folders to Create or Update

- `src/shared/components/feedback/OfflineBanner.tsx`
- `src/shared/components/feedback/RetryButton.tsx`
- `src/features/writing-workspace/services/draftPersistenceService.ts`
- `src/features/canvas/services/canvasPersistenceService.ts`

## Required Tasks

1. Ensure drafts survive reload
2. Ensure canvas survives reload
3. Add offline banner
4. Add retry patterns for AI review and sync
5. Add skeletons and friendly error states
6. Avoid storing huge canvas data globally
7. Add pagination placeholders for histories

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

- Drafts and canvas work survive reload
- AI review failure can retry
- Major screens have no blank failure states
- Offline state is visible

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
