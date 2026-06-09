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
- Canvas screens are implemented with local stroke autosave; backend sync and export remain future work.
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
- Implement future file export/object storage when backend and file-system contracts are ready.

Risks:

- File system facade currently has TODO implementations.
- Current canvas rendering uses a local React Native stroke adapter rather than a production drawing engine.
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

- AI coach currently uses deterministic local mock responses; backend AI service calls, usage limits, and audit-safe metadata logging remain future work.
- AI feedback review currently uses deterministic local mock responses and placeholder progress; backend AI review jobs, feedback persistence, and progress sync remain future work.
- AI feedback must not rewrite student assignments.

## Phase 7: Progress

Primary feature:

- `apps/mobile/src/features/progress/`

Work:

- Implement progress dashboard.
- Implement skill detail.
- Implement badges.
- Implement streak and growth calculations.
- Add unit tests for progress calculations and badge unlock logic.

Risks:

- Existing progress calculator has no tests.
- Progress inputs must be stable shared contracts.

## Phase 8: Parent Experience

Primary feature:

- `apps/mobile/src/features/parent/`

Work:

- Implement parent home.
- Implement student report.
- Implement assignment review.
- Add weekly progress summary states.

Risks:

- Parent reporting depends on assignment and progress contracts that are not yet implemented.

## Phase 9: Teacher Experience

Primary feature:

- `apps/mobile/src/features/teacher/`

Work:

- Implement teacher dashboard.
- Implement assignment creation.
- Implement submission review.
- Add class progress summaries.

Risks:

- Backend contracts and authorization model are not selected yet.

## Phase 10: Subscriptions and Release Readiness

Primary features:

- `apps/mobile/src/features/subscriptions/`
- `apps/mobile/src/features/profile-settings/`

Work:

- Implement paywall.
- Implement upgrade prompts.
- Implement entitlement gates.
- Extend accessibility settings as feature screens add read-aloud and dictation affordances.
- Complete empty, loading, error, and success states across major flows.
- Run release QA.

Risks:

- Entitlement sync requires backend and store integration decisions.
- Paywall copy must not block learning-critical safety or access requirements.

## Next Recommended Prompt

Use `prompts/15_progress_tracking_and_badges.md` next. Structured feedback review, revision tasks, and completion placeholders now exist; the next gap is real progress tracking and badges.
