# Architecture Decisions

This record documents current decisions and open decisions for WriteWise AI. It must stay aligned with the real repository under `/Users/malickdes/WorkSpace/writewise`.

## ADR-001: Mobile App Uses Expo Router

Status: accepted

The mobile app uses Expo Router with routes in `apps/mobile/app/`. Route files must stay thin and only import/export feature screens or app-level providers.

Current evidence:

- `apps/mobile/package.json` sets `"main": "expo-router/entry"`.
- `apps/mobile/app/index.tsx` exports `LaunchScreen`.
- Student, parent, teacher, onboarding, canvas, review, and paywall routes export feature screens.

Consequences:

- Navigation logic belongs in feature screens, hooks, or core routing helpers.
- Route files should not contain business logic, API calls, or state machines.

## ADR-002: Preserve Feature-Based Architecture

Status: accepted

Feature modules live in `apps/mobile/src/features/`. Each feature owns its screens, components, hooks, API client, services, stores, types, constants, and tests when needed.

Current feature modules:

```txt
apps/mobile/src/features/ai-coach/
apps/mobile/src/features/assignments/
apps/mobile/src/features/auth/
apps/mobile/src/features/canvas/
apps/mobile/src/features/feedback-review/
apps/mobile/src/features/onboarding/
apps/mobile/src/features/parent/
apps/mobile/src/features/profile-settings/
apps/mobile/src/features/progress/
apps/mobile/src/features/student-home/
apps/mobile/src/features/subscriptions/
apps/mobile/src/features/teacher/
apps/mobile/src/features/writing-workspace/
```

Consequences:

- Do not create global `screens/` or global feature logic folders.
- Do not import another feature's implementation details directly.
- Move shared contracts to `apps/mobile/src/shared/` or a future `packages/shared/` package.

## ADR-003: App State Is Split by Responsibility

Status: accepted

State ownership follows the product rules:

- Server state: TanStack Query.
- Local UI state: component state or Zustand.
- Persistent device state: secure/local storage facades.

Current evidence:

- `apps/mobile/src/core/providers/AppProviders.tsx` wraps the app with `apps/mobile/src/shared/query/QueryProvider.tsx`.
- `apps/mobile/src/shared/query/queryClient.ts` owns the shared TanStack Query client defaults.
- Zustand is used in `apps/mobile/src/shared/state/session.ts`, `apps/mobile/src/shared/state/preferences.tsx`, and canvas tool state.
- Secure storage facade exists in `apps/mobile/src/services/storage/secureStorage.ts`.

## ADR-004: Localization Is Required for User-Facing Copy

Status: accepted

User-facing strings should be localization-ready. The canonical shared i18n module lives in `apps/mobile/src/shared/i18n/`.

Current evidence:

- English dictionary: `apps/mobile/src/shared/i18n/en.ts`
- Translation types and provider: `apps/mobile/src/shared/i18n/types.ts` and `apps/mobile/src/shared/i18n/index.ts`
- Feature hook: `apps/mobile/src/shared/i18n/useT.ts`
- Compatibility exports: `apps/mobile/src/i18n/index.tsx` and `apps/mobile/src/i18n/locales/en.ts`

Consequences:

- New user-facing screen copy should use i18n keys from `apps/mobile/src/shared/i18n/en.ts`.
- Approved AI coaching CTAs must remain learning-oriented:
  - `Give me a hint`
  - `Help me brainstorm`
  - `Check my sentence`
  - `Explain this mistake`
  - `Help me revise`
  - `Suggest a stronger word`
  - `Ask me a question`
- Forbidden cheating-oriented CTAs must not appear:
  - `Write my essay`
  - `Finish for me`
  - `Give me the answer`
  - `Generate final draft`
  - `Do my homework`

## ADR-005: Strict TypeScript and Zod at Boundaries

Status: accepted

The app uses strict TypeScript. Zod is installed and should validate data crossing API, local storage, and AI service boundaries.

Current evidence:

- `apps/mobile/tsconfig.json` sets `"strict": true`.
- `zod` is installed in `apps/mobile/package.json`.
- API and local storage validation is not broadly implemented yet.

Consequences:

- Avoid `any`.
- Use discriminated unions for lifecycle states such as assignment status, AI review status, and subscription entitlement.
- Add Zod schemas before persisting or trusting remote/local/AI data.

## ADR-006: Testing Must Cover Logic-Heavy Work

Status: accepted

The package has a Jest Expo test setup and focused smoke coverage for foundation logic.

Current evidence:

- `apps/mobile/package.json` includes `jest-expo`, `@types/jest`, and `react-test-renderer`.
- `apps/mobile/jest.config.js` runs `apps/mobile/src/**/*.test.ts` and `apps/mobile/src/**/*.test.tsx`.
- Current tests cover progress scoring, grade-band typography token mapping, role routing decisions, i18n interpolation, accessibility settings helpers, onboarding validation/plan logic, auth validation, student home view-model decisions, assignment status transitions, writing draft persistence, writing metrics, canvas persistence/stroke behavior, and AI coach policy/context/prompt/mock API behavior.

Recommended first tests:

- `apps/mobile/src/features/progress/services/progressCalculator.ts`
- `apps/mobile/src/core/navigation/roleRouter.ts`
- AI safety guards and prompt builders under `apps/mobile/src/features/ai-coach/`
- Onboarding validation schemas when added
- Assignment status transitions when added
- Subscription entitlement gates when added

## ADR-007: Design Tokens Use the Canonical Mobile Design Path

Status: accepted

Design tokens live in `apps/mobile/src/design/tokens/`.

Current evidence:

- Semantic colors: `apps/mobile/src/design/tokens/colors.ts`
- Grade-adaptive typography: `apps/mobile/src/design/tokens/typography.ts`
- Spacing and layout metrics: `apps/mobile/src/design/tokens/spacing.ts`
- Radius, shadows, and motion: `apps/mobile/src/design/tokens/radius.ts`, `apps/mobile/src/design/tokens/shadows.ts`, and `apps/mobile/src/design/tokens/motion.ts`
- Legacy shared-theme compatibility exports remain in `apps/mobile/src/shared/theme/`.

Consequences:

- New code should import tokens from `@/design/tokens`.
- `apps/mobile/src/shared/theme/` should stay a thin compatibility layer.
- Token docs must use explicit token names, including motion tokens such as `duration.sm`, `easing.standard`, `spring.cardPress`, and `spring.playerTransition`.

## ADR-010: Shared UI Components Are Feature-Agnostic

Status: accepted

Shared UI primitives live under `apps/mobile/src/shared/components/` and do not own feature logic or product workflows.

Current evidence:

- Layout primitives: `apps/mobile/src/shared/components/layout/`
- Buttons: `apps/mobile/src/shared/components/buttons/`
- Cards: `apps/mobile/src/shared/components/cards/`
- Form controls: `apps/mobile/src/shared/components/forms/`
- Feedback states and progress: `apps/mobile/src/shared/components/feedback/`

Consequences:

- Feature-specific business logic, API state, and screen workflows stay inside `apps/mobile/src/features/`.
- Shared components accept labels and messages as props so feature screens can provide localized copy from `apps/mobile/src/shared/i18n/`.
- Interactive shared controls must include accessibility roles, labels, states, and minimum touch target sizing.

## ADR-011: Role Routing Is Centralized in Core Navigation

Status: accepted

Launch routing, role guards, route constants, and deep-link helpers live in `apps/mobile/src/core/` instead of route files.

Current evidence:

- Session state: `apps/mobile/src/core/auth/authStore.ts`
- Auth session hook: `apps/mobile/src/core/auth/useAuthSession.ts`
- Role guards: `apps/mobile/src/core/auth/roleGuards.ts`
- Route constants: `apps/mobile/src/core/navigation/routeNames.ts`
- Launch and access decisions: `apps/mobile/src/core/navigation/roleRouter.ts`
- Route group access gate: `apps/mobile/src/core/navigation/RouteGate.tsx`
- Deep-link helpers: `apps/mobile/src/core/navigation/deepLinks.ts`

Consequences:

- `apps/mobile/app/` route files remain thin exports or route-group layout shells.
- Unauthenticated users route to `/(auth)/welcome`.
- Authenticated users with incomplete onboarding route to `/(onboarding)/role-selection`.
- Completed student, parent, and teacher sessions route to their role homes.
- Paywall routing is guarded but role-neutral after auth and onboarding.

## ADR-012: Accessibility Preferences Are Persistent And Shared

Status: accepted

Accessibility preferences are owned by the profile-settings feature, persisted locally, and exposed to shared UI through a shared context.

Current evidence:

- Store and validation: `apps/mobile/src/features/profile-settings/accessibility/accessibilitySettingsStore.ts`
- Provider: `apps/mobile/src/features/profile-settings/accessibility/AccessibilitySettingsProvider.tsx`
- Shared helpers/context: `apps/mobile/src/shared/utils/accessibility.ts`
- App installation: `apps/mobile/src/core/providers/AppProviders.tsx`
- Settings screen: `apps/mobile/src/features/profile-settings/screens/AccessibilitySettingsScreen.tsx`

Consequences:

- Shared components can consume text size, high contrast, reduced motion, and touch target preferences without importing feature store internals.
- Future feature screens should use `useAccessibilityContext` and helpers from `apps/mobile/src/shared/utils/accessibility.ts`.
- Preference data crossing local storage is validated before use.

## ADR-013: Mobile Auth Uses Public Supabase Session State

Status: accepted

The mobile auth/session foundation lives in core auth and uses the public Supabase mobile client for email/password sign-in, sign-up, session restore, auth-state subscriptions, onboarding completion metadata, and sign-out.

Current evidence:

- Supabase public config: `apps/mobile/src/core/config/supabaseConfig.ts`
- Supabase client and persistence install: `apps/mobile/src/core/supabase/supabaseClient.ts`
- Session mapping and Supabase auth operations: `apps/mobile/src/core/auth/sessionService.ts`
- Session store and demo session fallback: `apps/mobile/src/core/auth/authStore.ts`
- Provider subscription lifecycle: `apps/mobile/src/core/auth/AuthSessionProvider.tsx`
- Auth feature screens and form contracts: `apps/mobile/src/features/auth/`

Consequences:

- Mobile code may use only `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the compatibility fallback `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Service-role keys and admin credentials must not appear in app code, docs, screenshots, `.codex` files, committed files, or CI logs.
- Route files remain thin; auth UI and validation live under `apps/mobile/src/features/auth/`.
- Demo sessions remain available through `EXPO_PUBLIC_WRITEWISE_MOCK_SESSION` and welcome-screen role shortcuts, but use `source: "mock"` and skip Supabase auth subscriptions.
- `apps/mobile/src/shared/state/session.ts` is only a compatibility wrapper over `apps/mobile/src/core/auth/useAuthSession.ts`.

## ADR-014: Student Onboarding Progress Is Feature-Owned And Locally Recoverable

Status: accepted

Student onboarding is a linear Expo Router flow owned by `apps/mobile/src/features/onboarding/`. It persists non-secret setup progress locally by signed-in user id, validates required choices with Zod, generates a deterministic starter plan on device, and completes the auth/session onboarding gate only from the plan summary step.

Current evidence:

- Route files: `apps/mobile/app/(onboarding)/`
- Store: `apps/mobile/src/features/onboarding/stores/onboardingStore.ts`
- Validation and route helpers: `apps/mobile/src/features/onboarding/types.ts`
- Local persistence: `apps/mobile/src/features/onboarding/services/onboardingPersistenceService.ts`
- Plan generation: `apps/mobile/src/features/onboarding/services/personalizedPlanService.ts`
- Auth completion metadata: `apps/mobile/src/core/auth/sessionService.ts`

Consequences:

- Route files remain thin exports.
- Onboarding screens use shared UI, shared localization, and accessibility-aware controls.
- Progress survives app restarts without storing secrets.
- Current Supabase auth metadata is the temporary completion boundary until dedicated student profile tables/API contracts are implemented.
- The student flow transitions to `/(student)/home` after completion.

## ADR-015: Student Home Dashboard Uses a Feature-Owned Read Model

Status: accepted

The student home dashboard is owned by `apps/mobile/src/features/student-home/`.
It consumes a Zod-validated feature API read model through TanStack Query and
turns it into a render-ready view model before the screen renders cards.

Current evidence:

- Screen: `apps/mobile/src/features/student-home/screens/StudentHomeScreen.tsx`
- Hook: `apps/mobile/src/features/student-home/hooks/useStudentHomeData.ts`
- API contract and mock data: `apps/mobile/src/features/student-home/api/studentHomeApi.ts`
- Zod schemas and types: `apps/mobile/src/features/student-home/types.ts`
- View-model logic and tests: `apps/mobile/src/features/student-home/services/studentHomeViewModel.ts`
- Route file: `apps/mobile/app/(student)/home.tsx` remains a thin feature export.

Consequences:

- Dashboard loading, empty, error, offline cached, and success states are explicit in the student-home feature.
- Grade adaptation is computed before rendering so elementary, middle, and high-school dashboard layouts can diverge without route changes.
- Dashboard navigation may link to existing assignment, writing workspace, progress, feedback, and canvas routes, but those downstream feature screens remain separately owned.
- AI coaching entry points on the dashboard must stay learning-oriented and may not offer assignment completion.

## ADR-016: Assignment Screens Own Student Assignment Status

Status: accepted

The assignment feature is owned by `apps/mobile/src/features/assignments/`.
It uses a Zod-validated feature API read model, TanStack Query hooks, and a
feature-owned status service for history tabs, start transitions, and guarded
submission.

Current evidence:

- History screen: `apps/mobile/src/features/assignments/screens/AssignmentHistoryScreen.tsx`
- Detail screen: `apps/mobile/src/features/assignments/screens/AssignmentDetailScreen.tsx`
- Submission screen: `apps/mobile/src/features/assignments/screens/AssignmentSubmissionScreen.tsx`
- Feature API and mock data: `apps/mobile/src/features/assignments/api/assignmentsApi.ts`
- Status service and tests: `apps/mobile/src/features/assignments/services/assignmentStatusService.ts`
- View-model service: `apps/mobile/src/features/assignments/services/assignmentViewModel.ts`
- Thin route files:
  - `apps/mobile/app/(student)/assignments/history.tsx`
  - `apps/mobile/app/(student)/assignments/[assignmentId].tsx`
  - `apps/mobile/app/(student)/assignments/submit.tsx`

Consequences:

- Assignment status is explicit: `not_started`, `in_progress`, `submitted`, `reviewing`, `feedback_ready`, `revision_in_progress`, and `completed`.
- History tabs are derived from status rather than hardcoded screen filters.
- Students can start typed writing or canvas planning from details, then return to a guarded submission checklist.
- Submission is allowed only when the assignment has student-created typed or canvas work.
- The feature currently uses deterministic mock data. Backend persistence and real assignment submission APIs remain future work.
- Assignment UI must continue to guide planning, drafting, revision, and submission without offering AI-completed work.

## ADR-017: Typed Writing Workspace Owns Local Draft Autosave

Status: accepted

The typed writing workspace is owned by `apps/mobile/src/features/writing-workspace/`.
It loads assignment context through the assignment feature API, restores a
feature-owned draft, autosaves locally, validates student-written text before
submission, and routes successful submissions to the feedback-review loading
route.

Current evidence:

- Screen: `apps/mobile/src/features/writing-workspace/screens/WritingWorkspaceScreen.tsx`
- Hook: `apps/mobile/src/features/writing-workspace/hooks/useWritingWorkspace.ts`
- API facade: `apps/mobile/src/features/writing-workspace/api/writingWorkspaceApi.ts`
- Local draft persistence: `apps/mobile/src/features/writing-workspace/services/draftPersistenceService.ts`
- Draft metrics and grade adaptation: `apps/mobile/src/features/writing-workspace/services/writingMetricsService.ts`
- UI state store: `apps/mobile/src/features/writing-workspace/stores/writingWorkspaceUiStore.ts`
- Local JSON storage facade: `apps/mobile/src/services/storage/localJsonStorage.ts`
- Tests:
  - `apps/mobile/src/features/writing-workspace/services/draftPersistenceService.test.ts`
  - `apps/mobile/src/features/writing-workspace/services/writingMetricsService.test.ts`

Consequences:

- Route file `apps/mobile/app/(student)/write/[assignmentId].tsx` remains a thin feature export.
- Draft state is explicit: restoring, unsaved, saving, saved, failed, empty, offline cached, and submitted-for-review paths are visible in the feature UI.
- Drafts are device-local until backend draft contracts are implemented. They are validated with Zod and capped before persistence.
- AI coach entry points are limited to approved learning actions: hint, brainstorming, guiding question, sentence check, revision help, explanation, and stronger word coaching.
- Backend submission and feedback summary remain separate feature prompts.

## ADR-018: Canvas Uses a Local Stroke Adapter Until a Drawing Engine Is Chosen

Status: accepted

The canvas feature is owned by `apps/mobile/src/features/canvas/`. Because no
dedicated drawing library is installed, the current mobile implementation uses a
React Native stroke adapter that captures taps as compact stroke records, renders
template guide surfaces, autosaves locally, and attaches canvas documents to
assignments.

Current evidence:

- Screens:
  - `apps/mobile/src/features/canvas/screens/CanvasHomeScreen.tsx`
  - `apps/mobile/src/features/canvas/screens/CanvasTemplatePickerScreen.tsx`
  - `apps/mobile/src/features/canvas/screens/HandwritingCanvasScreen.tsx`
  - `apps/mobile/src/features/canvas/screens/CanvasAttachmentScreen.tsx`
- Components:
  - `apps/mobile/src/features/canvas/components/CanvasToolbar.tsx`
  - `apps/mobile/src/features/canvas/components/StrokeCanvasAdapter.tsx`
  - `apps/mobile/src/features/canvas/components/CanvasTemplateCard.tsx`
  - `apps/mobile/src/features/canvas/components/CanvasDocumentCard.tsx`
- API and local persistence:
  - `apps/mobile/src/features/canvas/api/canvasApi.ts`
  - `apps/mobile/src/features/canvas/services/canvasPersistenceService.ts`
  - `apps/mobile/src/features/canvas/services/canvasDocumentService.ts`
- State:
  - `apps/mobile/src/features/canvas/hooks/useCanvas.ts`
  - `apps/mobile/src/features/canvas/stores/canvasToolStore.ts`
- Tests:
  - `apps/mobile/src/features/canvas/services/canvasDocumentService.test.ts`
  - `apps/mobile/src/features/canvas/services/canvasPersistenceService.test.ts`

Consequences:

- Route files under `apps/mobile/app/(student)/canvas/` remain thin feature exports.
- Canvas documents are local, non-secret student work persisted through the shared local JSON storage facade.
- Canvas storage is bounded: 24 documents per student, 240 strokes per document, 16 points per stroke, and 12 undo snapshots.
- Current sync states are local/device states. Backend sync, preview image generation, file export, object storage, and handwriting recognition remain future work.
- The typed writing workspace reads attached canvas summaries through the canvas feature API, so an attached page can appear without importing canvas screen internals.

## ADR-019: AI Coach Uses a Local Policy-Safe Service Boundary

Status: accepted

The AI coach feature is owned by `apps/mobile/src/features/ai-coach/`. The
current implementation uses a deterministic local mock API instead of a backend
AI call. It validates AI context and responses with Zod, keeps request context
bounded, blocks assignment-completion intent through a feature-owned policy
service, and renders the coach drawer from the typed writing workspace.

Current evidence:

- Drawer: `apps/mobile/src/features/ai-coach/components/AiCoachDrawer.tsx`
- Hook: `apps/mobile/src/features/ai-coach/hooks/useAiCoach.ts`
- API facade: `apps/mobile/src/features/ai-coach/api/aiCoachApi.ts`
- Bounded context builder: `apps/mobile/src/features/ai-coach/services/aiCoachContextService.ts`
- Policy guard: `apps/mobile/src/features/ai-coach/services/aiCoachPolicyService.ts`
- Grade-aware prompt builder: `apps/mobile/src/features/ai-coach/prompts/coachPrompt.ts`
- Tests: `apps/mobile/src/features/ai-coach/services/aiCoachPolicyService.test.ts`
- Workspace bridge: `apps/mobile/src/features/writing-workspace/components/CoachEntryPanel.tsx`

Consequences:

- The coach supports idle, loading, empty, error, offline, safety-blocked, and success states without route-file logic.
- Visible actions remain approved learning actions only: hint, brainstorming, guiding question, sentence check, revision help, explanation, and stronger word coaching.
- Coach requests carry assignment metadata, grade level, skill focus, rubric criteria, writing metrics, optional canvas summary, and a bounded draft excerpt rather than the full draft.
- TanStack Query mutation state uses a short garbage-collection window for coach responses; full drafts and canvas documents remain owned by their source features.
- Backend AI calls, usage limits, audit-safe metadata logging, and feedback review generation remain future work.

## ADR-008: Backend API Remains Framework-Neutral for Now

Status: proposed

`services/api/README.md` lists backend responsibilities but does not choose NestJS, Spring Boot, or another framework.

Decision needed:

- Choose backend framework and database migration tooling before implementing API contracts.

Backend responsibilities currently documented:

- Authentication integration.
- User, student, parent, and teacher management.
- Daily assignment generation.
- Assignment lifecycle.
- Draft persistence.
- Canvas file storage.
- AI review queue.
- Progress calculation.
- Parent and teacher reporting.
- Subscription entitlement sync.
- Notifications and weekly reports.

## ADR-009: AI Coach Must Teach, Not Complete Assignments

Status: accepted

WriteWise AI is a learning app. AI features must help students think, plan, revise, and improve their own writing.

Current evidence:

- `apps/mobile/src/features/ai-coach/prompts/coachPrompt.ts` and `apps/mobile/src/features/ai-coach/prompts/reviewPrompt.ts` instruct the model boundary to coach instead of producing a finished response.
- `apps/mobile/src/features/ai-coach/services/aiCoachPolicyService.ts` blocks assignment-completion intent before response generation and validates output before display.
- `apps/mobile/src/features/ai-coach/components/AiCoachDrawer.tsx` renders only approved coaching actions.

Consequences:

- AI prompts and UI actions must avoid assignment-completion language.
- AI review output should provide coaching, feedback, and revision tasks.
- AI service input/output should be validated with Zod before display or persistence.
