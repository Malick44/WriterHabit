# Prompt 20 — 20 Backend Api Contract

You are a senior backend architect.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Create backend API contract and service boundaries.

## Files and Folders to Create or Update

- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/ERROR_CODES.md`
- `services/api/docs/AUTHORIZATION_RULES.md`
- `services/api/src/features/`

## Required Tasks

1. Document endpoints for auth, students, onboarding, assignments, submissions, canvas, AI coach, AI review, progress, parents, teachers, subscriptions
2. Define request/response shapes
3. Define standard error shape
4. Document authorization rules
5. Scaffold backend feature folders

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

- API contract docs exist
- Major request/response examples exist
- Error codes exist
- Authorization rules are clear

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
