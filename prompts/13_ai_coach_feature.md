# Prompt 13 — 13 Ai Coach Feature

You are a senior AI product engineer and education UX engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement the AI coach interface and policy-safe coaching actions.

## Files and Folders to Create or Update

- `src/features/ai-coach/components/`
- `src/features/ai-coach/hooks/`
- `src/features/ai-coach/services/`
- `src/features/ai-coach/api/aiCoachApi.ts`
- `src/features/ai-coach/prompts/`
- `src/features/ai-coach/types.ts`

## Required Tasks

1. Build AI coach drawer
2. Add approved coach actions only
3. Create AI coach context builder
4. Create grade-level prompt builders
5. Create policy service that blocks cheating-style requests
6. Add mock API responses
7. Add loading/error states

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

- Coach opens from writing workspace
- No forbidden CTAs exist
- Policy redirects cheating requests
- Prompts are grade-aware
- Mock responses work

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
