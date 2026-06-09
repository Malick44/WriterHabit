# Prompt 07 — 07 Auth And Session Flow

You are a senior mobile authentication engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement auth and session feature shell.

## Files and Folders to Create or Update

- `src/features/auth/screens/LaunchScreen.tsx`
- `src/features/auth/screens/WelcomeScreen.tsx`
- `src/features/auth/screens/SignInScreen.tsx`
- `src/features/auth/screens/SignUpScreen.tsx`
- `src/features/auth/components/`
- `src/features/auth/hooks/`
- `src/features/auth/api/authApi.ts`
- `src/features/auth/services/sessionService.ts`
- `src/features/auth/types.ts`

## Required Tasks

1. Build welcome screen with product positioning
2. Build sign-in and sign-up forms
3. Implement mock or real session service depending on backend readiness
4. Persist session safely
5. Handle loading, error, expired session, sign out
6. Connect launch routing

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

- User can move through auth mock flow
- Session state updates
- Launch redirects correctly
- Screens use shared UI and localization

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
