# Release Blocker Review 05: Payments And Entitlements, Round 1

## 1. Executive summary

The RevenueCat backend entitlement path is a meaningful improvement: mobile no
longer grants `activated_preview`, trusted sessions call the API for
entitlements, checkout returns a non-mutating `pending_store_purchase`, restore
fails closed without provider credentials, webhooks require the configured
Authorization header, provider events are idempotent by event id, and the
subscription migration is applied.

The task is not release-approved yet. The advertised Plus features are not
actually protected by the entitlement gate anywhere outside the subscription
module, so free users can still reach representative Plus surfaces directly.
That is a P1 release-impact issue for payments: the entitlement source of truth
exists, but paid access is not enforced on the product surfaces that claim to be
Plus.

## 2. Findings by severity

### P1: Plus feature access is not enforced on the advertised premium surfaces

`services/api/src/features/subscriptions/subscriptions.contracts.ts:103` through
`services/api/src/features/subscriptions/subscriptions.contracts.ts:125`
declares `extended_progress_history`, `family_progress_reports`,
`teacher_class_insights`, `rubric_detail`, and `canvas_archive` as `plus`
features. The gate logic exists in
`apps/mobile/src/features/subscriptions/components/EntitlementGate.tsx:72` and
is tested, but a repo-wide search for `EntitlementGate` found no consumers
outside the subscription module/tests.

Representative premium routes still export their feature screens directly with
no entitlement wrapper or server-side entitlement check:

- `apps/mobile/app/(parent)/students/[studentId]/report.tsx:1`
- `apps/mobile/app/(teacher)/classes/[classId]/progress.tsx:1`
- `apps/mobile/app/(student)/review/[submissionId]/rubric.tsx:1`
- `apps/mobile/app/(student)/progress/index.tsx:1`
- `apps/mobile/app/(student)/canvas/index.tsx:1`

Impact: the provider/webhook work can correctly mark a user as free, expired, or
refunded, but the app does not use that decision to protect the declared Plus
surfaces. Before WW-REL-003 can be closed, each Plus surface needs an explicit
free-vs-Plus decision and enforcement point, preferably inside feature screens or
feature-owned route wrappers so Expo route files remain thin. Server-backed
premium APIs should also reject unpaid access where backend data is involved.

### P2: API contract documentation has a restore response shape mismatch

`services/api/docs/API_CONTRACT.md:1159` documents `RestoreResponse` with
`entitlements: EntitlementsResponse`, but the implemented backend/mobile
contract uses singular `entitlement` in
`services/api/src/features/subscriptions/subscriptions.contracts.ts:158` and
`apps/mobile/src/features/subscriptions/types.ts:114`.

Impact: this is not blocking the current code path, but it should be corrected
before external API consumers or QA scripts rely on the contract doc.

### P2: RevenueCat transfer/alias reconciliation is still a hardening gap

The webhook normalizer maps owner identity from `app_user_id` or
`original_app_user_id` in
`services/api/src/features/subscriptions/subscriptions.service.ts:261`, and
unsupported/missing-user events are ignored or fail closed. RevenueCat's current
official webhook docs note that `TRANSFER` events do not have `app_user_id` and
that systems should search original app user IDs and aliases when resolving
users. The restore endpoint can reconcile the signed-in user's current
RevenueCat subscriber state, so this is not a blocker for the local round, but
transfer and alias cases should be part of the native SDK/store sandbox pass.

## 3. Validation reviewed or run

- Reviewed required startup files and task prompt.
- Reviewed current `HEAD` diff and untracked task files.
- Reviewed mobile subscription API, hook, gate/view-model, paywall UI, and
  representative Plus feature routes.
- Reviewed backend subscription service, contracts, routes, config, error
  mapping, in-memory/Supabase data paths, migration, and API/auth docs.
- Ran `cd services/api && npm run typecheck`: passed.
- Ran `cd services/api && npm test`: passed, 4 files / 83 tests.
- Ran `cd services/api && npm run build`: passed.
- Ran `./script/build_and_run.sh --typecheck`: passed.
- Ran `cd apps/mobile && npm run lint -- --max-warnings=0`: passed.
- Ran `./script/build_and_run.sh --test`: passed, 46 suites / 202 tests.
- Ran `./script/build_and_run.sh --doctor`: passed, 21/21 checks.
- Ran `node scripts/supabase-migrations.mjs status`: migration
  `202606110005_subscription_entitlement_lifecycle.sql` is applied with checksum
  OK.
- Ran `node scripts/supabase-migrations.mjs apply-and-verify`: skipped already
  applied migrations and passed resource RLS verification.
- Ran `git diff --check HEAD`: passed.
- Spot-checked official RevenueCat docs for webhook Authorization, duplicate
  event idempotency, event fields, and transfer/alias guidance:
  https://www.revenuecat.com/docs/integrations/webhooks and
  https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields.

## 4. Documentation/release-checklist accuracy

The docs honestly call out the remaining external payment blockers: native
RevenueCat SDK purchase launch, owner app keys, store products, server env
values, and sandbox store QA. The release checklist now includes a concrete
RevenueCat sandbox plan.

Deployment impact: the current mobile code changes are OTA-safe because
`apps/mobile/package.json`, `apps/mobile/app.json`, and `apps/mobile/eas.json`
were not changed. The backend changes require API deployment plus the applied
database migration. The next native RevenueCat SDK/app-key purchase flow will
require a new native build, and production rollout will require store
resubmission for the released binary.

Docs still need the restore response typo fixed, and the payment docs should be
tightened after the Plus-feature gating decision so parent/family/class/school
scope does not imply functionality that is not implemented.

## 5. Required implementation follow-up

1. Wire the declared Plus surfaces to entitlement enforcement, while preserving
   thin Expo route files. At minimum decide and implement gating for progress
   history, parent family reports, teacher class insights, rubric detail, and
   canvas archive.
2. Add tests proving free, expired, refunded, and past-due users see upgrade or
   payment-issue states for those Plus surfaces, and active/trial/grace-period
   users can access them.
3. Add server-side entitlement checks for any backend endpoints that return paid
   feature data.
4. Correct the API contract restore response field from `entitlements` to
   `entitlement`.
5. Include transfer/alias RevenueCat scenarios in the native SDK sandbox pass.

## 6. Final decision

Changes requested. The backend/provider entitlement implementation validates
cleanly, but the release blocker cannot be closed until Plus feature access is
actually enforced.

REVIEW_STATUS: changes_requested
