# Architecture Decisions

This record documents current decisions and open decisions for WriteWise AI. It must stay aligned with the real repository under `/Users/malickdes/WorkSpace/writewise`.

## ADR-001: Mobile App Uses Expo Router

Status: accepted

The mobile app uses Expo Router with routes in `apps/mobile/app/`. Route files must stay thin and only import/export feature screens or app-level providers.

Current evidence:

- `apps/mobile/package.json` sets `"main": "expo-router/entry"`.
- `apps/mobile/app/index.tsx` exports `LaunchScreen`.
- Student, parent, teacher, onboarding, canvas, review, and paywall routes export feature screens.
- `apps/mobile/app/paywall.tsx` stays thin and exports `PaywallRouteScreen`.

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
- Subscription entitlement state and checkout/restore placeholders use TanStack Query in `apps/mobile/src/features/subscriptions/hooks/useSubscriptions.ts`.

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
- API, local storage, subscription entitlement, and AI service boundaries increasingly use Zod validation, but backend contracts still need schema coverage as they are implemented.

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
- Current tests cover progress scoring, grade-band typography token mapping, role routing decisions, i18n interpolation, accessibility settings helpers, onboarding validation/plan logic, auth validation, student home view-model decisions, assignment status transitions, writing draft persistence, writing metrics, canvas persistence/stroke behavior, AI coach policy/context/prompt/mock API behavior, parent view-model adaptation/rubric totals, teacher view-model behavior, and subscription entitlement gate decisions.

Recommended first tests:

- `apps/mobile/src/features/progress/services/progressCalculator.ts`
- `apps/mobile/src/core/navigation/roleRouter.ts`
- AI safety guards and prompt builders under `apps/mobile/src/features/ai-coach/`
- Onboarding validation schemas when added
- Assignment status transitions when added
- Subscription entitlement gate screen/component rendering

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

The mobile auth/session foundation lives in core auth and uses the public Supabase mobile client for email login-link sign-in, email/password sign-up, session restore, auth-state subscriptions, onboarding completion metadata, and sign-out.

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
- Demo sessions remain available through `EXPO_PUBLIC_WRITEWISE_MOCK_SESSION` and the development-only demo-user panel on auth and signed-in screens, but use `source: "mock"` and skip Supabase auth subscriptions.
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
- Assignment bookmarking is deferred until a backend-backed saved-assignment model, filtered saved list, offline behavior, and RLS policy are designed together. The current release should not show a nonfunctional bookmark affordance.
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
- Backend submission persistence remains future work. The current feedback-review feature can render local mock review results after submission.

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
  - `apps/mobile/src/features/canvas/services/canvasSyncService.ts`
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
- Canvas saves are local-first: backend failures preserve the local document and surface `sync_failed`.
- Backend sync is scaffolded with typed metadata, signed upload, attach, and export placeholders under `services/api/src/features/canvas/`.
- Actual image/PDF generation, object upload execution, and handwriting recognition remain future work.
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
- Backend runtime wiring, external provider calls, persistent usage logs, and audit-safe metadata storage remain future work. Framework-neutral backend AI usage limits and mock service boundaries now exist under `services/api/src/features/ai/`.

## ADR-020: Feedback Review Uses Bounded Local Review Results

Status: accepted

The feedback-review feature is owned by
`apps/mobile/src/features/feedback-review/`. The current implementation uses a
deterministic local mock API instead of a backend AI review job. It reads
assignment mock data and the locally saved typed draft, validates review payloads
with Zod, and returns bounded excerpts for feedback and revision screens rather
than retaining the full draft in review state.

Current evidence:

- Loading screen: `apps/mobile/src/features/feedback-review/screens/AiReviewLoadingScreen.tsx`
- Summary screen: `apps/mobile/src/features/feedback-review/screens/FeedbackSummaryScreen.tsx`
- Rubric screen: `apps/mobile/src/features/feedback-review/screens/RubricScoreScreen.tsx`
- Revision screen: `apps/mobile/src/features/feedback-review/screens/RevisionScreen.tsx`
- Completion screen: `apps/mobile/src/features/feedback-review/screens/CompletionCelebrationScreen.tsx`
- API facade: `apps/mobile/src/features/feedback-review/api/feedbackreviewApi.ts`
- Hook: `apps/mobile/src/features/feedback-review/hooks/useFeedbackReview.ts`
- View-model and validation service: `apps/mobile/src/features/feedback-review/services/feedbackReviewService.ts`
- Focused revision local persistence: `apps/mobile/src/features/feedback-review/services/revisionPersistenceService.ts`
- Tests: `apps/mobile/src/features/feedback-review/services/feedbackReviewService.test.ts`

Consequences:

- Route files under `apps/mobile/app/(student)/review/[submissionId]/` remain thin feature exports.
- The review flow supports loading, processing, empty/missing, error, offline cached, success, revision submission, and completion states.
- Feedback is framed as one strength, one improvement, one revision task, rubric coaching, and grammar suggestions.
- Revision asks the student to write one focused revised passage; it does not auto-apply or generate a polished final draft.
- In-progress revision text is locally autosaved and restored, then cleared after successful submission.
- Progress earned now links into the local progress dashboard. Persisted progress aggregation and backend progress sync remain future backend work.
- Backend AI review jobs, feedback persistence, audit-safe metadata logging, and usage limits remain future work.

## ADR-021: Progress Tracking Uses Local Analytics Contracts Until Backend Exists

Status: accepted

Student progress lives in `apps/mobile/src/features/progress/`. The current implementation uses deterministic local mock data validated with Zod, then derives dashboard, skill detail, badge, and weekly review view models on device.

Current evidence:

- Dashboard API facade: `apps/mobile/src/features/progress/api/progressApi.ts`
- Query hooks: `apps/mobile/src/features/progress/hooks/useProgress.ts`
- Screens: `apps/mobile/src/features/progress/screens/`
- Streak service: `apps/mobile/src/features/progress/services/streakService.ts`
- Badge unlock service: `apps/mobile/src/features/progress/services/badgeUnlockService.ts`
- View-model service: `apps/mobile/src/features/progress/services/progressViewModel.ts`
- Tests: `apps/mobile/src/features/progress/services/streakService.test.ts` and `apps/mobile/src/features/progress/services/badgeUnlockService.test.ts`

Consequences:

- Progress routes under `apps/mobile/app/(student)/progress/` remain thin feature exports.
- The dashboard tracks assignments, streaks, weekly minutes, words, revisions, rubric improvement, AI feedback applied, handwriting time, skills, badges, and weekly review.
- Grade-band adaptation controls metric density and rubric detail for elementary, middle, and high school students.
- Backend progress persistence, cross-device sync, and teacher analytics remain future work. Parent reports currently exist as local mobile reporting surfaces backed by deterministic mock data.

## ADR-022: Notification Preparation Is Provider-Free Until Native Push Setup

Status: superseded for delivery by ADR-028

Prompt 16 adds daily assignment selection and notification preparation without
introducing a native push provider. This keeps the current implementation
OTA-safe and avoids adding notification permissions before product, privacy, and
store-submission details are finalized.

Current evidence:

- Daily assignment selector: `apps/mobile/src/features/assignments/services/dailyAssignmentService.ts`
- Mock assignment API usage: `apps/mobile/src/features/assignments/api/assignmentsApi.ts`
- Streak continuation state: `apps/mobile/src/features/progress/services/streakService.ts`
- Notification preferences: `apps/mobile/src/features/profile-settings/services/notificationPreferencesService.ts`
- Prepared notification payloads: `apps/mobile/src/core/notifications/notificationService.ts`
- Notification localization keys: `apps/mobile/src/shared/i18n/en.ts`
- Tests: `apps/mobile/src/features/assignments/services/dailyAssignmentService.test.ts`, `apps/mobile/src/features/progress/services/streakService.test.ts`, `apps/mobile/src/features/profile-settings/services/notificationPreferencesService.test.ts`, and `apps/mobile/src/core/notifications/notificationService.test.ts`

Consequences:

- Prepared notification types are daily assignment, streak, incomplete assignment, and weekly report.
- Payloads use localization keys and route target metadata instead of raw provider-specific messages.
- The original provider-free decision is preserved as historical context.
- Local notification scheduling and backend push service contracts are now tracked by ADR-028.

## ADR-028: Profile Settings Sync And Notification Delivery Boundary

Status: accepted

Student edit, goals, language, and notification preferences now keep the local
device cache but also sync to Supabase RPCs when a session exists. Local reminder
delivery uses `expo-notifications` in the mobile app. Remote push delivery is
implemented as a framework-neutral backend service under
`services/api/src/features/notifications/`, but production delivery still needs a
deployed API runtime, worker/scheduler, and APNs/FCM credentials.

Current evidence:

- Profile settings local and RPC sync: `apps/mobile/src/features/profile-settings/services/studentProfileSettingsPreferenceService.ts`
- Notification preference local and RPC sync: `apps/mobile/src/features/profile-settings/services/notificationPreferencesService.ts`
- Local notification scheduling and Expo token registration boundary: `apps/mobile/src/core/notifications/notificationDeliveryService.ts`
- Notification response routing: `apps/mobile/src/core/notifications/NotificationResponseHandler.tsx`
- Backend SQL/RPC migration: `services/api/migrations/202606100001_profile_settings_notification_sync.sql`
- Backend push service contracts: `services/api/src/features/notifications/`

Consequences:

- Adding `expo-notifications` changes the native dependency graph and requires a native rebuild/resubmission for notification delivery.
- Mobile preferences remain usable offline because local persistence is still the first write.
- Expo push tokens cross only the backend account API boundary and should be stored encrypted with token hashes for lookup.
- Production push delivery remains incomplete until a real API runtime mounts the notification endpoints and runs due-notification sends.

## ADR-023: Parent Experience Uses Local Reporting Contracts Until Backend Exists

Status: accepted

Parent experience lives in `apps/mobile/src/features/parent/`. Prompt 17 adds
parent home, student selector, detailed student report, assignment review, and
parent settings without introducing backend persistence or direct imports from
student feature implementations.

Current evidence:

- Dashboard/report/review/settings API facade: `apps/mobile/src/features/parent/api/parentApi.ts`
- Query hooks and settings mutation: `apps/mobile/src/features/parent/hooks/useParent.ts`
- Screens: `apps/mobile/src/features/parent/screens/`
- Components: `apps/mobile/src/features/parent/components/`
- Zod contracts: `apps/mobile/src/features/parent/types.ts`
- View-model service and tests: `apps/mobile/src/features/parent/services/parentViewModel.ts` and `apps/mobile/src/features/parent/services/parentViewModel.test.ts`

Consequences:

- Parent route files under `apps/mobile/app/(parent)/` remain thin feature exports.
- Parent reporting surfaces support loading, empty, error, offline cached, and success states.
- Grade-band adaptation controls metric density and rubric detail for parent-visible student work.
- AI feedback is shown as coaching signals only: one strength, one improvement, and one revision task.
- Parent settings include AI coach access, report email, assignment alerts, practice reminders, digest frequency, teacher sharing, and quiet-hour copy.
- Backend authorization, parent/student linking persistence, cross-device settings sync, and real report delivery remain future work.

## ADR-024: Teacher Experience Uses Local Classroom Contracts Until Backend Exists

Status: accepted

Teacher experience lives in `apps/mobile/src/features/teacher/`. Prompt 18 adds
teacher dashboard, class progress, assignment creation, submissions, and
submission review without introducing backend persistence or direct imports from
student feature implementations.

Current evidence:

- API facade: `apps/mobile/src/features/teacher/api/teacherApi.ts`
- Query hooks and mutations: `apps/mobile/src/features/teacher/hooks/useTeacher.ts`
- Screens: `apps/mobile/src/features/teacher/screens/`
- Components: `apps/mobile/src/features/teacher/components/`
- Zod contracts: `apps/mobile/src/features/teacher/types.ts`
- View-model and validation services: `apps/mobile/src/features/teacher/services/teacherViewModel.ts` and `apps/mobile/src/features/teacher/services/teacherAssignmentValidation.ts`
- Tests: `apps/mobile/src/features/teacher/services/teacherViewModel.test.ts`

Consequences:

- Teacher route files under `apps/mobile/app/(teacher)/` remain thin feature exports.
- Teacher surfaces support loading, empty, error, offline cached, and success states.
- Class progress uses grade-band adaptation so elementary classes show fewer metrics while high-school classes can show fuller rubric detail.
- Assignment creation validates title, prompt, grade, class, skill focus, due date, rubric criteria, and canvas attachment settings before publication.
- Teacher feedback is framed as coaching: rubric signals, bounded student-writing preview, one next revision task, and a teacher comment. It must not rewrite student work.
- Backend persistence, assignment publication, roster sync, authorization enforcement, and cross-device teacher comments remain future work.

## ADR-025: AI Backend Services Stay Framework-Neutral And Mock-Backed

Status: accepted

Prompt 22 adds backend AI service scaffolding without choosing a runtime
framework or external model provider. The implementation lives under
`services/api/src/features/ai/` and keeps provider calls behind a typed mock
provider.

Current evidence:

- Contracts and shared helpers: `services/api/src/features/ai/contracts.ts`
- Coach orchestration: `services/api/src/features/ai/coach/ai-coach.service.ts`
- Review orchestration: `services/api/src/features/ai/review/ai-review.service.ts`
- Structured feedback parser: `services/api/src/features/ai/review/structured-feedback-parser.ts`
- Prompt builder: `services/api/src/features/ai/prompts/ai-prompt-builder.service.ts`
- Academic integrity and policy checks: `services/api/src/features/ai/safety/`
- Deterministic moderation placeholders: `services/api/src/features/ai/moderation/ai-moderation.service.ts`
- Usage limits and token-budget estimates: `services/api/src/features/ai/usage/ai-usage-limit.service.ts`
- Mock provider: `services/api/src/features/ai/providers/mock-ai-provider.ts`

Consequences:

- AI backend behavior can be unit-tested and reviewed before a server framework
  or model SDK is selected.
- Input/output moderation, academic-integrity policy, usage limits, prompt
  construction, provider calls, and structured feedback parsing are separate
  boundaries.
- The mock provider returns localization-ready coaching and feedback packets
  with one strength, one improvement, and one next revision task.
- No model-provider credentials, service-role keys, running API server,
  persistence adapter, or production queue exists yet.

## ADR-008: Backend API Remains Framework-Neutral for Now

Status: accepted

`services/api/docs/` now defines the planned backend API contract, error
catalog, and authorization rules. `services/api/src/features/` contains
framework-neutral feature boundary stubs plus AI coaching/review service
scaffolding in `services/api/src/features/ai/`. The backend still does not
choose NestJS, Spring Boot, or another runtime framework.

Decision needed before implementation:

- Choose backend framework and database migration tooling before implementing
  runtime handlers, persistence, and deployment.

Backend responsibilities currently documented:

- Authentication integration.
- User, student, parent, and teacher management.
- Daily assignment generation.
- Assignment lifecycle.
- Draft persistence.
- Canvas file storage.
- AI review queue.
- AI coaching/review safety, prompt, moderation, usage, structured parsing, and
  mock provider boundaries.
- Progress calculation.
- Parent and teacher reporting.
- Subscription entitlement sync. The mobile app currently uses local deterministic subscription mocks in `apps/mobile/src/features/subscriptions/api/subscriptionsApi.ts`.
- Notifications and weekly reports.

Canonical planned backend docs:

- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/ERROR_CODES.md`
- `services/api/docs/AUTHORIZATION_RULES.md`

## ADR-009: AI Coach Must Teach, Not Complete Assignments

Status: accepted

WriteWise AI is a learning app. AI features must help students think, plan, revise, and improve their own writing.

Current evidence:

- `apps/mobile/src/features/ai-coach/prompts/coachPrompt.ts` and `apps/mobile/src/features/ai-coach/prompts/reviewPrompt.ts` instruct the model boundary to coach instead of producing a finished response.
- `apps/mobile/src/features/ai-coach/services/academicIntegrityService.ts` detects completion, full-rewrite, and answer-seeking requests and redirects students to approved coaching actions.
- `apps/mobile/src/features/ai-coach/services/aiCoachPolicyService.ts` blocks assignment-completion intent before response generation and validates output before display.
- `apps/mobile/src/features/ai-coach/components/AiCoachDrawer.tsx` renders only approved coaching actions.

Consequences:

- AI prompts and UI actions must avoid assignment-completion language.
- AI review output should provide coaching, feedback, and revision tasks.
- AI service input/output should be validated with Zod before display or persistence.

## ADR-026: Security, Privacy, And Audit Policies Are Metadata-First

Status: accepted

Prompt 25 documents security, privacy, academic-integrity, child-safety, and
data-retention requirements without claiming a production backend exists.

Current evidence:

- Security and privacy policy: `docs/SECURITY_PRIVACY.md`
- Academic integrity policy: `docs/ACADEMIC_INTEGRITY_POLICY.md`
- Child safety requirements: `docs/CHILD_SAFETY_REQUIREMENTS.md`
- Data retention policy: `docs/DATA_RETENTION_POLICY.md`
- Audit scaffold: `services/api/src/features/audit/`
- Planned audit table: `public.audit_logs` in `services/api/migrations/202606090001_initial_writewise_schema.sql`

Consequences:

- Parent, teacher, admin, provider, and system access must be authorized and
  audited according to `services/api/docs/AUTHORIZATION_RULES.md`.
- Audit metadata stores opaque IDs, request IDs, hashes, status values, and
  safety flags; it redacts or omits student writing, full prompts, raw provider
  payloads, tokens, service-role values, and secrets.
- Signed URL and rate-limit enforcement remain future backend runtime work, but
  their requirements are now documented before implementation.

## ADR-027: Offline And Retry UI Is Feature-State Driven Until Network Status Is Added

Status: accepted

Prompt 26 improves performance, local reload safety, retry affordances, and
offline/error states without adding a native network-status dependency.

Current evidence:

- Shared offline and retry primitives:
  `apps/mobile/src/shared/components/feedback/OfflineBanner.tsx` and
  `apps/mobile/src/shared/components/feedback/RetryButton.tsx`
- Skeleton loading affordances:
  `apps/mobile/src/shared/components/feedback/LoadingState.tsx`
- Bounded TanStack Query cache defaults:
  `apps/mobile/src/shared/query/queryClient.ts`
- Draft reload recovery:
  `apps/mobile/src/features/writing-workspace/services/draftPersistenceService.ts`
- Canvas reload recovery and malformed-index filtering:
  `apps/mobile/src/features/canvas/services/canvasPersistenceService.ts`
- Canvas autosave cancellation returns the latest pending local document:
  `apps/mobile/src/features/canvas/services/canvasSyncService.ts`
- Offline banners and retry busy states are wired through feature screens rather
  than route files.

Consequences:

- Offline visibility is driven by existing feature response states such as
  `connectionStatus: "offline_cached"` and canvas `syncStatus`, not by a global
  NetInfo listener.
- Drafts and canvas documents remain device-local, non-secret data persisted
  through `apps/mobile/src/services/storage/localJsonStorage.ts`.
- Canvas stroke documents remain bounded to 24 documents per student, 240
  strokes per document, 16 points per stroke, and 12 undo snapshots.
- Assignment, canvas, and teacher submission history surfaces now expose
  localized pagination placeholders, but real paged backend APIs remain future
  work.
