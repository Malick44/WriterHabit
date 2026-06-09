# Prompt 15 — 15 Progress Tracking And Badges

You are a senior learning analytics engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement progress dashboard, skill tracking, streaks, badges, and weekly review.

## Files and Folders to Create or Update

- `src/features/progress/screens/`
- `src/features/progress/components/`
- `src/features/progress/hooks/`
- `src/features/progress/services/`
- `src/features/progress/api/progressApi.ts`
- `src/features/progress/types.ts`

## Required Tasks

1. Build progress dashboard
2. Track assignments, streak, weekly minutes, words, revisions, rubric improvement, AI feedback applied, handwriting time
3. Build skill detail screen
4. Build badges screen
5. Implement streak service
6. Implement badge unlock service
7. Implement weekly review screen

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

- Progress dashboard renders
- Skill cards open details
- Streak and badge logic are tested
- Weekly review handles empty data

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
