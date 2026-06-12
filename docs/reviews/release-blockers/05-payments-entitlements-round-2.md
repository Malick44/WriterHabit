# Release Blocker Review 05: Payments And Entitlements, Round 2

## 1. Executive summary

Round 2 resolves the main Round 1 blocker: the advertised Plus surfaces are now
gated on mobile, and representative backend endpoints either require active Plus
or redact paid fields. Local `activated_preview` purchase unlocking is removed,
mock sessions fail closed to free entitlements, RevenueCat checkout does not
mutate entitlements, restore fails closed without provider credentials unless a
verified entitlement already exists, webhooks require the configured
Authorization value, and the migration ledger shows the subscription lifecycle
migration applied.

The task is not release-approved yet. The RevenueCat webhook path is idempotent
by provider event id, but it is not monotonic by provider event time or lifecycle
precedence. A delayed older renewal/active event with a distinct event id can
overwrite a later refund or expiration and restore premium access. That is a P1
payments release issue because refunds, expirations, and cancellations must stay
authoritative once processed unless a newer provider event explicitly reverses
them.

## 2. Findings by severity

### P1: Stale RevenueCat lifecycle events can re-enable a refunded entitlement

`services/api/src/features/subscriptions/subscriptions.service.ts:522` normalizes
each accepted RevenueCat webhook independently, and
`services/api/src/features/subscriptions/subscriptions.service.ts:523` through
`services/api/src/features/subscriptions/subscriptions.service.ts:531` applies
that event directly. The only ordering/idempotency guard is provider event id:
`services/api/src/data/supabase-database.ts:591` through
`services/api/src/data/supabase-database.ts:630` suppresses duplicates with the
same `(provider, provider_event_id)`, but a different event id proceeds to
`upsertEntitlement` at `services/api/src/data/supabase-database.ts:635`.
`services/api/src/data/supabase-database.ts:1568` through
`services/api/src/data/supabase-database.ts:1608` then updates the entitlement
row without comparing the incoming `event_timestamp_ms` or terminal-state
precedence against the current row. The in-memory database mirrors this behavior
at `services/api/src/data/memory-database.ts:316` through
`services/api/src/data/memory-database.ts:321`.

I reproduced the issue with a throwaway `npx tsx` command: process a newer
`REFUND` event for `original_transaction_id = original-review`, then process an
older `RENEWAL` event with a different event id for the same original
transaction. The entitlement moved from:

```txt
afterRefund:        status=refunded, canAccessPremium=false
afterOlderRenewal: status=active,   canAccessPremium=true
```

Impact: a delayed or replayed-but-distinct older provider event can undo a
refund/expiration/cancellation state and grant Plus access after the store has
revoked it. Before approval, webhook handling needs a monotonic guard. Store the
last applied provider event timestamp or comparable provider lifecycle version
on the entitlement, reject/ignore older events for the same provider
subscription, and add tests that a stale renewal cannot overwrite `refunded`,
`expired`, or `past_due` states. Explicit newer reversal events such as
`REFUND_REVERSED` can still restore access.

## 3. Validation reviewed or run

- Reviewed required startup files, task prompt, current `HEAD` diff, and Round 1
  review report.
- Reviewed mobile subscription API/hook/gate/paywall/types, Plus-surface screen
  wrappers, backend subscription routes/service/contracts, entitlement
  authorization, in-memory and Supabase persistence, migration, docs, and tests.
- Ran stale-webhook reproduction with `npx tsx`: reproduced refunded entitlement
  being reactivated by an older active event with a distinct event id.
- Ran `cd services/api && npm run typecheck`: passed.
- Ran `cd services/api && npm test`: passed, 4 files / 90 tests.
- Ran `cd services/api && npm run build`: passed.
- Ran `./script/build_and_run.sh --typecheck`: passed.
- Ran `cd apps/mobile && npm run lint -- --max-warnings=0`: passed.
- Ran `./script/build_and_run.sh --test`: passed, 47 suites / 214 tests.
- Ran `./script/build_and_run.sh --doctor`: passed, 21/21 checks.
- Ran `node scripts/supabase-migrations.mjs status`: migrations through
  `202606110005_subscription_entitlement_lifecycle.sql` are applied with
  checksum OK.
- Ran `git diff --check HEAD`: passed.

## 4. Documentation/release-checklist accuracy

The docs are mostly honest about external blockers: native RevenueCat SDK
purchase launch, owner app keys, store products, API env values, transfer/alias
QA, and App Store / Play Store sandbox QA are explicitly marked incomplete.
`services/api/docs/API_CONTRACT.md` now documents the implemented restore
response shape with singular `entitlement`.

The release checklist is too optimistic while the P1 above remains. In
`docs/RELEASE_CHECKLIST.md:64`, server-side RevenueCat refunds, expirations,
cancellations, renewals, and grace-period states are marked complete. The states
are represented, but provider event application is not yet safe against stale
event ordering. That checklist item should remain unchecked or be qualified
until monotonic webhook processing is implemented and tested.

Deployment impact: the current round did not modify `apps/mobile/package.json`,
`apps/mobile/app.json`, or `apps/mobile/eas.json`, so the mobile gating changes
are OTA-safe. The backend changes require API deployment plus the applied
database migration. The future native RevenueCat SDK purchase launch will
require a new native build, and production rollout will require store
resubmission for the released binary.

## 5. Required implementation follow-up

1. Add monotonic RevenueCat event application for entitlements. At minimum,
   persist the last applied provider event timestamp or lifecycle version per
   provider subscription and ignore older events that would loosen access.
2. Add backend tests proving stale active/renewal events cannot overwrite
   `refunded`, `expired`, or `past_due` states, while a newer
   `REFUND_REVERSED` or valid renewal can restore access.
3. Update `docs/RELEASE_CHECKLIST.md` and related release notes so RevenueCat
   lifecycle sync is not marked complete until stale-event handling is in place.

## 6. Final decision

Changes requested. The Round 1 surface-gating issue is addressed and validation
passes, but the webhook lifecycle ordering bug leaves a P1 payments/entitlement
release risk that can be fixed locally.

REVIEW_STATUS: changes_requested
