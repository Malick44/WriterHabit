# WriterHabit AI Implementation Plan

## Scope

This document records the current repository audit and phased implementation plan before feature work continues. It is based on the real repository state under `/Users/malickdes/WorkSpace/WriterHabit` and the product rules in `docs/00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md`.

No product features are implemented by this document.

## Current Repository Snapshot

The repository is organized as a mobile-first product with supporting docs and backend notes:

```txt
apps/mobile/        Expo React Native app
docs/               Product, architecture, and implementation docs
prompts/            Agent execution prompts
services/api/       Backend API contract docs and framework-neutral feature stubs
skills/             Local agent skills
templates/          Prompt templates
```

The mobile app is the only package with a package manager lockfile. It uses npm, indicated by `apps/mobile/package-lock.json`.

## Tooling Detection

| Area | Current state |
|---|---|
| Expo | Present: `expo@^56.0.9` in `apps/mobile/package.json` |
| Expo Router | Present: `expo-router@~56.2.9`; routes live in `apps/mobile/app/` |
| TypeScript | Present: `typescript@^6.0.3`; strict mode enabled in `apps/mobile/tsconfig.json` |
| TanStack Query | Present: `@tanstack/react-query`; provider exists in `apps/mobile/src/core/providers/AppProviders.tsx` |
| Zustand | Present: `zustand`; used by session, preferences, and canvas tool state |
| React Hook Form | Installed; no audited screen usage found yet |
| Zod | Installed; no audited API/local-storage validation boundary usage found yet |
| Localization | Present: canonical shared i18n in `apps/mobile/src/shared/i18n/` with compatibility exports in `apps/mobile/src/i18n/` |
| Testing | Present: `jest-expo`, `@types/jest`, `@testing-library/react-native`, and `react-test-renderer` are dev dependencies; `apps/mobile/jest.config.js` runs feature-owned tests under `apps/mobile/src/`, root unit tests under `tests/unit/`, and root integration tests under `tests/integration/` |
| Native projects | No `apps/mobile/ios/` or `apps/mobile/android/` folder is present; the app is currently CNG/prebuild style |

## Existing Mobile Structure

The repository already follows the intended feature-based direction:

```txt
apps/mobile/app/                    Thin Expo Router route files
apps/mobile/src/core/               App infrastructure
apps/mobile/src/features/           Product feature modules
apps/mobile/src/shared/             Shared UI, query, state, and theme utilities
apps/mobile/src/shared/i18n/        Canonical localization foundation
apps/mobile/src/i18n/               Localization compatibility exports
apps/mobile/src/services/           Device service facades
```

Current feature modules:

```txt
ai-coach
assignments
auth
canvas
feedback-review
onboarding
parent
profile-settings
progress
student-home
subscriptions
teacher
writing-workspace
```

Each audited route file imports and exports a feature screen, which aligns with the thin-route rule. Example: `apps/mobile/app/(student)/home.tsx` exports `StudentHomeScreen` from `apps/mobile/src/features/student-home/screens/StudentHomeScreen.tsx`.

## Current Implementation Quality

The app is scaffolded but not feature-complete:

- `apps/mobile/src/features/subscriptions/` now includes a guarded paywall, upgrade prompt screen, entitlement hook/service, entitlement gate component, Zod-validated deterministic subscription mock API, restore purchases placeholder, localized trust copy, and entitlement service tests.
- `apps/mobile/src/features/teacher/` now includes teacher dashboard, assignments list, assignment creation, class progress, submissions queue, submission review, Zod-validated mock API contracts, query hooks, and teacher view-model tests.
- Remaining placeholder work is concentrated in backend-dependent persistence/integration and profile-settings surfaces.
- `apps/mobile/src/features/parent/` now includes parent home, student selector, detailed student report, assignment review, parent settings, Zod-validated mock API contracts, query hooks, and parent view-model tests.
- `apps/mobile/src/features/progress/` now includes a local progress dashboard, skill detail, badges, weekly review, streak service, badge unlock service, and focused progress tests.
- `apps/mobile/src/features/assignments/services/dailyAssignmentService.ts` now selects daily assignments from grade, goals, history, weak skills, daily minutes, repeat avoidance, inactivity, and gradual difficulty adjustment.
- `apps/mobile/src/core/notifications/notificationService.ts` and `apps/mobile/src/features/profile-settings/services/notificationPreferencesService.ts` now provide provider-free notification preparation and local notification preferences.
- `apps/mobile/src/features/ai-coach/` now includes a policy-safe drawer, bounded context builder, grade-aware prompt builder, deterministic mock API, and safety tests.
- `apps/mobile/src/features/feedback-review/` now includes a deterministic local mock review API, feedback summary, rubric score, grammar suggestion cards, one focused revision task, and completion celebration.
- Shared UI primitives exist under `apps/mobile/src/shared/components/` for layout, buttons, cards, forms, feedback states, and progress.
- Design tokens live in the canonical token path `apps/mobile/src/design/tokens/`. Legacy shared theme files in `apps/mobile/src/shared/theme/` re-export those tokens for compatibility.

## Files and Areas That Should Not Be Touched Casually

Do not edit these areas unless the task explicitly requires it:

- `apps/mobile/node_modules/`
- `apps/mobile/.expo/`
- `.DS_Store` files
- `apps/mobile/package-lock.json` except when dependency changes are intentional
- Generated native folders if they appear from `expo prebuild` or `expo run:ios`: `apps/mobile/ios/` and `apps/mobile/android/`
- Existing docs that are screen sources of truth, unless the task is explicitly updating screen specs
- `prompts/` files, unless the task is prompt maintenance

## Risk Areas

1. Testing now has a documented strategy, feature-owned service tests, root unit acceptance tests, root integration scaffolds, and documented E2E scenarios. A mobile E2E runner has not been selected yet.
2. Backend runtime shell exists in `services/api/` with Fastify, JWT auth, standard errors, health, and fail-closed route shells. Production migration runner, deployed API infrastructure, resource-level handlers, and persistence remain open.
3. Data validation is enforced for the new API shell and several local/AI boundaries, but production feature handlers still need route-specific Zod schemas as they are implemented.
4. Accessibility and localization foundations exist, but placeholder feature screens still need screen-specific labels, roles, and i18n keys as they are implemented.
5. Token architecture is established at `apps/mobile/src/design/tokens/`; future screens still need to migrate away from ad hoc local styles as they are implemented.
6. Query provider usage is consolidated through `apps/mobile/src/shared/query/QueryProvider.tsx`.

## Architecture Migration Plan

The project should preserve its current feature-based layout and migrate incrementally:

1. Keep every Expo Router file thin.
2. Move real screen logic into feature screens, not route files.
3. Keep feature-specific components, hooks, API clients, services, stores, types, constants, and tests inside each feature folder.
4. Promote cross-feature contracts to `apps/mobile/src/shared/` or a future `packages/shared/` package.
5. Add `__tests__/` folders only where there is logic or high-risk UI behavior.
6. Keep design token imports aligned with the canonical path `apps/mobile/src/design/tokens/` and update docs when token modules change.

## Phased Implementation Plan

### Phase 0: Stabilize Foundation

Deliverables:

- Maintain the direct Jest Expo test setup.
- Keep provider usage normalized around `apps/mobile/src/shared/query/QueryProvider.tsx`.
- Extend the design token modules at `apps/mobile/src/design/tokens/` as new needs appear.
- Use the shared UI accessibility conventions in `apps/mobile/src/shared/components/` and helpers in `apps/mobile/src/shared/utils/accessibility.ts`.
- Keep `expo-doctor` and `npm run typecheck` passing.

Definition of done:

- The app launches.
- TypeScript passes.
- Expo Doctor passes.
- At least one logic test proves the test runner works.

### Phase 1: Navigation, Auth Shell, and Role Routing

Deliverables:

- Complete launch routing.
- Implement role-aware route guards in `apps/mobile/src/core/auth/roleGuards.ts`.
- Persist Supabase authenticated session state through `apps/mobile/src/core/supabase/supabaseClient.ts`.
- Store signed-in student onboarding completion in `student_profiles`, with minimal Supabase auth metadata retained only for the current mobile route gate.
- Keep auth route files as thin exports.

Definition of done:

- Student, parent, and teacher roles route to the correct shell.
- Loading, empty, error, and success states exist for auth/session hydration.

### Phase 2: Student Onboarding

Deliverables:

- Role selection, grade selection, writing goals, daily practice goal, and plan summary.
- React Hook Form and Zod validation for persisted onboarding data.
- Grade-adapted copy and controls.

Definition of done:

- Onboarding creates a valid student profile.
- Grades 1-5, 6-8, and 9-12 receive appropriate UI density and wording.

### Phase 3: Student Home and Assignments

Deliverables:

- Student dashboard.
- Daily assignment card.
- Assignment detail and assignment history.
- Start assignment action.

Definition of done:

- Student can open the daily assignment and move into the writing workspace.
- Empty/error/loading/success states are visible and accessible.

### Phase 4: Writing Workspace

Deliverables:

- Typed editor implemented in `apps/mobile/src/features/writing-workspace/`.
- Local draft autosave, recovery, validation, and same-student/same-assignment oversized text recovery.
- Outline builder.
- Rubric checklist.
- AI coach drawer using approved coaching CTAs only.
- Attached canvas preview.
- Submit route into AI review loading.

Definition of done:

- Student can write and save a draft without losing local progress.
- Empty drafts cannot be submitted.
- The UI does not offer cheating-oriented actions.
- Backend draft/submission persistence remains future work.

### Phase 5: Canvas

Deliverables:

- Canvas home.
- Template picker.
- Handwriting canvas.
- Local artifact persistence through `apps/mobile/src/features/canvas/services/canvasPersistenceService.ts`.
- Local-first sync orchestration through `apps/mobile/src/features/canvas/services/canvasSyncService.ts`.
- Same-student canvas reload recovery for oversized stroke documents and per-summary index filtering for malformed local index entries.
- Backend metadata, signed upload, attach, and export placeholders under `services/api/src/features/canvas/`.
- Assignment attachment flow.

Definition of done:

- Student can create, save, reopen, and attach a canvas artifact.
- Sync failure preserves local canvas work and surfaces a retryable error state.
- File handling avoids reading large files fully into JS memory.

### Phase 6: AI Coach and Feedback Review

Deliverables:

- Maintain implemented AI coach safety guardrails, context builder, prompt builder, mock API, and drawer.
- Review loading state.
- Structured feedback summary.
- One revision task per review cycle.
- Rubric scoring display.
- Grammar suggestion cards and completion celebration.

Definition of done:

- AI feedback helps students revise their own writing.
- The service boundary validates input/output with Zod.
- Current progress earned links to the local progress dashboard; backend progress sync remains future work.
- AI review retry is user-visible through the loading/error screen while keeping automatic query retries disabled for review generation.

### Phase 7: Progress, Parent, Teacher, and Subscriptions

Deliverables:

- Progress calculations and badges.
- Parent reports.
- Maintain the implemented teacher dashboard, assignment creation, class progress, and submission review workflows.
- Subscription entitlement checks and paywall.
- Shared offline banner, retry button, skeleton loading affordances, bounded query cache defaults, and pagination placeholders for assignment/canvas/teacher history-style lists.

Definition of done:

- Logic-heavy calculations and gates have focused tests.
- Parent and teacher views use the same assignment/progress contracts without feature-to-feature implementation imports.

## Validation Commands

Preferred project-root commands:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --doctor
./script/build_and_run.sh --test
```

Equivalent mobile app commands from `apps/mobile/`:

```bash
npm run typecheck
npx expo-doctor
npm test
```

## Next Recommended Prompt

The canonical prompt sequence through `prompts/27_final_qa_release_checklist.md`
is complete. Next engineering work should close the P0/P1 release blockers in
`docs/KNOWN_ISSUES.md`, starting with the production backend/runtime,
authorization, payment entitlement sync, E2E runner, and lint tooling.
