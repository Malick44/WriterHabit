# Prompt 04 — 04 Design System And Shared Ui

You are a senior mobile product designer and React Native engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement the design system and shared reusable UI foundation.

## Files and Folders to Create or Update

- `src/shared/theme/colors.ts`
- `src/shared/theme/typography.ts`
- `src/shared/theme/spacing.ts`
- `src/shared/theme/radius.ts`
- `src/shared/theme/shadows.ts`
- `src/shared/theme/motion.ts`
- `src/shared/components/layout/`
- `src/shared/components/buttons/`
- `src/shared/components/cards/`
- `src/shared/components/forms/`
- `src/shared/components/feedback/`

## Required Tasks

1. Create semantic color tokens
2. Create grade-adaptive typography scale
3. Create reusable layout primitives
4. Create buttons, cards, form controls, progress indicators
5. Ensure accessibility labels and hit areas
6. Use tokens instead of random hardcoded styles

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

- Shared UI compiles
- Components are feature-agnostic
- Loading/empty/error primitives exist
- Design supports phone and tablet

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
