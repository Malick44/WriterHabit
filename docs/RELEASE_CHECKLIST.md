# Release Checklist

Status: Current checklist for the next public-release push after Prompt 27.

## Current Gate

- [x] Expo mobile app scaffold exists under `apps/mobile/`.
- [x] Feature-based architecture is in place.
- [x] Expo Router route files are thin.
- [x] TypeScript strict mode is enabled.
- [x] Jest, TypeScript, Expo Doctor, and mobile production bundle exports pass.
- [ ] Public release is approved.

Current decision: do not release publicly yet.

## Product Safety

- [x] Student AI actions are coaching-oriented.
- [x] Forbidden shortcut CTAs are not exposed as student actions.
- [x] AI coach policy tests block assignment-completion requests.
- [x] Feedback shape emphasizes one strength, one improvement, and one next revision task.
- [x] Parent and teacher copy frames feedback as coaching, not assignment completion.
- [ ] Production AI moderation and provider-call boundaries are connected to a running backend.
- [ ] AI safety audit events are persisted in production storage.

## Architecture And Code Quality

- [x] Routes in `apps/mobile/app/` remain thin.
- [x] Feature modules own screens, components, hooks, API facades, services, stores, and tests.
- [x] Shared contracts are exposed through `packages/shared/` and shared app modules.
- [x] Data crossing API, storage, and AI boundaries is validated with Zod in implemented scaffolds.
- [x] Generated native folders are not kept in the repo for the current Expo CNG workflow.
- [x] `npm run lint -- --max-warnings=0` passes in `apps/mobile/`.
- [x] CI runs typecheck, zero-warning lint, tests, Expo Doctor, and mobile bundle export gates through `.github/workflows/mobile-release.yml`.

## Flow 1: Student First Assignment

- [x] Scenario is documented in `tests/e2e/flow-1-student-first-assignment.md`.
- [x] Onboarding completion and grade-adapted plan logic are tested.
- [x] Assignment history/detail readiness and submission scaffolds are tested.
- [x] AI review and revision validation scaffolds are tested.
- [x] Progress, streak, and badge logic are tested.
- [ ] Flow is automated in a mobile E2E runner.
- [ ] Flow is manually verified on iOS and Android devices.

## Flow 2: Canvas Assignment

- [x] Scenario is documented in `tests/e2e/flow-2-canvas-assignment.md`.
- [x] Canvas document creation, stroke normalization, and bounded payload logic are tested.
- [x] Canvas local persistence and sync recovery scaffolds are tested.
- [x] Assignment attachment and writing workspace canvas preview scaffolds exist.
- [ ] Real file export and object upload are implemented.
- [ ] Flow is automated in a mobile E2E runner.
- [ ] Flow is manually verified on lower-memory devices.

## Parent, Teacher, And Paywall

- [x] Parent home, reports, assignment review, student detail, and settings surfaces exist.
- [x] Teacher dashboard, assignment creation, class progress, submissions, and review surfaces exist.
- [x] Paywall, upgrade prompts, server-backed entitlement service, and restore flow exist.
- [x] Parent, teacher, and entitlement view-model tests pass.
- [ ] Parent-student and teacher-class authorization is enforced by production backend APIs.
- [ ] Weekly reports, classroom data, assignment publication, and teacher comments persist server-side.
- [x] Server-side RevenueCat entitlement sync, restore reconciliation, refunds, expirations, cancellations, renewals, grace-period states, provider event idempotency, and stale-event ordering guards are implemented.
- [ ] Native RevenueCat purchase SDK, owner app keys, store products, and sandbox purchase launch are configured in a rebuild.

## RevenueCat Sandbox Payment Test Plan

- [ ] Configure RevenueCat products for `WriterHabit_plus_monthly` and `WriterHabit_plus_yearly` with entitlement id `plus`.
- [ ] Set `REVENUECAT_WEBHOOK_AUTHORIZATION` and `REVENUECAT_SECRET_API_KEY` in the API environment; do not expose them to the mobile app.
- [ ] Configure RevenueCat webhook delivery to `POST /api/v1/webhooks/revenuecat` and verify invalid Authorization returns `401 webhook.invalid_signature`.
- [ ] Build a native app containing the RevenueCat SDK and owner-provided public iOS/Android app keys before testing purchase launch.
- [ ] App Store sandbox: buy monthly, start trial, cancel renewal, refund, restore on a fresh install, and verify `GET /me/entitlements` changes only after webhook/restore sync.
- [ ] Play Billing test purchase: buy yearly, trigger renewal, enter grace period/past due where supported, cancel, refund, restore, and verify server states.
- [ ] Replay the same RevenueCat webhook event id and verify only one `entitlement_provider_events` row is processed.
- [ ] Replay an older distinct RevenueCat renewal after a newer refund, expiration, and billing issue; verify the event row is ignored and Plus access is not restored until a newer `REFUND_REVERSED` or valid renewal arrives.
- [ ] Exercise RevenueCat transfer and alias cases: transfer a purchase between app user ids, restore on the new signed-in account, and verify the server reconciles only the intended account.
- [ ] Confirm free student writing, parent, and teacher flows remain available when entitlement state is `free`, `past_due`, `expired`, or `refunded`, while extended progress history, family reports, teacher class insights, rubric detail, and canvas archive show upgrade or payment-issue states.

## Localization And Accessibility

- [x] User-facing JSX copy guard passes.
- [x] Shared controls support accessibility labels, hints, roles, and minimum touch targets.
- [x] Grade-band adaptation exists for elementary, middle, and high-school experiences.
- [x] Loading, empty, error, success, and offline states exist across major implemented flows.
- [ ] Manual VoiceOver and TalkBack QA is complete (run `docs/DEVICE_QA_CHECKLIST.md`).
- [ ] Reduced-motion, high-contrast, larger text, and touch-target settings are device-tested
      (covered by `docs/DEVICE_QA_CHECKLIST.md` sections 2-6).
- [ ] Copy is reviewed by product/education stakeholders for Grades 1-5, 6-8, and 9-12.

## Backend, Data, And Privacy

- [x] API contracts are documented in `services/api/docs/`.
- [x] Database schema and RLS migration drafts exist.
- [x] Framework-neutral AI, canvas, audit, and feature-boundary scaffolds exist.
- [x] Mobile app uses public Expo Supabase env vars only.
- [x] Mobile API client requires `EXPO_PUBLIC_API_BASE_URL` outside development and sends Supabase bearer auth, request IDs, timeouts, structured errors, one-shot expired-token refresh, and Zod response validation for current backend-bound call sites.
- [x] Production API framework, package manifest, local build path, JWT-authenticated runtime shell, trusted-role derivation from server-owned metadata, standard error middleware, request IDs, and runtime integration tests exist under `services/api/`.
- [ ] Migrations run in a controlled environment and RLS policies are verified with role tests.
- [ ] Critical feature route handlers are wired to persistence, resource-level authorization, audit logging, and provider boundaries instead of returning `501 feature.disabled`.
- [ ] Signed URL endpoints are implemented for canvas/object storage.
- [ ] Data export, deletion, retention, and audit workflows are operational.
- [ ] Secrets scanning is part of CI and release review.

## Build, Store, And Operations

- [x] `npx expo export --platform ios` passes to a temp output directory.
- [x] `npx expo export --platform android` passes to a temp output directory.
- [x] Expo Doctor passes.
- [x] EAS build profiles are configured for development, preview, and production in `apps/mobile/eas.json`.
- [x] `expo-updates`, `runtimeVersion.policy`, `updates.url`, and `extra.eas.projectId` are wired in app config.
- [ ] Expo project owner links the real EAS project id and replaces `WriterHabit_EAS_PROJECT_ID_REQUIRED`.
- [ ] EAS/APNs/FCM credentials are configured for iOS and Android push delivery.
- [ ] iOS and Android store metadata, privacy labels, age rating, and screenshots are prepared.
- [ ] Crash reporting, analytics, support diagnostics, and safe metadata logging are selected.
- [ ] Release rollback, incident response, and data-deletion support procedures are documented.
- [ ] Web support is explicitly accepted or removed from release-gate scripts.

## Required Commands Before Any Release Candidate

Run from the project root unless noted:

```bash
./script/build_and_run.sh --typecheck
./script/build_and_run.sh --test
./script/build_and_run.sh --doctor
cd services/api && npm run typecheck
cd services/api && npm test
cd services/api && npm run build
cd apps/mobile && npx expo install --check
cd apps/mobile && npm run lint -- --max-warnings=0
cd apps/mobile && npx expo export --platform ios --output-dir /tmp/WriterHabit-expo-export-ios
cd apps/mobile && npx expo export --platform android --output-dir /tmp/WriterHabit-expo-export-android
```

If web is declared in scope, also run:

```bash
./script/build_and_run.sh --export-web
```

## Exit Criteria For Public Release

- P0 known issues in `docs/KNOWN_ISSUES.md` are closed.
- Required commands pass in CI.
- Real EAS project id, OTA update URL, and EAS credentials are configured and verified with `cd apps/mobile && npx eas-cli@latest config`.
- Flow 1 and Flow 2 pass in a mobile E2E runner and on manual QA devices.
- Backend authorization, RLS, audit, retention, and deletion workflows are verified.
- Payment and entitlement behavior is verified with RevenueCat, App Store, and Play Store sandbox accounts.
- Product, privacy, security, and education reviews approve the release build.
