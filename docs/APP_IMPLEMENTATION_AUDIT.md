# WriteWise App Implementation Audit

Audit run: 2026-06-10 23:24 PDT  
Remediation pass: 2026-06-11 (see "Remediation Update" below)  
Workspace: `/Users/malickdes/WorkSpace/writewise`  
Goal: plan and audit the entire implementation so the app can reach UI `9.5/10` and production functionality `10/10`.

## Executive Verdict

Current public-production verdict: **No-go** for real student/payment data (backend runtime, payments, and parent/teacher data remain mocked). UI quality target reached at code level.

Current score estimate (re-scored after the 2026-06-11 remediation pass):

| Dimension | Current Score | Target | Reason |
| --- | ---: | ---: | --- |
| UI quality | 9.5/10 | 9.5/10 | Every code-level blocker from the original audit is closed: Grades 1-12 onboarding, accessibility settings consumed by shared UI and auth chrome, honest language settings, canvas tap dots, no dead actions, parent/teacher tab icon polish, grade-band adaptation in assignment detail, truthful autosave/submit states, virtualized long lists, and deep-link/app config alignment. The residual half point is reserved for confirmation on real devices (VoiceOver/TalkBack, large text, screenshot matrix), which cannot be exercised from this environment. |
| Production functionality | 5.5/10 | 10/10 | Improved: mock auth now fails closed outside dev builds, submissions and revisions persist through Supabase with durable ids before success is shown, autosave is race-safe, write errors are surfaced, and Expo Doctor/strict lint/exports all pass. Still missing for 10/10: deployed backend runtime, server-derived roles, verified RLS hardening, payments, AI provider, object storage, audit/retention workers, EAS/CI/E2E. |
| Internal demo readiness | 8.5/10 | n/a | Deterministic mocks, local-first storage, passing Jest (43 suites / 175 tests), strict lint, Expo Doctor 21/21, and both platform exports make controlled demos reliable. |

The app remains a pre-production scaffold for data/payment purposes and must not process real student/classroom/payment data until the remaining P0 items below are closed.

## Remediation Update (2026-06-11)

All work was validated with `tsc --noEmit`, `eslint . --max-warnings=0`, the full Jest suite (43 suites / 175 tests, up from 42/170), `expo-doctor` (21/21), and iOS/Android `expo export`.

| Finding | Status | What changed |
| --- | --- | --- |
| P0-3 mock auth in production | **Closed** | `authStore` ignores `EXPO_PUBLIC_WRITEWISE_MOCK_SESSION` and rejects demo/mock sign-in unless `__DEV__`; three new tests cover production rejection and hydration fall-through. |
| P0-5 unchecked workflow writes (client portion) | **Improved** | `submitAssignment` now checks and throws on every Supabase write error (submission contents, review job, feedback, revision task). Server-side state machines still require the backend runtime (open). |
| P0-6 submission/revision truth | **Closed (client)** | `writingWorkspaceApi.submitDraft` now submits through `assignmentsApi.submitAssignment` and only routes to review with the backend-acknowledged submission id; `feedbackReviewApi.submitRevision` persists to `submission_revisions` (idempotent upsert) and fails loudly instead of faking completion; revision drafts are deleted only after acceptance. |
| P0-7 autosave stale writes | **Closed** | Writing and canvas saves are serialized through a promise chain; results from superseded saves can no longer overwrite newer work; status only reports "saved" when the latest text is durable. New deferred-promise race test in `useWritingWorkspace.test.tsx`. |
| P1-1 Expo Doctor | **Closed** | All nine SDK 56 packages updated via `expo install --fix`; `expo-doctor` passes 21/21. |
| P1-2 strict lint | **Closed** | `eslint . --max-warnings=0` passes. |
| P1-3 web export gate | **Closed (descoped)** | Web is not a supported platform; web export is removed from release expectations. iOS and Android exports are the release gates and both pass. |
| P1-5 Grades 1-2 onboarding | **Closed** | `GradeSelectionScreen` renders the canonical `GRADE_GROUPS` (Grades 1-12) and computes the grade band from the selected grade; grades 1-2 flow into elementary band and sentence-practice focus. |
| P1-6 revision draft loss | **Closed** | Pending revision drafts are flushed on unmount and on app background; the autosave badge truthfully reports saving/saved/failed instead of always "Saved". |
| P1-7 wrong feedback fallback | **Closed** | The "any feedback_ready assignment" fallback was removed; only exact submission/assignment matches resolve, otherwise the missing state shows. |
| P1-10 accessibility consistency | **Closed (code)** | `Card` and `ProgressBar` consume text-size/high-contrast settings; auth chrome text scales and honors high contrast. Manual device QA remains a release-checklist item. |
| P1-11 unsupported locales | **Closed** | Only `en` is selectable; legacy stored `es`/`fr` coerce safely; settings copy sets honest expectations. |
| P1-12 service copy localization | **Closed (documented)** | `docs/CONTENT_LOCALIZATION_STRATEGY.md` defines client-localized chrome vs server-authored content (key + fallback columns) and the gate for enabling new locales. |
| P1-13 list fetch/render pressure | **Closed** | Assignment history and canvas home use `FlatList`; history queries order newest-first with `.limit(50)` and fetch only needed draft columns; canvas summaries read a new generated `stroke_count` column (migration `202606100002`, applied to dev Supabase) instead of full stroke payloads. |
| P2 canvas tap dots | **Closed** | Taps below the drag threshold now record single-point strokes that render as dots. |
| P2 dead actions | **Closed** | Student home/progress notification icons open notification settings; parent home notification icon opens parent settings; teacher dashboard's dead notification/settings/avatar chrome removed; revision screen's dead ellipsis/fullscreen icons removed and "View Full Screen" opens a real modal. |
| P2 parent/teacher tab polish | **Closed** | Both tab bars now have focused/unfocused icons, tint colors, and label styling consistent with student tabs. |
| P2 deep-link config | **Closed** | `app.json` declares `associatedDomains` (iOS) and an `autoVerify` HTTPS intent filter (Android) matching `deepLinkPrefixes`. |
| P2 minimal app config | **Closed** | `app.json` now has name/slug/version, orientation, build number, version code, tablet support, and user interface style. |
| P2 assignment detail grade band | **Closed** | `DetailText` resolves typography from the screen's grade band via context instead of hardcoding the middle band. |

Remaining open findings (all server-side, tracked in the roadmap): P0-1 backend runtime, P0-2 server-derived roles, P0-4 RLS escalation review, P0-8 payments, P0-9 parent/teacher data, P0-10 audit/retention, P0-11 EAS/CI, P1-4 E2E automation, P1-8 apiClient hardening, P1-9 provider integrations, P1-14 notification status separation, P1-15 teacher moderation, P1-16 seed data.

## Audit Plan Used

I used a focused sub-agent fan-out rather than hundreds of agents. Hundreds were not needed for this repo shape and would have duplicated findings. Six specialist agents were spawned, and two remaining areas were covered locally due to the concurrency limit.

| Pass | Scope | Method |
| --- | --- | --- |
| App shell/auth | Expo Router, role routing, auth/session, localization/accessibility, shared UI | Sub-agent |
| Student flow/UI | Onboarding, home, assignments, writing, canvas, AI coach, feedback/revision, progress | Sub-agent with `ux-flow` and `writing-screen-review` guidance |
| Parent/teacher/subscriptions | Parent, teacher, profile/settings, notifications, paywall | Sub-agent |
| Backend/Supabase/security | `services/api`, migrations, RLS, audit/privacy/data retention | Sub-agent with Supabase guidance |
| Memory/performance/offline | Autosave, canvas, local storage, long lists, query cache | Sub-agent with `mobile-memory-guard` guidance |
| Expo/release | Expo config, EAS, native/runtime, lint, web, release gates | Sub-agent with Expo OTA/rebuild guidance |
| Testing/docs truthfulness | Jest, integration scaffolds, E2E docs, stale docs | Local audit and command verification |

## Current Validation Results

Commands run from `/Users/malickdes/WorkSpace/writewise` unless noted. Updated 2026-06-11 after the remediation pass.

| Check | Result | Notes |
| --- | --- | --- |
| `cd apps/mobile && npx tsc --noEmit` | Pass | Typecheck clean. |
| `cd apps/mobile && npx jest` | Pass | 43 suites, 175 tests passed (adds autosave race and production mock-auth rejection tests). |
| `cd apps/mobile && npm run lint -- --max-warnings=0` | Pass | Strict zero-warning lint gate passes. |
| `cd apps/mobile && npx expo-doctor` | Pass | 21/21 checks. |
| `cd apps/mobile && npx expo install --check` | Pass | All Expo SDK 56 packages on expected versions. |
| Web export | Descoped | Web is not a supported release platform; iOS/Android exports are the gates. |
| `cd apps/mobile && npx expo export --platform ios` | Pass | iOS JS bundle exported. |
| `cd apps/mobile && npx expo export --platform android` | Pass | Android JS bundle exported. |
| `node scripts/supabase-admin.mjs health` | Pass for local dev | Postgres Meta reachable; `authUsersVisible: true`; storage bucket count is `0`. |
| `node scripts/supabase-admin.mjs tables public` | Pass for local dev | 38 public tables visible; migration `202606100002` (canvas `stroke_count`) applied. |

Local hygiene: `apps/mobile/.expo/`, `apps/mobile/ios/`, `apps/mobile/android/`, and `docs/.DS_Store` are present as ignored local files. They are not tracked, and I did not remove them in this audit.

## Strengths To Preserve

- Feature-based mobile architecture is in place under `apps/mobile/src/features/`.
- Most route files under `apps/mobile/app/` are thin 3-line screen exports.
- Shared UI primitives exist for buttons, cards, forms, feedback states, modals, top alerts, layout, and app headers.
- JSX hardcoded-copy guard exists and passed inside Jest.
- AI student-facing CTAs are policy-safe in the runtime app scan; forbidden shortcut CTAs were not found as app actions.
- Jest coverage is meaningfully broader than an initial scaffold: auth, routing, onboarding, assignments, writing metrics/persistence, canvas persistence/sync, AI policy, feedback/revision, progress, parent, teacher, subscriptions, notifications, i18n, and shared UI tests are present.
- Supabase schema/RLS drafts are substantial, and a local development Supabase is reachable.
- Canvas documents, AI context excerpts, query cache defaults, and undo history have some explicit bounds.

## P0 Findings

### P0-1: No Production Backend Runtime

Evidence:

- `services/api/README.md` says there is no running API server, package manifest, production migration runner, or deployment configuration.
- `services/api/src/features/*` contains framework-neutral controllers/services, not deployed endpoints.
- `apps/mobile/src/core/api/apiClient.ts` defaults to `http://localhost:3000/api/v1`.

Impact: real users cannot safely persist, sync, authorize, audit, or recover student, parent, teacher, assignment, feedback, canvas, progress, subscription, or notification data.

Fix:

- Choose backend runtime.
- Add package manifest, local dev server, health checks, deploy config, CI, and migration runner.
- Implement auth middleware, request validation, repositories, transactions, audit hooks, and integration tests.

### P0-2: Authorization And Role Trust Are Unsafe

Evidence:

- `apps/mobile/src/core/auth/sessionService.ts` maps `role`, onboarding status, and subscription status from client-visible Supabase metadata.
- Onboarding/sign-up can set or update role metadata from the mobile client.
- `apps/mobile/src/core/auth/roleGuards.ts` and route gates use that role for UI access.
- `services/api/docs/AUTHORIZATION_RULES.md` says backend endpoints must not trust client-supplied role/IDs.

Impact: route gates are UX only. They cannot protect parent, teacher, admin, entitlement, or student data in production.

Fix:

- Derive role and entitlements from server-owned profile tables, app metadata, or custom claims.
- Remove mobile role mutation.
- Make teacher access invite/admin-approved.
- Treat route gates as convenience only and enforce all access on the server/RLS layer.

### P0-3: Mock Auth Can Activate Outside Development

Evidence:

- `apps/mobile/src/core/auth/authStore.ts` reads `EXPO_PUBLIC_WRITEWISE_MOCK_SESSION`.
- Hydration prefers a mock session before Supabase when that env var is present.

Impact: a misconfigured production build could enter a local/demo session path.

Fix:

- Hard-disable mock sessions outside `__DEV__` or explicitly named internal preview channels.
- Fail closed if mock env flags are present in a production build.
- Add a test for production mock-session rejection.

### P0-4: RLS Has A Likely Admin Escalation Path

Evidence:

- `services/api/migrations/202606090001_initial_writewise_schema.sql` allows `users.role = 'admin'`.
- `services/api/migrations/202606090002_privacy_rls_policies.sql` uses `public.users.role` for `is_writewise_admin()`.
- `services/api/migrations/202606100001_profile_settings_notification_sync.sql` creates a self-update policy on `public.users` without an obvious column restriction.

Impact: a user may be able to update their own `users.role` and become admin, depending on grants and runtime execution.

Fix:

- Drop broad self-update policy.
- Use scoped RPCs or column-level grants only for safe profile fields.
- Make role changes service/admin-only.
- Add trigger protection against non-service role changes.
- Add negative RLS tests for student-to-admin escalation.

### P0-5: Mobile Writes Bypass Server Workflow Authorization

Evidence:

- `apps/mobile/src/features/assignments/api/assignmentsApi.ts` directly creates submission/content/review/feedback/revision rows and marks assignments `feedback_ready`.
- RLS drafts allow owner-managed writes for several tables that should be system-owned transitions.

Impact: critical workflow state can be forged or advanced by the public mobile client instead of a trusted backend transaction.

Fix:

- Move submission, review-job, feedback, progress, and status transitions into backend transactions.
- Deny public-client writes to system-owned tables.
- Enforce state machines server-side.
- Check and surface every write error.

### P0-6: Submission And Revision Success Are Not Durable Truth

Evidence:

- Writing draft save falls back to local JSON on Supabase errors.
- `apps/mobile/src/features/writing-workspace/api/writingWorkspaceApi.ts` can return `review-${assignmentId}` after local save.
- `apps/mobile/src/features/feedback-review/api/feedbackreviewApi.ts` returns local completion, and `RevisionScreen` removes the local revision draft after submit.

Impact: students can see review/completion success without backend acceptance. Revision work could be deleted after a local-only completion path.

Fix:

- Split states into `saved_local`, `queued_for_submit`, `submitted_remote`, and `review_ready`.
- Do not route to review/completion until a durable backend id is acknowledged.
- Keep offline queues visible and retryable.
- Delete local drafts only after server confirmation.

### P0-7: Autosave Can Apply Stale Writes

Evidence:

- `apps/mobile/src/features/writing-workspace/hooks/useWritingWorkspace.ts` applies async save results without a monotonic save guard.
- `apps/mobile/src/features/canvas/hooks/useCanvas.ts` applies async save results similarly.
- Existing autosave tests cover debounce/cancel but not out-of-order resolution.

Impact: slow storage/network can let an older draft/canvas save overwrite or visually supersede newer work.

Fix:

- Add monotonic client save versions for text drafts and canvas.
- Serialize autosave or use latest-only queues.
- Discard stale save results before updating refs/UI.
- Add deferred-promise tests where old saves resolve after newer saves.

### P0-8: Payments Are Local Preview Logic

Evidence:

- `apps/mobile/src/features/subscriptions/api/subscriptionsApi.ts` uses static plans/prices and returns `activated_preview`.
- `services/api/src/features/subscriptions/subscriptions.controller.ts` is a placeholder.

Impact: paid plans, restore purchases, renewals, refunds, family access, and entitlement gates cannot be trusted.

Fix:

- Integrate StoreKit/Play Billing or a provider such as RevenueCat.
- Add receipt validation, signed webhooks, entitlement persistence, restore/refund handling, and server-side entitlement gates.

### P0-9: Parent And Teacher Experiences Are Mocked

Evidence:

- `apps/mobile/src/features/parent/api/parentApi.ts` hardcodes students, reports, assignments, and settings.
- `apps/mobile/src/features/teacher/api/teacherApi.ts` hardcodes classes, assignments, submissions, and reviews.
- Backend parent/teacher controllers are placeholders.

Impact: parent/teacher UI can demo workflows but cannot support real guardians, classrooms, rosters, reports, comments, publication, or authorization.

Fix:

- Implement parent/teacher APIs backed by `parent_student_links`, `classes`, and `class_students`.
- Persist reports/classes/assignments/comments.
- Add positive/negative authorization and RLS tests for revoked links and removed class membership.

### P0-10: Audit, Retention, Export, And Deletion Are Not Operational

Evidence:

- `docs/DATA_RETENTION_POLICY.md` states no backend runtime or deletion worker exists.
- `services/api/src/features/audit/audit.service.ts` defaults to no persistence sink.

Impact: child-safety, privacy, FERPA/COPPA-style operational requirements, deletion, export, and audit review cannot be honored in production.

Fix:

- Persist audit events to `audit_logs`.
- Implement retention config, export/delete request records, deletion workers, object-storage cleanup, and audit events for every sensitive action.

### P0-11: EAS/OTA/CI Release Surface Is Not Configured

Evidence:

- No `eas.json`, `.eas/`, or `.github/` workflow files were found.
- `apps/mobile/app.json` has no EAS project id, update policy, explicit runtime version, build number/version code, or OTA policy.
- `expo-updates` is not installed.

Impact: there is no reproducible dev/preview/production build path, no automated release gates, and no reliable OTA runtime policy.

Fix:

- Add EAS project config, profiles, runtime/update policy, CI workflows, and release-channel strategy.
- Run dev, preview, and production builds before public release.

## P1 Findings

### P1-1: Expo Doctor Currently Fails

Evidence: Expo Doctor reports nine Expo SDK 56 packages behind expected patch versions.

Fix: run `npx expo install --check`, update the packages, retest, rebuild native binaries as needed, and commit lockfile changes intentionally.

### P1-2: Strict Lint Gate Fails

Evidence: `npm run lint -- --max-warnings=0` fails on `apps/mobile/src/features/canvas/components/StrokeCanvasAdapter.tsx:224`.

Fix: include `onBeginStroke` in the callback dependencies or stabilize the parent callback and keep strict zero-warning lint in CI.

### P1-3: Web Export Is A Broken Release Gate

Evidence: `./script/build_and_run.sh --export-web` fails because `react-native-web` is missing.

Fix: either install and validate web support, or remove web export from release expectations and docs.

### P1-4: No Mobile E2E Automation

Evidence: `tests/e2e/` contains scenario docs, not a Maestro/Detox runner. No CI workflows were found.

Fix: automate student first assignment, canvas assignment, parent report review, teacher assignment creation, paywall gates, auth, notification permission paths, offline recovery, and route/deep-link flows.

### P1-5: Grades 1-2 Cannot Onboard

Evidence: `GradeSelectionScreen` offers Grades 3-12, while product scope is Grades 1-12.

Fix: add Grades 1 and 2, compute grade band from selected grade, and adjust early-elementary UI density/copy.

### P1-6: Revision Drafts Can Be Lost On Quick Exit

Evidence: `RevisionScreen` debounces local save and clears the timer on cleanup without flushing the latest text.

Fix: keep latest text in a ref, flush on unmount/background, expose `saving/saved/failed`, and add retry.

### P1-7: Feedback Lookup Can Show The Wrong Review

Evidence: feedback review fallback picks the first `feedback_ready` assignment if exact submission matching fails.

Fix: require exact submission ownership/match and show a missing/error state otherwise.

### P1-8: API Client Has No Bearer Auth, Timeout, Or Response Validation

Evidence: `apps/mobile/src/core/api/apiClient.ts` sends only JSON headers and casts `response.json()` to `T`.

Fix: inject Supabase access token, add request IDs, timeout/abort, typed errors, 401 sign-out/refresh behavior, and Zod response validation.

### P1-9: AI, Canvas Storage, Notifications, And Entitlements Are Scaffolds

Evidence:

- AI uses deterministic local/mobile mocks and framework-neutral mock providers.
- Canvas signed upload/export URLs are placeholders.
- Notifications lack deployed backend workers/APNs/FCM/EAS project id.
- Entitlements lack provider sync.

Fix: wire provider adapters, moderation, rate limits, signed object storage, export workers, push delivery, payment webhooks, entitlement reconciliation, and audit logging.

### P1-10: Accessibility Support Is Inconsistent

Evidence:

- Auth chrome uses custom colors/type and often bypasses accessibility helpers.
- Shared `Card` and `ProgressBar` do not fully consume high-contrast/text-size settings.
- Manual VoiceOver/TalkBack/large text/high contrast/reduced motion QA has not been run.

Fix: standardize shared accessibility helpers across core UI, then run manual device QA.

### P1-11: Language Settings Imply Unsupported Locales

Evidence: preferences allow `en`, `es`, and `fr`, but the canonical i18n dictionary only supports `en`.

Fix: add dictionaries and locale provider hydration, or hide unsupported locales until translation is real.

### P1-12: Service-Generated User Copy Is Not Fully Localized

Evidence: feature API facades return display text directly, including assignment prompts/titles, dashboard copy, parent reports, teacher comments, subscription renewal labels, AI coach guidance, and feedback summaries.

Impact: the JSX guard passes, but user-facing text still leaks through service/mock data.

Fix: return localization keys/structured data for seeded/demo content, or make backend content explicitly user-authored/server-authored with translation strategy documented.

### P1-13: History Lists Fetch Too Much And Render Without Virtualization

Evidence:

- Assignment history fetches nested assignment/rubric/draft data without pagination.
- Canvas summaries fetch full stroke payloads only to count strokes.
- Several history/class/submission lists render inside `ScrollView`.

Fix: add `.limit()`/`.range()`, stored list summaries, and `FlatList`/`SectionList` for long lists.

### P1-14: Notification Settings Can Overstate Success

Evidence: preference save can succeed locally while token registration/delivery sync fails and the screen still shows a saved state.

Fix: expose permission, token, schedule, and remote-sync status separately.

### P1-15: Teacher Trust/Safety Is UI-Level Only

Evidence: teacher assignment prompts and comments have shape/length validation, not backend academic-integrity moderation or audit enforcement.

Fix: moderate and audit teacher-created prompts/comments before publication or student visibility.

### P1-16: Catalog Seed Data Is Missing

Evidence: schema docs still require seed data; mobile references fixed default assignment UUIDs.

Fix: add versioned seed migrations for rubrics, assignment templates, badges, and test fixtures.

## P2 Findings

- Canvas misses single-tap dots because stroke creation starts only after movement passes a distance threshold.
- Canvas drawing can create thousands of React Native views at current stroke caps; lower caps or move completed strokes to a path primitive before older-device production use.
- Local draft/revision storage lacks TTL, byte budget, and per-student pruning.
- Writing metrics allocate arrays on every text change and duplicate text references in state.
- Parent/teacher tab bars lack icon+label polish compared with student tabs.
- HTTPS deep-link prefixes exist in code but are not configured in native app config.
- App config is too minimal for store operations: no build numbers, version code, splash/orientation, EAS metadata, update policy, or release metadata.
- Visible notification icons/actions in some student screens are empty handlers or dead ends.
- Assignment detail does not fully apply grade-band adaptation.
- Profile/settings mix Supabase RPC attempts, local fallback, hardcoded metrics, and screen-local toggles.
- `apps/mobile/src/services/fileSystem.ts` is a pass-through TODO facade, so canvas file cache/export behavior is not real.
- Existing docs are partially stale: `docs/KNOWN_ISSUES.md` says lint passes with zero warnings, while current strict lint fails; `docs/FINAL_QA_REPORT.md` still reflects older Prompt 27 lint/Doctor results.

## Screen Review Summary

Screens reviewed: auth launch/sign-in/sign-up, onboarding, student home, assignment history/detail/submission, writing workspace, canvas home/template/editor/attachment, AI coach, feedback loading/summary/rubric/revision/completion, progress, parent home/reports/settings/assignment review, teacher dashboard/assignments/create/class progress/submissions/review, profile/settings, paywall.

Draft-safety findings:

- Typed/canvas autosave exists but lacks stale-write protection.
- Revision draft save can be dropped on fast exit.
- Submission/revision completion can be shown before durable backend acceptance.

State findings:

- Loading/empty/error/offline states exist broadly, but many are scenario/env driven rather than true runtime network/backend states.
- Some actions are visible before their destination exists.

Integrity and safety findings:

- Student-facing forbidden AI CTAs were not found in runtime app code.
- Teacher-created content and backend AI calls still need real moderation/audit enforcement.

Accessibility findings:

- Accessibility labels and helpers exist.
- Inconsistent application and missing manual device QA prevent a 9.5 UI score.

Correctness findings:

- Route files are thin.
- Feature boundaries are mostly good.
- Critical correctness gaps are in auth, backend state, local/demo fallbacks, and persistence truth.

## Memory Impact Summary

Hotspots considered: large typed drafts, canvas strokes/previews, feedback payloads, parent/teacher lists, assignment history, progress history, query cache, local JSON storage.

Decisions already present:

- Canvas documents and undo history are bounded.
- AI context excerpts are bounded.
- TanStack Query defaults include bounded garbage collection.

Remaining memory/performance fixes:

- Add stale-write protection for autosave.
- Paginate and virtualize long lists.
- Avoid fetching full stroke documents for list summaries.
- Add local storage pruning.
- Debounce or single-pass writing metrics for long drafts.
- Reduce canvas RN view pressure or move to a path renderer.

Deployment impact:

- Pure JS fixes are OTA-safe in principle.
- OTA is not currently configured.
- Native drawing renderer, notification config, payment SDKs, and Expo dependency alignment require new native builds and likely store review.

## Remediation Roadmap

### Phase 0: Stop Release Drift

1. Mark public release blocked.
2. Update stale release docs to reflect current validation results.
3. Add CI skeleton that runs typecheck, strict lint, Jest, Expo Doctor, and mobile exports.
4. Decide whether web is supported or remove web export from release gates.

### Phase 1: Close Immediate P0 Safety/Integrity Risks

1. Disable mock auth in production.
2. Remove mobile role mutation and derive roles server-side.
3. Fix the `users` self-update RLS escalation path.
4. Add Bearer auth, timeout, typed errors, and response validation to `apiClient`.
5. Add stale-write protection to writing and canvas autosave.
6. Block review/completion UI until durable backend acceptance exists.

### Phase 2: Build Production Backend And Data Truth

1. Select runtime and create `services/api` package/deploy path.
2. Implement auth middleware, feature endpoints, repositories, and server transactions.
3. Add migration runner, seed data, and RLS test harness.
4. Move assignment/review/progress/canvas workflows behind backend state machines.
5. Implement audit, retention, export, and deletion workflows.

### Phase 3: Production Services

1. Wire AI provider, moderation, rate limits, usage limits, structured output validation, and audit persistence.
2. Implement canvas signed upload/download, file export, object storage authorization, and cleanup.
3. Implement StoreKit/Play Billing or payment-provider entitlements with webhooks.
4. Deploy notification token registration, APNs/FCM delivery workers, observability, and retry.

### Phase 4: UI 9.5 Pass

1. Add Grades 1-2 and early-elementary UI adaptations.
2. Remove unsupported locale choices or ship real `es`/`fr` dictionaries.
3. Localize service-generated mock/display content or document server-authored content strategy.
4. Fix dead actions, parent/teacher tab styling, deep-link config mismatch, canvas tap dots, and revision save status.
5. Run screenshot/device QA across small phones, tablets, iOS/Android, large text, high contrast, reduced motion, VoiceOver, and TalkBack.
6. Add design review artifacts for the top flows and compare against 9.5/10 rubric.

### Phase 5: Release Operations

1. Add EAS project metadata, dev/preview/prod profiles, runtime version policy, update policy, build numbers, version codes, splash/orientation, and store metadata.
2. Fix Expo Doctor package mismatches and rebuild.
3. Add Maestro or Detox E2E in CI.
4. Add crash reporting, privacy labels, support diagnostics, rollback plan, and incident/deletion procedures.
5. Run final release candidate matrix.

## Acceptance Criteria For 10/10 Functionality

- All P0 findings closed with tests.
- Production backend deployed and exercised by mobile builds.
- RLS tests prove student, parent, teacher, admin, and service boundaries.
- No client-controlled role/entitlement or mock auth path in production.
- Student writing/canvas/revision cannot be lost under background, offline, slow network, or stale save races.
- Payments, restore, refunds, and entitlements reconcile server-side.
- AI moderation, rate limits, policy checks, and audit logs are operational.
- Canvas storage/export/signed URLs are operational and authorized.
- Parent/teacher data is persisted, authorized, and no longer hardcoded.
- CI runs typecheck, strict lint, tests, Expo Doctor, exports, and E2E.
- Manual device/accessibility QA passes.

## Acceptance Criteria For UI 9.5/10

- All visible actions lead to implemented flows.
- Grades 1-2, 3-5, 6-8, and 9-12 each have appropriate density, tone, and controls.
- All user-facing app/service-generated copy is localization-ready.
- Large text, screen reader, reduced motion, high contrast, and touch target checks pass on real devices.
- Core flows have screenshot baselines and no clipping/overlap at target viewports/devices.
- Parent/teacher/paywall UI reflects real data and real status, not deterministic placeholders.
- Canvas handwriting interactions support dots, strokes, undo/redo, save, sync failure, retry, and low-memory behavior.

## Next Recommended Engineering Step

Start with the security/data-truth cluster:

1. Disable production mock auth.
2. Remove client role mutation.
3. Fix `users` self-update RLS escalation.
4. Add authenticated `apiClient`.
5. Add autosave stale-write protection.

Those changes reduce the highest student-data and work-loss risk before larger backend implementation begins.

