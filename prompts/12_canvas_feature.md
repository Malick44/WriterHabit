# Prompt 12 — 12 Canvas Feature

You are a senior mobile engineer specializing in handwriting and drawing.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement the canvas feature for handwriting, drawing, brainstorming, and assignment attachment.

## Files and Folders to Create or Update

- `src/features/canvas/screens/`
- `src/features/canvas/components/`
- `src/features/canvas/hooks/`
- `src/features/canvas/stores/`
- `src/features/canvas/services/`
- `src/features/canvas/api/canvasApi.ts`
- `src/features/canvas/types.ts`

## Required Tasks

1. Build canvas template picker
2. Support blank page, lined paper, storyboard, mind map, essay plan, vocabulary web, handwriting practice, annotate passage
3. Create CanvasToolbar with pen, eraser, highlighter, color, stroke size, undo, redo, save, attach
4. Create stroke-based data model
5. Add local autosave and sync status
6. Attach canvas to assignment
7. Use adapter if drawing library is not installed

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

- Student can choose template
- Canvas saves locally
- Canvas can attach to assignment
- Preview appears in workspace
- Sync failure does not lose work

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
