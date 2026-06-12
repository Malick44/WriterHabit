# Feature Roadmap

This roadmap lists implementation order and ownership boundaries. It does not replace detailed screen specs; keep screen-level definitions in the existing screen specification sources of truth.

## Roadmap Principles

- Preserve feature-based architecture under `apps/mobile/src/features/`.
- Keep `apps/mobile/app/` route files thin.
- Keep all student-facing AI behavior learning-oriented.
- Make copy localization-ready through `apps/mobile/src/shared/i18n/`.
- Add accessibility labels and state coverage for interactive controls.
- Use grade-adapted UI where student screens are involved.

## Grade Adaptation Rules

Grades 1-5:

- Larger controls.
- Simple wording.
- Fewer visible metrics.
- Friendly visual cues.
- Strong handwriting and read-aloud affordances.

Grades 6-8:

- Structured learning cards.
- Skill progress.
- Paragraph support.
- Revision guidance.

Grades 9-12:

- Mature layout.
- Essay planning tools.
- Rubric detail.
- Productivity-focused UI.

## Phase 0: Foundation Hardening

Primary folders:

- `apps/mobile/src/core/`
- `apps/mobile/src/shared/`
- `apps/mobile/src/shared/i18n/`
- `apps/mobile/src/i18n/` compatibility exports
- `apps/mobile/src/design/tokens/`

Work:

- Maintain the canonical token path at `apps/mobile/src/design/tokens/`.
- Keep query provider usage consolidated through the shared query provider.
- Keep the Jest Expo test setup and expand focused tests as feature logic grows.
- Use shared controls that support accessibility labels and tokenized styling.
- Keep Expo CNG flow intact; do not commit generated native folders unless the app intentionally changes workflow.

Risks:

- Current shared UI uses hardcoded values in places.
- Current test script is ahead of actual test setup.

## Phase 1: Auth and Role Routing

Primary feature:

- `apps/mobile/src/features/auth/`

Supporting folders:

- `apps/mobile/src/core/auth/`
- `apps/mobile/src/shared/state/`
- `apps/mobile/src/services/storage/`

Work:

- Restore Supabase-backed session state through `apps/mobile/src/core/auth/sessionService.ts`.
- Route students, parents, and teachers to their correct home surfaces.
- Add loading, error, and success states around session restore and auth form submission.
- Validate auth form input with Zod and keep demo role sessions available for local routing checks.

Risks:

- User profile/onboarding records beyond Supabase auth metadata are not implemented yet.
- Backend authorization and role profile tables still need concrete contracts.

## Phase 2: Onboarding

Primary feature:

- `apps/mobile/src/features/onboarding/`

Work:

- Maintain role confirmation.
- Maintain grade selection grouped by elementary, middle, and high school.
- Maintain writing goals with capped multi-select.
- Maintain writing confidence and daily practice selection.
- Maintain personalized plan loading and summary.
- Persist local onboarding progress and complete onboarding through auth/session metadata.
- Use Zod for validation.

Grade adaptation:

- Grades 1-5 should use simple labels and large touch targets.
- Grades 6-8 should show structured learning goals.
- Grades 9-12 should support essay and rubric-oriented goals.

Risks:

- Dedicated student profile API/table persistence is not implemented yet.
- Parent and teacher onboarding remain future flows.

## Phase 3: Student Home and Assignments

Primary features:

- `apps/mobile/src/features/student-home/`
- `apps/mobile/src/features/assignments/`

Work:

- Maintain the implemented student dashboard in `apps/mobile/src/features/student-home/`.
- Keep dashboard data in a feature-owned, Zod-validated mock API until backend contracts exist.
- Preserve dashboard loading, empty, error, offline cached, and success states.
- Keep dashboard AI coach entry points limited to approved learning-oriented actions.
- Maintain assignment history, detail, and submission confirmation screens in `apps/mobile/src/features/assignments/`.
- Maintain feature-owned assignment status contracts and status transition tests.
- Keep assignment loading, empty, error, offline cached, and success states explicit.
- Keep assignment CTAs limited to student-owned work: start writing, start with canvas, and submit for review.

Risks:

- Assignment APIs are deterministic mock data until backend contracts exist.
- Canvas screens are implemented with local stroke autosave, local-first sync orchestration, and backend metadata/upload/export placeholders.
- Cross-feature contracts between dashboard and assignments should be shared without importing feature internals.

## Phase 4: Writing Workspace

Primary feature:

- `apps/mobile/src/features/writing-workspace/`

Supporting feature:

- `apps/mobile/src/features/ai-coach/`

Work:

- Maintain the implemented typed writing editor in `apps/mobile/src/features/writing-workspace/`.
- Maintain feature-owned local draft autosave and recovery states.
- Add outline builder.
- Maintain rubric checklist and attached canvas preview panels.
- Maintain the embedded policy-safe AI coach drawer with approved actions only.
- Validate draft persistence data with Zod and focused tests.

Risks:

- Drafts are currently local-device only; backend draft persistence contracts are not implemented.
- AI coach UI and mock responses must continue to avoid assignment-completion CTAs or outputs.
- Submit currently routes to review loading; full feedback generation remains future work.

## Phase 5: Canvas

Primary feature:

- `apps/mobile/src/features/canvas/`

Supporting service:

- `apps/mobile/src/services/fileSystem.ts`

Work:

- Maintain the implemented canvas home, template picker, and handwriting canvas screens.
- Maintain bounded stroke documents, undo/redo history, tool store behavior, and local autosave.
- Maintain assignment attachment and typed workspace preview integration.
- Maintain local-first sync failure recovery so student work remains on device when backend sync fails.
- Implement actual file export/object upload execution when backend runtime and file-system contracts are ready.

Risks:

- File system facade currently has TODO implementations.
- Current canvas rendering uses a local React Native stroke adapter rather than a production drawing engine.
- Canvas backend sync is scaffolded but disabled unless `EXPO_PUBLIC_WriterHabit_ENABLE_CANVAS_BACKEND_SYNC=true`.
- Canvas artifacts can become memory-sensitive; keep stroke and undo bounds in place and operate on URIs for future exports.

## Phase 6: AI Coach and Feedback Review

Primary features:

- `apps/mobile/src/features/ai-coach/`
- `apps/mobile/src/features/feedback-review/`

Work:

- Maintain the implemented AI coach drawer, bounded context builder, policy service, grade-aware prompt builder, and deterministic mock API.
- Maintain the implemented review loading, feedback summary, rubric score, grammar suggestions, revision task, and completion celebration screens.
- Maintain Zod validation for AI review results and revision completion payloads.
- Keep safety tests for prompt and action guardrails.

Risks:

- AI coach currently uses deterministic local mock responses on mobile; backend AI service scaffolding exists in `services/api/src/features/ai/` but is not wired to production route handlers or an external model provider.
- AI feedback review uses deterministic coaching responses. Authenticated sessions route through backend review workflow persistence, while no-session demo paths still use local mock responses; production external model/provider wiring, durable workers, usage metering, and audit logging remain future work.
- AI feedback must not rewrite student assignments.

## Phase 7: Progress

Primary feature:

- `apps/mobile/src/features/progress/`

Work:

- Maintain the implemented progress dashboard, skill detail, badges, weekly review, streak service, and badge unlock service.
- Maintain Zod validation for progress dashboard payloads.
- Keep focused tests for progress scoring, streak logic, and badge unlock logic.

Risks:

- Progress currently uses deterministic local mock data; backend progress persistence, aggregation, and sync remain future work.
- Progress inputs must remain stable shared contracts for parent, teacher, and backend reporting work.

## Phase 8: Notifications and Daily Assignments

Primary areas:

- `apps/mobile/src/features/assignments/`
- `apps/mobile/src/features/progress/`
- `apps/mobile/src/features/profile-settings/`
- `apps/mobile/src/core/notifications/`

Work:

- Maintain the implemented daily assignment selector, catalog, and mock assignment API wiring.
- Maintain notification preference parsing, local persistence, and Supabase RPC sync.
- Maintain notification payload preparation for daily assignment, streak, incomplete assignment, and weekly report reminders.
- Maintain local device scheduling and notification response routing through `expo-notifications`.
- Keep focused tests for daily assignment selection, streak continuation, notification preferences, prepared notification payloads, and scheduling request construction.

Risks:

- `expo-notifications` requires native build and store review planning.
- Remote push delivery still needs deployed route handlers/workers, APNs/FCM credentials, worker scheduling, and production observability.
- Parent/teacher report delivery is still not production-connected.

## Phase 9: Parent Experience

Primary feature:

- `apps/mobile/src/features/parent/`

Work:

- Parent home is implemented with a linked-student selector, weekly progress, skill improvement, area to practice, recent assignment review cards, and settings summary.
- Student report is implemented with strengths, practice focus, next family steps, skill progress, and reviewed assignments.
- Assignment review is implemented with student work, canvas preview, AI coaching feedback, rubric scoring, parent guidance, and safety framing.
- Parent settings are implemented with report, reminder, sharing, and AI coach access controls.
- Loading, empty, error, offline cached, and success states are present across parent surfaces.

Risks:

- Parent reporting currently uses local deterministic mock API data validated with Zod. Backend persistence, cross-device sync, authorization enforcement, and real weekly report delivery remain future work.

## Phase 10: Teacher Experience

Primary feature:

- `apps/mobile/src/features/teacher/`

Work:

- Teacher dashboard is implemented with class metrics, class progress entry points, active assignments, submission queue, and coaching-safety framing.
- Class progress is implemented with skill trends, instructional groups, support watchlist, and student progress rows.
- Assignment creation is implemented with validation for title, prompt, grade, class, skill focus, due date, rubric criteria, and canvas attachments.
- Submissions tab and submission review detail are implemented with rubric scoring, bounded student-writing previews, next revision task, and teacher comment save state.
- Loading, empty, error, offline cached, and success states are present across teacher surfaces.

Risks:

- Teacher data currently uses local deterministic mock API data validated with Zod. Backend persistence, class roster sync, authorization enforcement, assignment publication, and cross-device feedback comments remain future work.

## Phase 11: Subscriptions and Release Readiness

Primary features:

- `apps/mobile/src/features/subscriptions/`
- `apps/mobile/src/features/profile-settings/`

Work:

- Paywall, upgrade prompt, entitlement hook/service, entitlement gate, restore flow, and localized trust copy are implemented in `apps/mobile/src/features/subscriptions/`; paid access now reads backend RevenueCat entitlement state instead of local preview state. Extended progress history, family reports, teacher class insights, rubric detail, and canvas archive are wired to those gates or server redaction.
- Performance/offline polish is implemented with shared offline and retry components, skeleton loading states, bounded query cache defaults, stronger local draft/canvas recovery, retryable AI review and canvas sync states, and pagination placeholders for history-style lists.
- Extend accessibility settings as feature screens add read-aloud and dictation affordances.
- Complete empty, loading, error, and success states across major flows.
- Run release QA.

Risks:

- Entitlement sync requires backend and store integration decisions.
- Paywall copy must not block learning-critical safety or access requirements.

## Next Recommended Prompt

The canonical prompt sequence through `prompts/27_final_qa_release_checklist.md`
is complete. Release-hardening work should now follow `docs/FINAL_QA_REPORT.md`,
`docs/RELEASE_CHECKLIST.md`, and `docs/KNOWN_ISSUES.md`, with P0 backend,
authorization, payment, and production data-safety gaps first.
