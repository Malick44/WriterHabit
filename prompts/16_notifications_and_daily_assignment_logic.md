# Prompt 16 — 16 Notifications And Daily Assignment Logic

You are a senior mobile engagement engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement daily assignment selection logic and notification preparation.

## Files and Folders to Create or Update

- `src/features/assignments/services/dailyAssignmentService.ts`
- `src/features/progress/services/streakService.ts`
- `src/features/profile-settings/services/notificationPreferencesService.ts`
- `src/core/notifications/notificationService.ts`

## Required Tasks

1. Select daily assignment from grade, goals, history, weak skills, daily minutes
2. Avoid repeating same type too often
3. Gradually adjust difficulty
4. Prefer easier work after inactivity
5. Add notification preferences
6. Prepare daily, streak, incomplete, weekly report notification types

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

- Daily assignment selector is tested
- Streak continuation logic is tested
- Notification preference model exists
- No real push provider required for MVP

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
