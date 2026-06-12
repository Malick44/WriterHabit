# Execution State

Last updated: 2026-06-11

## Current Status

- Prompt 02 repo audit and implementation planning is complete.
- Prompt 04 design system and shared UI foundation is complete.
- Prompt 05 navigation and role routing foundation is complete.
- Prompt 06 localization and accessibility foundation is complete.
- Prompt 07 auth and session flow is complete.
- Prompt 08 student onboarding flow is complete.
- Prompt 09 student home dashboard is complete.
- Prompt 10 assignment feature is complete.
- Prompt 11 typed writing workspace is complete.
- Prompt 12 canvas feature is complete.
- Prompt 13 AI coach feature is complete.
- Prompt 14 AI review, feedback, and revision is complete.
- Prompt 15 progress tracking and badges is complete.
- Prompt 16 notifications and daily assignment logic is complete.
- Prompt 17 parent experience is complete.
- Prompt 18 teacher experience is complete.
- Prompt 19 subscription and paywall flow is complete.
- Prompt 20 backend API contract is complete.
- Prompt 21 database schema and migrations is complete.
- Prompt 22 AI backend services is complete.
- Prompt 23 canvas storage and sync is complete.
- Prompt 24 testing strategy implementation is complete.
- Prompt 25 security, privacy, and academic integrity is complete.
- Prompt 26 performance, offline support, autosave reliability, retry, and error-state polish is complete.
- Prompt 27 final QA and release checklist is complete.
- WW-REL-001 production backend runtime shell is implemented in `services/api/`.
- WW-REL-002 database migration/RLS verification is implemented and verified
  against the configured development Supabase. `scripts/supabase-migrations.mjs`
  applies ordered migrations with a checksum ledger, and
  `services/api/tests/rls/resource-policy-verification.sql` covers role
  escalation, student isolation, parent revocation, teacher roster removal,
  system-owned row write denial, and trusted service/admin transitions.
- WW-REL-004 server-side workflow state machines are implemented locally.
  Backend workflow routes and database transactions now own assignment start,
  submission creation, AI review feedback publication, revision completion, and
  progress side effects. AI review request start, failure, and safety-block
  terminal states persist through
  `202606110004_review_job_lifecycle.sql`. Public-client RLS writes to
  workflow-owned assignment, submission, feedback, revision, review-job, and
  progress rows are denied by `202606110003_workflow_state_machines.sql`; the
  workflow migrations through `202606110004_review_job_lifecycle.sql` were
  applied and verified against the configured development Supabase on
  2026-06-11.
- WW-REL-003 payments and entitlements round 3 is implemented locally.
  RevenueCat is the selected iOS/Android entitlement provider. `services/api/`
  now exposes trusted entitlement reads, RevenueCat checkout intent, restore
  reconciliation, and Authorization-verified idempotent RevenueCat webhooks.
  Mobile subscription gates no longer trust `activated_preview` or local session
  entitlement state for paid access. Advertised Plus surfaces now use
  entitlement gates and server-side entitlement checks/redaction for extended
  progress history, parent family reports, teacher class insights, rubric
  detail, and canvas archive. Stale older RevenueCat lifecycle events are
  recorded as ignored and cannot re-enable access after newer refund,
  expiration, or billing-issue events. Migrations through
  `202606110006_subscription_event_ordering.sql` have been applied and verified
  against the configured development Supabase. Native RevenueCat SDK
  purchase launch, owner app keys/store products, server env values,
  transfer/alias QA, and sandbox store QA remain required before paid plans can
  be enabled publicly.
- Next recommended engineering step: close remaining P0/P1 release blockers in
  `docs/KNOWN_ISSUES.md`, starting with native RevenueCat store setup, mobile
  E2E automation, production AI provider/worker integration, canvas storage
  sync, and backend lint/CI wiring.
- Project-local Codex actions are configured in `.codex/environments/environment.toml`.
- Automated specialist review and asset-generation actions are configured through `script/review_agent.sh`.
- Autonomous prompt sequencing is configured through `script/autonomous_prompt_runner.sh`.
- Git is initialized on branch `main`; implementation commits exist.
- Expo mobile app lives at `apps/mobile/`.
- Supabase mobile client is configured with public Expo env variables.
- Supabase local admin CLI is configured for development-only use.
- Configured development Supabase has the app schema, RLS policies, and
  `public.writerhabit_schema_migrations` ledger applied through
  `202606110002_resource_rls_hardening.sql`.
- `services/api/` now has a Fastify TypeScript runtime with health, request IDs,
  CORS, request logging, Supabase JWT verification, standard API errors,
  authenticated session/profile smoke endpoints, writing-loop workflow routes,
  fail-closed feature route shells, package scripts, trusted-role derivation
  from server-owned `app_metadata.role`, and Vitest integration tests.
- WW-REL task 02 round 2 server-derived role hardening is implemented locally:
  mobile session mapping ignores client-writable role/entitlement metadata,
  sign-up/onboarding no longer write role metadata, production onboarding only
  follows server-trusted parent/teacher roles, draft migration
  `202606110001_server_owned_roles.sql` blocks public `public.users.role`
  updates with an invoker-rights trigger, and legacy auth metadata role sync
  hooks are neutralized when present. The migration was applied to the
  configured development Supabase instance and
  `node scripts/verify-server-owned-roles.mjs --apply-local-migration` passed
  for auth-metadata escalation, authenticated student-to-parent/teacher/admin
  role changes, safe profile self-updates, and the database admin grant path.
  Production migration application remains an owner/backend release operation.
- WW-REL task 03 round 1 RLS migration runner and policy tests are implemented
  locally. `node scripts/supabase-migrations.mjs apply-and-verify` passed
  against the configured development Supabase on 2026-06-11.
- Every task should start by reading `AGENTS.md`, `docs/00_CONTEXT_BRIEF.md`, `prompts/01_master_agent_rules.md`, and `.codex/EXECUTION_STATE.md`.

## Completed Work

- Read and applied `prompts/01_master_agent_rules.md`.
- Executed `prompts/02_repo_audit_and_implementation_plan.md`.
- Created:
  - `docs/IMPLEMENTATION_PLAN.md`
  - `docs/ARCHITECTURE_DECISIONS.md`
  - `docs/FEATURE_ROADMAP.md`
- Added Supabase mobile client:
  - `apps/mobile/src/core/config/supabaseConfig.ts`
  - `apps/mobile/src/core/supabase/supabaseClient.ts`
  - `apps/mobile/.env.example`
  - `apps/mobile/.gitignore`
- Added development-only Supabase admin CLI:
  - `scripts/supabase-admin.mjs`
  - `.env.supabase-admin.example`
  - `.env.supabase-admin` locally only
- Added project-local Codex setup:
  - `.codex/README.md`
  - `.codex/PROMPTS.md`
  - `.codex/SKILLS.md`
  - `.codex/SCREEN_DESIGN_PROMPTS.md`
  - `.codex/environments/environment.toml`
  - `script/build_and_run.sh`
- Added automated review action runner:
  - `script/review_agent.sh`
- Added autonomous prompt runner:
  - `script/autonomous_prompt_runner.sh`
  - `.codex/AUTONOMOUS_PROMPTS.md`
- Added asset generation setup:
  - `prompts/specialists/asset_generation_agent.md`
  - `docs/assets/ASSET_GENERATION_PLAN.md`
  - `apps/mobile/assets/generated/README.md`
- Initialized local Git repository:
  - branch `main`
  - local env files, `node_modules/`, `.expo/`, native generated folders, logs, coverage, and build outputs are ignored
- Added canonical design tokens:
  - `apps/mobile/src/design/tokens/colors.ts`
  - `apps/mobile/src/design/tokens/typography.ts`
  - `apps/mobile/src/design/tokens/spacing.ts`
  - `apps/mobile/src/design/tokens/radius.ts`
  - `apps/mobile/src/design/tokens/shadows.ts`
  - `apps/mobile/src/design/tokens/motion.ts`
- Added shared UI primitives:
  - `apps/mobile/src/shared/components/layout/`
  - `apps/mobile/src/shared/components/buttons/`
  - `apps/mobile/src/shared/components/cards/`
  - `apps/mobile/src/shared/components/forms/`
  - `apps/mobile/src/shared/components/feedback/`
- Added design-system documentation:
  - `docs/DESIGN_SYSTEM.md`
- Added role-based navigation foundation:
  - `apps/mobile/src/core/auth/authTypes.ts`
  - `apps/mobile/src/core/auth/authStore.ts`
  - `apps/mobile/src/core/auth/useAuthSession.ts`
  - `apps/mobile/src/core/navigation/routeNames.ts`
  - `apps/mobile/src/core/navigation/roleRouter.ts`
  - `apps/mobile/src/core/navigation/deepLinks.ts`
  - `apps/mobile/src/core/navigation/RouteGate.tsx`
- Added Expo Router group layouts:
  - `apps/mobile/app/(auth)/_layout.tsx`
  - `apps/mobile/app/(onboarding)/_layout.tsx`
  - `apps/mobile/app/(student)/_layout.tsx`
  - `apps/mobile/app/(parent)/_layout.tsx`
  - `apps/mobile/app/(teacher)/_layout.tsx`
- Added localization foundation:
  - `apps/mobile/src/shared/i18n/en.ts`
  - `apps/mobile/src/shared/i18n/types.ts`
  - `apps/mobile/src/shared/i18n/index.ts`
  - `apps/mobile/src/shared/i18n/useT.ts`
  - compatibility exports in `apps/mobile/src/i18n/`
- Added accessibility settings foundation:
  - `apps/mobile/src/shared/utils/accessibility.ts`
  - `apps/mobile/src/features/profile-settings/accessibility/accessibilitySettingsStore.ts`
  - `apps/mobile/src/features/profile-settings/accessibility/AccessibilitySettingsProvider.tsx`
  - `apps/mobile/src/features/profile-settings/screens/AccessibilitySettingsScreen.tsx`
- Added localization/accessibility documentation:
  - `docs/LOCALIZATION_ACCESSIBILITY.md`
- Added auth/session foundation:
  - `apps/mobile/src/core/auth/sessionService.ts`
  - `apps/mobile/src/core/auth/AuthSessionProvider.tsx`
  - `apps/mobile/src/features/auth/screens/SignInScreen.tsx`
  - `apps/mobile/src/features/auth/screens/SignUpScreen.tsx`
  - `apps/mobile/src/features/auth/components/AuthForm.tsx`
  - `apps/mobile/src/features/auth/types.ts`
  - `apps/mobile/app/(auth)/sign-in.tsx`
  - `apps/mobile/app/(auth)/sign-up.tsx`
- Updated auth/session documentation:
  - `docs/03_NAVIGATION_MAP.md`
  - `docs/02_SCREEN_TO_FEATURE_MAP.md`
  - `docs/ARCHITECTURE_DECISIONS.md`
- Added student onboarding flow:
  - `apps/mobile/src/features/onboarding/types.ts`
  - `apps/mobile/src/features/onboarding/stores/onboardingStore.ts`
  - `apps/mobile/src/features/onboarding/services/onboardingPersistenceService.ts`
  - `apps/mobile/src/features/onboarding/services/personalizedPlanService.ts`
  - `apps/mobile/src/features/onboarding/components/OnboardingStepFrame.tsx`
  - `apps/mobile/src/features/onboarding/screens/RoleSelectionScreen.tsx`
  - `apps/mobile/src/features/onboarding/screens/GradeSelectionScreen.tsx`
  - `apps/mobile/src/features/onboarding/screens/WritingGoalsScreen.tsx`
  - `apps/mobile/src/features/onboarding/screens/WritingConfidenceScreen.tsx`
  - `apps/mobile/src/features/onboarding/screens/DailyPracticeGoalScreen.tsx`
  - `apps/mobile/src/features/onboarding/screens/PersonalizedPlanSummaryScreen.tsx`
  - `apps/mobile/app/(onboarding)/writing-confidence.tsx`
- Updated onboarding/auth completion metadata:
  - `apps/mobile/src/core/auth/authTypes.ts`
  - `apps/mobile/src/core/auth/authStore.ts`
  - `apps/mobile/src/core/auth/sessionService.ts`
- Updated onboarding documentation:
  - `docs/03_NAVIGATION_MAP.md`
  - `docs/02_SCREEN_TO_FEATURE_MAP.md`
  - `docs/04_DATA_MODEL.md`
  - `docs/ARCHITECTURE_DECISIONS.md`
- Added student home dashboard:
  - `apps/mobile/src/features/student-home/screens/StudentHomeScreen.tsx`
  - `apps/mobile/src/features/student-home/components/`
  - `apps/mobile/src/features/student-home/hooks/useStudentHomeData.ts`
  - `apps/mobile/src/features/student-home/api/studentHomeApi.ts`
  - `apps/mobile/src/features/student-home/services/studentHomeViewModel.ts`
  - `apps/mobile/src/features/student-home/types.ts`
- Added dashboard view-model tests:
  - `apps/mobile/src/features/student-home/services/studentHomeViewModel.test.ts`
- Updated student dashboard localization:
  - `apps/mobile/src/shared/i18n/en.ts`
- Updated student dashboard documentation and handoff notes:
  - `AGENTS.md`
  - `docs/04_DATA_MODEL.md`
  - `docs/ARCHITECTURE_DECISIONS.md`
  - `docs/FEATURE_ROADMAP.md`
- Added assignment feature:
  - `apps/mobile/src/features/assignments/screens/AssignmentHistoryScreen.tsx`
  - `apps/mobile/src/features/assignments/screens/AssignmentDetailScreen.tsx`
  - `apps/mobile/src/features/assignments/screens/AssignmentSubmissionScreen.tsx`
  - `apps/mobile/src/features/assignments/components/`
  - `apps/mobile/src/features/assignments/hooks/useAssignments.ts`
  - `apps/mobile/src/features/assignments/api/assignmentsApi.ts`
  - `apps/mobile/src/features/assignments/services/assignmentStatusService.ts`
  - `apps/mobile/src/features/assignments/services/assignmentViewModel.ts`
  - `apps/mobile/src/features/assignments/types.ts`
- Added assignment route:
  - `apps/mobile/app/(student)/assignments/submit.tsx`
- Updated student route hiding for submission:
  - `apps/mobile/app/(student)/_layout.tsx`
- Updated navigation helpers:
  - `apps/mobile/src/core/navigation/routeNames.ts`
  - `apps/mobile/src/core/navigation/deepLinks.ts`
- Added assignment lifecycle tests:
  - `apps/mobile/src/features/assignments/services/assignmentStatusService.test.ts`
- Updated assignment localization:
  - `apps/mobile/src/shared/i18n/en.ts`
- Updated assignment documentation and handoff notes:
  - `AGENTS.md`
  - `docs/02_SCREEN_TO_FEATURE_MAP.md`
  - `docs/03_NAVIGATION_MAP.md`
  - `docs/04_DATA_MODEL.md`
  - `docs/05_API_CONTRACT.md`
  - `docs/ARCHITECTURE_DECISIONS.md`
  - `docs/FEATURE_ROADMAP.md`
  - `docs/IMPLEMENTATION_PLAN.md`
- Added typed writing workspace:
  - `apps/mobile/src/features/writing-workspace/screens/WritingWorkspaceScreen.tsx`
  - `apps/mobile/src/features/writing-workspace/components/`
  - `apps/mobile/src/features/writing-workspace/hooks/useWritingWorkspace.ts`
  - `apps/mobile/src/features/writing-workspace/api/writingWorkspaceApi.ts`
  - `apps/mobile/src/features/writing-workspace/services/draftPersistenceService.ts`
  - `apps/mobile/src/features/writing-workspace/services/writingMetricsService.ts`
  - `apps/mobile/src/features/writing-workspace/stores/writingWorkspaceUiStore.ts`
  - `apps/mobile/src/features/writing-workspace/types.ts`
- Added local JSON storage facade for larger non-secret local data:
  - `apps/mobile/src/services/storage/localJsonStorage.ts`
- Added review-loading route target after writing submission:
  - `apps/mobile/src/features/feedback-review/screens/AiReviewLoadingScreen.tsx`
  - `apps/mobile/app/(student)/review/[submissionId].tsx`
- Updated student review deep-link helper:
  - `apps/mobile/src/core/navigation/deepLinks.ts`
- Added typed writing workspace tests:
  - `apps/mobile/src/features/writing-workspace/services/draftPersistenceService.test.ts`
  - `apps/mobile/src/features/writing-workspace/services/writingMetricsService.test.ts`
- Updated typed writing workspace localization:
  - `apps/mobile/src/shared/i18n/en.ts`
- Updated typed writing workspace documentation and handoff notes:
  - `AGENTS.md`
  - `docs/02_SCREEN_TO_FEATURE_MAP.md`
  - `docs/03_NAVIGATION_MAP.md`
  - `docs/04_DATA_MODEL.md`
  - `docs/05_API_CONTRACT.md`
  - `docs/ARCHITECTURE_DECISIONS.md`
  - `docs/FEATURE_ROADMAP.md`
  - `docs/IMPLEMENTATION_PLAN.md`
  - `docs/08_IMPLEMENTATION_PLAN.md`
- Added canvas feature:
  - `apps/mobile/src/features/canvas/screens/CanvasHomeScreen.tsx`
  - `apps/mobile/src/features/canvas/screens/CanvasTemplatePickerScreen.tsx`
  - `apps/mobile/src/features/canvas/screens/HandwritingCanvasScreen.tsx`
  - `apps/mobile/src/features/canvas/screens/CanvasAttachmentScreen.tsx`
  - `apps/mobile/src/features/canvas/components/`
  - `apps/mobile/src/features/canvas/hooks/useCanvas.ts`
  - `apps/mobile/src/features/canvas/api/canvasApi.ts`
  - `apps/mobile/src/features/canvas/services/canvasDocumentService.ts`
  - `apps/mobile/src/features/canvas/services/canvasPersistenceService.ts`
  - `apps/mobile/src/features/canvas/stores/canvasToolStore.ts`
  - `apps/mobile/src/features/canvas/types.ts`
- Added canvas navigation helpers:
  - `apps/mobile/src/core/navigation/deepLinks.ts`
- Connected typed writing workspace canvas preview to attached local canvas summaries:
  - `apps/mobile/src/features/writing-workspace/api/writingWorkspaceApi.ts`
  - `apps/mobile/src/features/writing-workspace/screens/WritingWorkspaceScreen.tsx`
- Added canvas tests:
  - `apps/mobile/src/features/canvas/services/canvasDocumentService.test.ts`
  - `apps/mobile/src/features/canvas/services/canvasPersistenceService.test.ts`
- Updated canvas localization:
  - `apps/mobile/src/shared/i18n/en.ts`
- Updated canvas documentation and handoff notes:
  - `AGENTS.md`
  - `docs/03_NAVIGATION_MAP.md`
  - `docs/04_DATA_MODEL.md`
  - `docs/05_API_CONTRACT.md`
  - `docs/07_CANVAS_ARCHITECTURE.md`
  - `docs/ARCHITECTURE_DECISIONS.md`
  - `docs/FEATURE_ROADMAP.md`
  - `docs/IMPLEMENTATION_PLAN.md`
  - `docs/08_IMPLEMENTATION_PLAN.md`
- Added policy-safe AI coach feature:
  - `apps/mobile/src/features/ai-coach/components/AiCoachDrawer.tsx`
  - `apps/mobile/src/features/ai-coach/hooks/useAiCoach.ts`
  - `apps/mobile/src/features/ai-coach/api/aiCoachApi.ts`
  - `apps/mobile/src/features/ai-coach/services/aiCoachContextService.ts`
  - `apps/mobile/src/features/ai-coach/services/aiCoachPolicyService.ts`
  - `apps/mobile/src/features/ai-coach/prompts/coachPrompt.ts`
  - `apps/mobile/src/features/ai-coach/prompts/reviewPrompt.ts`
  - `apps/mobile/src/features/ai-coach/types.ts`
- Connected typed writing workspace coach panel to the AI coach drawer:
  - `apps/mobile/src/features/writing-workspace/components/CoachEntryPanel.tsx`
  - `apps/mobile/src/features/writing-workspace/screens/WritingWorkspaceScreen.tsx`
  - `apps/mobile/src/features/writing-workspace/hooks/useWritingWorkspace.ts`
  - `apps/mobile/src/features/writing-workspace/services/writingMetricsService.ts`
- Added AI coach safety tests:
  - `apps/mobile/src/features/ai-coach/services/aiCoachPolicyService.test.ts`
- Updated AI coach localization:
  - `apps/mobile/src/shared/i18n/en.ts`
- Updated AI coach documentation and handoff notes:
  - `AGENTS.md`
  - `docs/02_SCREEN_TO_FEATURE_MAP.md`
  - `docs/05_API_CONTRACT.md`
  - `docs/06_AI_COACH_ARCHITECTURE.md`
  - `docs/ARCHITECTURE_DECISIONS.md`
  - `docs/FEATURE_ROADMAP.md`
  - `docs/IMPLEMENTATION_PLAN.md`
  - `docs/08_IMPLEMENTATION_PLAN.md`
- Added Prompt 25 security, privacy, academic-integrity, child-safety, data-retention, and audit scaffolding:
  - `docs/SECURITY_PRIVACY.md`
  - `docs/ACADEMIC_INTEGRITY_POLICY.md`
  - `docs/CHILD_SAFETY_REQUIREMENTS.md`
  - `docs/DATA_RETENTION_POLICY.md`
  - `apps/mobile/src/features/ai-coach/services/academicIntegrityService.ts`
  - `services/api/src/features/audit/audit.contracts.ts`
  - `services/api/src/features/audit/audit.service.ts`
  - `services/api/src/features/audit/index.ts`
- Updated Prompt 25 supporting docs and tests:
  - `docs/10_SECURITY_PRIVACY.md`
  - `docs/06_AI_COACH_ARCHITECTURE.md`
  - `docs/ARCHITECTURE_DECISIONS.md`
  - `docs/FEATURE_ROADMAP.md`
  - `docs/FILE_INDEX.md`
  - `services/api/docs/AUTHORIZATION_RULES.md`
  - `services/api/src/features/README.md`
  - `services/api/src/features/index.ts`
  - `apps/mobile/src/features/ai-coach/services/aiCoachPolicyService.ts`
  - `apps/mobile/src/features/ai-coach/services/aiCoachPolicyService.test.ts`
  - `apps/mobile/src/features/ai-coach/types.ts`
  - `.codex/AUTONOMOUS_PROMPTS.md`
  - `docs/IMPLEMENTATION_PLAN.md`
  - `docs/QUICK_START.md`
  - `tests/unit/auditService.test.ts`
  - `tests/unit/criticalLogic.test.ts`
- Added Prompt 26 performance, offline, retry, and error-state polish:
  - `apps/mobile/src/shared/components/feedback/OfflineBanner.tsx`
  - `apps/mobile/src/shared/components/feedback/RetryButton.tsx`
  - `apps/mobile/src/shared/components/feedback/LoadingState.tsx`
  - `apps/mobile/src/shared/components/feedback/StatusState.tsx`
  - `apps/mobile/src/shared/query/queryClient.ts`
  - `apps/mobile/src/features/writing-workspace/services/draftPersistenceService.ts`
  - `apps/mobile/src/features/canvas/services/canvasPersistenceService.ts`
  - `apps/mobile/src/features/canvas/services/canvasSyncService.ts`
  - `apps/mobile/src/features/canvas/hooks/useCanvas.ts`
  - `apps/mobile/src/features/feedback-review/hooks/useFeedbackReview.ts`
  - assignment, canvas, writing, feedback review, and teacher submission screens using localized offline banners, retry busy states, skeleton loading, and history pagination placeholders
- Added Prompt 26 focused tests:
  - `apps/mobile/src/features/writing-workspace/services/draftPersistenceService.test.ts`
  - `apps/mobile/src/features/canvas/services/canvasPersistenceService.test.ts`
  - `apps/mobile/src/features/canvas/services/canvasSyncService.test.ts`
- Added Prompt 27 final QA and release readiness docs:
  - `docs/FINAL_QA_REPORT.md`
  - `docs/RELEASE_CHECKLIST.md`
  - `docs/KNOWN_ISSUES.md`
- Updated release handoff/index docs:
  - `AGENTS.md`
  - `.codex/EXECUTION_STATE.md`
  - `.codex/AUTONOMOUS_PROMPTS.md`
  - `docs/FILE_INDEX.md`
  - `docs/QUICK_START.md`
  - `docs/IMPLEMENTATION_PLAN.md`
  - `docs/FEATURE_ROADMAP.md`

## Next Recommended Prompt

The canonical implementation prompt sequence through
`prompts/27_final_qa_release_checklist.md` is complete.

Next recommended engineering step:

- Close the P0/P1 release blockers in `docs/KNOWN_ISSUES.md`, starting with
  production backend/runtime, authorization, payment entitlement sync, mobile E2E
  automation, and lint tooling.

## Validation Status

Current Prompt 27 passing checks:

```bash
./script/build_and_run.sh --doctor
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
npx expo export --platform ios --output-dir /tmp/WriterHabit-expo-export-ios
npx expo export --platform android --output-dir /tmp/WriterHabit-expo-export-android
```

Current Prompt 27 release-check gaps:

```bash
cd apps/mobile && npm run lint
./script/build_and_run.sh --export-web
```

`npm run lint` fails because `eslint` is not installed/configured.
`--export-web` fails because `react-native-web` is not installed; the primary
release surface remains mobile.

Prompt 04 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

Result: all passed on 2026-06-08.

Prompt 05 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

Result: all passed on 2026-06-08.

Prompt 06 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

Result: all passed on 2026-06-08.

Prompt 07 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

Result: all passed on 2026-06-08.

Prompt 08 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

Result: all passed on 2026-06-08.

Prompt 09 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

Result: all passed on 2026-06-08. The first doctor attempt failed in the sandbox because npm registry access was blocked; rerunning with approved network access passed 21/21 Expo Doctor checks.

Prompt 10 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

Result: all passed on 2026-06-09. The first doctor attempt failed in the sandbox because npm registry access was blocked; rerunning with approved network access passed 21/21 Expo Doctor checks.

Prompt 11 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

Result: all passed on 2026-06-09. The first doctor attempt failed in the sandbox because npm registry DNS was blocked; rerunning with approved network access passed 21/21 Expo Doctor checks.

Prompt 12 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

Result: all passed on 2026-06-09. The first doctor attempt failed in the sandbox because npm registry DNS was blocked; rerunning with approved network access passed 21/21 Expo Doctor checks.

Prompt 13 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

Result: all passed on 2026-06-09. The first doctor attempt failed in the sandbox because npm registry DNS was blocked; rerunning with approved network access passed 21/21 Expo Doctor checks.

Prompt 26 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
```

Result: all passed on 2026-06-09. Jest passed 31/31 suites and 114/114 tests; Expo Doctor passed 21/21 checks.

Prompt 27 validation:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
npx expo export --platform ios --output-dir /tmp/WriterHabit-expo-export-ios
npx expo export --platform android --output-dir /tmp/WriterHabit-expo-export-android
cd apps/mobile && npm run lint
./script/build_and_run.sh --export-web
```

Result: typecheck passed, Jest passed 31/31 suites and 114/114 tests, Expo
Doctor passed 21/21 checks, and iOS/Android production bundle exports passed to
temporary output directories. Lint failed with `eslint: command not found`. Web
export failed because `react-native-web` is not installed.

Test status: Jest is configured with the Expo preset and has smoke coverage for progress scoring, grade-band typography token mapping, role routing decisions, i18n interpolation, accessibility settings helpers, onboarding validation/plan logic, auth validation, student home dashboard view-model decisions, assignment status transitions/history filters, writing draft persistence and reload recovery, writing metrics/grade adaptation, canvas stroke document behavior, canvas local persistence and reload recovery, canvas autosave scheduler behavior, and AI coach policy/context/prompt/mock API behavior.

## Architecture Notes

- Keep `apps/mobile/app/` route files thin.
- Keep feature logic under `apps/mobile/src/features/`.
- Keep shared contracts in `apps/mobile/src/shared/` or a future `packages/shared/`.
- Role-based launch routing lives in `apps/mobile/src/core/navigation/roleRouter.ts`.
- Route constants live in `apps/mobile/src/core/navigation/routeNames.ts`.
- Expo Router group access is enforced by `apps/mobile/src/core/navigation/RouteGate.tsx`.
- Auth/session state lives in `apps/mobile/src/core/auth/`.
- Supabase-backed mobile auth operations live in `apps/mobile/src/core/auth/sessionService.ts`.
- Auth feature screens, form validation, and demo-role entry points live in `apps/mobile/src/features/auth/`.
- Student onboarding progress, validation, and plan generation live in `apps/mobile/src/features/onboarding/`.
- Student home dashboard data, state, view-model logic, and cards live in `apps/mobile/src/features/student-home/`.
- Current student home data is deterministic mock/API data validated with Zod. Backend revision-completion workflows now persist progress totals and activity-day updates; full dashboard read-model sync remains future work.
- Assignment history, detail, status transitions, and submission confirmation live in `apps/mobile/src/features/assignments/`.
- Current assignment data is deterministic mock/API data validated with Zod. Authenticated start/submission/review/revision-completion mutations are backend-owned workflow transitions.
- Typed writing workspace, local draft autosave, recovery states, writing metrics, rubric checklist, canvas preview, and safe coach entry points live in `apps/mobile/src/features/writing-workspace/`.
- Current writing drafts are device-local, non-secret data persisted through `apps/mobile/src/services/storage/localJsonStorage.ts`, validated with Zod, and capped before storage. Backend draft persistence remains future work.
- Student writing submission currently validates non-empty student text and calls the backend submission workflow before routing to AI review loading. Backend feedback review uses a deterministic mock AI provider until production model/provider infrastructure is wired.
- Canvas home, template picker, handwriting/drawing adapter, toolbar, local autosave, attachment, bounded undo/redo, and canvas persistence live in `apps/mobile/src/features/canvas/`.
- Current canvas documents are device-local, non-secret stroke documents persisted through `apps/mobile/src/services/storage/localJsonStorage.ts`, validated with Zod, and bounded to 24 documents per student, 240 strokes per document, 16 points per stroke, and 12 undo snapshots. Backend canvas sync, preview image export, object storage, and handwriting recognition remain future work.
- Prompt 26 adds same-student/same-assignment recovery for oversized local drafts, same-student canvas recovery for oversized stored stroke documents, per-summary canvas index filtering, shared offline/retry UI primitives, loading skeletons, bounded TanStack Query cache defaults, and history pagination placeholders. The mobile app still does not include a real network status listener dependency.
- AI coach drawer, action state, bounded context builder, grade-aware prompt builder, policy service, deterministic mock API, and safety tests live in `apps/mobile/src/features/ai-coach/`.
- Current AI coach responses are local deterministic mock coaching packets validated with Zod. They support explicit idle, loading, empty, error, offline, safety-blocked, and success states. Backend AI calls, usage limits, and metadata logging remain future work.
- Current onboarding completion writes public Supabase auth metadata keys only; dedicated student profile tables/API persistence are future backend work.
- Canonical localization lives in `apps/mobile/src/shared/i18n/`.
- Accessibility helpers live in `apps/mobile/src/shared/utils/accessibility.ts`.
- Accessibility settings are owned by `apps/mobile/src/features/profile-settings/accessibility/` and persisted through `apps/mobile/src/services/storage/preferencesStorage.ts`.
- Design token documentation and implementation use the canonical path:

`apps/mobile/src/design/tokens/`

- `apps/mobile/src/shared/theme/` remains as a compatibility export layer over `apps/mobile/src/design/tokens/`.

## Prompt And Skill Notes

- Primary implementation prompt order is in `docs/00_PROMPT_ORDER.md`.
- Screen prompt guidance is indexed in `.codex/SCREEN_DESIGN_PROMPTS.md`.
- Project skills live in `skills/`; read relevant `SKILL.md` files before applying them.

## Supabase Notes

- Mobile app uses only public Supabase values from `apps/mobile/.env.local`.
- Local admin CLI uses `.env.supabase-admin`, which is development-only.
- Do not put service-role keys in:
  - app code
  - `.codex`
  - docs
  - committed files
  - CI logs

The public self-hosted Supabase `/mcp` endpoint is intentionally blocked by Kong with `403`. Local CLI access over HTTPS through Postgres Meta works and is the current development path.

## Do Not Touch Casually

- `apps/mobile/node_modules/`
- `apps/mobile/.expo/`
- `.env`
- `.env.*`
- `.DS_Store`
- generated native folders: `apps/mobile/ios/`, `apps/mobile/android/`
- service-role secrets

## Product Safety Reminder

WriterHabit AI is a learning app, not a cheating app.

Forbidden CTAs:

- Write my essay
- Finish for me
- Give me the answer
- Generate final draft
- Do my homework

Approved CTAs:

- Give me a hint
- Help me brainstorm
- Check my sentence
- Explain this mistake
- Help me revise
- Suggest a stronger word
- Ask me a question
