# Prompt 06 — 06 Localization Accessibility Foundation

You are a senior accessibility-focused mobile engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Make the app localization-ready and accessibility-ready from the beginning.

## Files and Folders to Create or Update

- `src/shared/i18n/index.ts`
- `src/shared/i18n/en.ts`
- `src/shared/i18n/types.ts`
- `src/shared/i18n/useT.ts`
- `src/features/profile-settings/accessibility/`
- `src/shared/utils/accessibility.ts`

## Required Tasks

1. Create English localization keys for all major feature areas
2. Create useT hook
3. Create accessibility settings store
4. Support larger text, dyslexia-friendly font, high contrast, reduced motion, text-to-speech, speech-to-text, simplified UI
5. Add accessibility utility helpers

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

- Localization hook works
- Accessibility settings persist locally
- Shared UI can consume accessibility settings
- New user-facing copy uses keys

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
