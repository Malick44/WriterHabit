# Prompt 14 — 14 Ai Review Feedback Revision

You are a senior education product engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement AI review, feedback summary, rubric scoring, grammar suggestions, revision, and celebration.

## Files and Folders to Create or Update

- `src/features/feedback-review/screens/`
- `src/features/feedback-review/components/`
- `src/features/feedback-review/hooks/`
- `src/features/feedback-review/services/`
- `src/features/feedback-review/api/feedbackReviewApi.ts`
- `src/features/feedback-review/types.ts`

## Required Tasks

1. Build AI review loading screen
2. Show feedback summary: strength, improvement, revision task, progress earned
3. Build rubric score screen
4. Build grammar suggestion cards
5. Build revision screen with before/after comparison
6. Build completion celebration

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

- Submitted assignment routes to loading
- Feedback renders from mock/API
- Student gets one clear revision task
- Revision can be submitted
- Completion updates progress placeholder

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
