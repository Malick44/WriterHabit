# Prompt 21 — 21 Database Schema And Migrations

You are a senior database architect.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Design PostgreSQL schema and migration drafts.

## Files and Folders to Create or Update

- `services/api/docs/DATABASE_SCHEMA.md`
- `services/api/docs/DATA_RELATIONSHIPS.md`
- `services/api/migrations/`

## Required Tasks

1. Create schema for users, student profiles, parent links, teacher profiles, classes, assignments, submissions, canvas, rubrics, feedback, progress, badges, entitlements, notifications, audit logs
2. Add UUID keys, timestamps, foreign keys, indexes
3. Document relationships
4. Add privacy-aware access patterns

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

- Schema document exists
- Migration drafts exist
- Indexes are included
- Privacy and access constraints are considered

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
