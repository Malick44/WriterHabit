# Testing Strategy

WriterHabit testing is organized around the current Expo mobile app in `apps/mobile/` and the provider-free service boundaries under `services/api/`. The mobile Jest command is the active automated test entry point:

```bash
./script/build_and_run.sh --test
```

That command runs `npm test` in `apps/mobile/`. Jest uses `apps/mobile/jest.config.js` with the Expo preset and discovers:

- feature-owned tests under `apps/mobile/src/**/*.test.ts` and `apps/mobile/src/**/*.test.tsx`
- root acceptance unit tests under `tests/unit/**/*.test.ts` and `tests/unit/**/*.test.tsx`
- root integration scaffolds under `tests/integration/**/*.test.ts` and `tests/integration/**/*.test.tsx`

## Current Automated Coverage

Feature-owned unit tests cover the main logic-heavy modules:

- onboarding validation and personalized plan creation in `apps/mobile/src/features/onboarding/`
- assignment status transitions and daily assignment selection in `apps/mobile/src/features/assignments/`
- typed writing metrics, draft persistence, and draft reload recovery in `apps/mobile/src/features/writing-workspace/`
- canvas document normalization, persistence recovery, and sync scaffolding in `apps/mobile/src/features/canvas/`
- AI coach policy checks, context, prompts, and deterministic mock API behavior in `apps/mobile/src/features/ai-coach/`
- feedback review, rubric progress, revision validation, and revision draft persistence in `apps/mobile/src/features/feedback-review/`
- progress calculations, streaks, and badge unlocks in `apps/mobile/src/features/progress/`
- subscription entitlement gates in `apps/mobile/src/features/subscriptions/`
- parent and teacher view-model logic in their feature modules

Root unit tests in `tests/unit/` provide cross-feature acceptance coverage for the critical product rules named above, including AI policy safety and entitlement gates. Root component tests in `tests/unit/cards.component.test.tsx` cover shared card primitives, choice cards, assignment cards, and feedback summary cards.

Root integration tests in `tests/integration/` currently scaffold provider-free flows with deterministic mock APIs and mocked local JSON storage:

- onboarding completion to grade-adapted plan
- assignment history/detail readiness to submission
- canvas creation, stroke persistence, and attachment
- feedback review creation and focused revision validation
- oversized local draft/canvas recovery through feature-owned persistence tests

No test calls a real AI provider, payment provider, Supabase service-role path, or production backend.

## Test Boundaries

Use unit tests for pure or mostly pure behavior:

- progress calculations
- streak continuation and reminders
- badge unlocks
- onboarding validation and plan adaptation
- assignment status transitions
- AI coach request/output safety guards
- canvas serialization and payload bounds
- subscription entitlement decisions

Use component tests for UI contracts that must remain accessible and safe:

- shared cards, buttons, choice cards, feedback states, and progress indicators
- assignment, feedback, progress, subscription, parent, and teacher cards
- grade-band variants that affect visible metrics, button size, rubric detail, or simplified wording

Use integration tests for provider-free feature flows:

- onboarding state to personalized plan
- assignment selection, detail readiness, and submission payloads
- canvas local-first save and assignment attachment
- feedback review loading, rubric view-model, and revision validation

Use E2E tests for installed app behavior once a mobile E2E runner is added:

- first student assignment flow
- canvas-first assignment flow
- parent report review
- teacher assignment creation
- subscription upgrade prompt for gated features

## Mocking Policy

Mock these in automated tests:

- auth session state
- local JSON storage where persistence behavior is not under test
- deterministic mock API scenarios
- AI review and coach responses
- canvas upload and backend sync placeholders
- subscription entitlement responses

Do not mock these when they are the behavior under test:

- academic integrity checks
- assignment status transitions
- onboarding validation
- progress, streak, and badge calculations
- canvas document normalization and size limits
- entitlement gate decisions

## E2E Scenario Documents

The current repo does not include a mobile E2E runner such as Maestro or Detox. Until one is selected, E2E coverage is documented as executable scenario specs under:

- `tests/e2e/flow-1-student-first-assignment.md`
- `tests/e2e/flow-2-canvas-assignment.md`

When an E2E runner is introduced, keep those scenario names and convert each step into runner-native commands without adding cheating-oriented CTAs.
