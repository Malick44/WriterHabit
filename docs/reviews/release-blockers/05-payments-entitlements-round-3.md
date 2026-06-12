# Release Blocker Review 05: Payments And Entitlements, Round 3

## 1. Executive summary

Round 3 fixes the Round 2 stale-webhook blocker: entitlement rows now persist
last-applied provider event metadata, older distinct RevenueCat renewal/active
events are recorded as ignored instead of re-enabling access after newer refund,
expiration, or billing-issue events, and tests cover stale refund, expiration,
past-due, reversal, and renewal recovery paths.

The task is not release-approved yet. Grace-period access is represented during
RevenueCat normalization, but the persisted entitlement is later evaluated by a
shared access check that ignores the grace-period end. A subscriber in a valid
store grace period can therefore be returned and gated as non-premium.

## 2. Findings by severity

### P1: Valid RevenueCat grace-period access is denied after normalization

`services/api/src/features/subscriptions/subscriptions.service.ts:217` through
`services/api/src/features/subscriptions/subscriptions.service.ts:221` correctly
classify a `BILLING_ISSUE` as `grace_period` with `canAccessPremium: true`
when `grace_period_expiration_at_ms` is in the future. The webhook path then
persists only `currentPeriodEndsAt` from `expiration_at_ms` at
`services/api/src/features/subscriptions/subscriptions.service.ts:304` through
`services/api/src/features/subscriptions/subscriptions.service.ts:343`. The
restore path has the same shape: it computes `hasAccess` from either
`expires_date` or `grace_period_expires_date` at
`services/api/src/features/subscriptions/subscriptions.service.ts:374` through
`services/api/src/features/subscriptions/subscriptions.service.ts:383`, but
only persists `currentPeriodEndsAt` at
`services/api/src/features/subscriptions/subscriptions.service.ts:393` through
`services/api/src/features/subscriptions/subscriptions.service.ts:410`.

The shared access check then denies `grace_period` unless
`currentPeriodEndsAt` itself is still future:
`services/api/src/features/subscriptions/subscriptions.contracts.ts:216` through
`services/api/src/features/subscriptions/subscriptions.contracts.ts:217`. For a
normal grace-period case where the paid period has expired but the store grace
period remains valid, `canAccessPremium` is saved as true and then recomputed as
false by `GET /me/entitlements`, restore status, and server-side paid feature
guards.

I reproduced this with the exported subscription test internals:

```txt
normalized: status=grace_period, canAccessPremium=true, currentPeriodEndsAt=2026-06-01T12:00:00.000Z
entitlementAllowsPremium: false
```

Impact: Play Billing/App Store grace-period users can lose paid access even
while RevenueCat says they are still inside the valid grace window. This
violates the task requirement that grace-period states be represented and makes
the release checklist claim at `docs/RELEASE_CHECKLIST.md:64` too optimistic.

## 3. Validation reviewed or run

- Reviewed required startup files, the task prompt, the Expo rebuild/dependency
  skill, and Supabase SQL guidance.
- Reviewed current `HEAD` diff and untracked task files for mobile
  subscriptions, backend subscription service/routes/contracts, entitlement
  data paths, migrations, premium route enforcement, docs, and tests.
- Ran `cd services/api && npm test -- subscriptions.test.ts`: passed, 17 tests.
- Ran `cd apps/mobile && npm test -- --runTestsByPath src/features/subscriptions/services/entitlementService.test.ts src/features/subscriptions/components/EntitlementGate.test.tsx`: passed, 18 tests.
- Ran `git diff --check HEAD`: passed.
- Ran `cd services/api && npm run typecheck`: passed.
- Ran `cd services/api && npm run build`: passed.
- Ran `./script/build_and_run.sh --typecheck`: passed.
- Ran `cd apps/mobile && npm run lint -- --max-warnings=0`: passed.
- Ran `./script/build_and_run.sh --test`: passed, 47 suites / 214 tests.
- Ran `./script/build_and_run.sh --doctor`: passed, 21/21 checks.
- Ran `node scripts/supabase-migrations.mjs status`: migrations through
  `202606110006_subscription_event_ordering.sql` are applied with checksum OK.
- Ran `cd services/api && npm test`: passed, 4 files / 95 tests.
- Ran a one-off read-only grace-period reproduction with `npx tsx`: reproduced
  `grace_period` normalizing to `canAccessPremium: true` and then evaluating as
  not premium.

## 4. Documentation/release-checklist accuracy

The docs honestly document the remaining external blockers: native RevenueCat
SDK purchase launch, owner app keys/products, API RevenueCat env values,
transfer/alias QA, and App Store / Play Store sandbox QA. No native RevenueCat
dependency or Expo config change is present in `apps/mobile/package.json`,
`apps/mobile/app.json`, or `apps/mobile/eas.json`, so the current mobile changes
are OTA-safe. Backend rollout still requires deploying the API and applying the
subscription migrations in the target environment.

`docs/RELEASE_CHECKLIST.md:64` should not mark grace-period state handling fully
implemented until the P1 above is fixed and tested. The sandbox plan at
`docs/RELEASE_CHECKLIST.md:74` correctly calls for Play Billing grace-period QA.

## 5. Required implementation follow-up

1. Persist and evaluate the effective premium-access end for grace periods. A
   clean fix would add an explicit `grace_period_ends_at` column/field, include
   it in `EntitlementRecord`, and have `entitlementAllowsPremium` allow
   `grace_period` until that timestamp. An acceptable narrower fix is to store
   the effective access end in a clearly named field and keep the original
   subscription expiration available for audits/docs.
2. Update both RevenueCat webhook and restore reconciliation so `BILLING_ISSUE`
   and billing-error cancellation cases return `restored`/premium only while the
   current paid period or grace period is valid.
3. Add backend tests for grace-period webhook and restore states where
   `expiration_at_ms`/`expires_date` is past but
   `grace_period_expiration_at_ms`/`grace_period_expires_date` is future.
4. Update release checklist/docs after the fix so grace-period implementation is
   accurately represented.

## 6. Final decision

Changes requested. Stale event ordering is fixed, but the grace-period access
bug is a local P1 payments/entitlements issue that can be corrected before this
release blocker is approved.

REVIEW_STATUS: changes_requested
