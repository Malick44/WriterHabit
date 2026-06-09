# Prompt 23 — 23 Canvas Storage And Sync

You are a senior backend/mobile sync engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement/scaffold local-first canvas storage and backend sync.

## Files and Folders to Create or Update

- `src/features/canvas/services/canvasSyncService.ts`
- `services/api/src/features/canvas/`

## Required Tasks

1. Implement local-first save flow
2. Debounce stroke persistence
3. Create backend metadata endpoints
4. Create signed upload placeholder
5. Attach canvas to assignment
6. Generate preview/export placeholder
7. Ensure sync failure preserves local work

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

- Canvas local persistence exists
- Sync service exists
- Backend storage contract exists
- Attach flow works
- Clear sync error state exists

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
