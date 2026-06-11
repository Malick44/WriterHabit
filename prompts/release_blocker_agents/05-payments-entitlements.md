# Agent Prompt: Payments And Entitlements

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close `WW-REL-003` and audit `P0-8`: subscription entitlement and paywall flows are local deterministic scaffolds. Implement a production payment and entitlement path.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/expo-ota-vs-rebuild/SKILL.md`.
6. Read this prompt.

## Scope

- Choose a payment/entitlement approach for iOS and Android: native StoreKit/Play Billing directly or a provider such as RevenueCat.
- Implement backend entitlement source of truth and webhook/receipt validation.
- Convert mobile local-preview subscription behavior into production-safe gates.

## Files To Inspect

- `apps/mobile/src/features/subscriptions/**`
- `services/api/src/features/subscriptions/**`
- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/AUTHORIZATION_RULES.md`
- `docs/KNOWN_ISSUES.md`
- `docs/RELEASE_CHECKLIST.md`
- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `apps/mobile/eas.json`

## Requirements

- No paid entitlement may be granted solely by mobile state.
- Server must validate receipts/webhooks and persist entitlements.
- Restore purchases must reconcile with server state.
- Refund, cancellation, renewal, expiration, and grace-period states must be represented.
- Family/parent access rules must be explicit.
- Paywall UI must show pending/error/restored states honestly.
- Add tests for free, trial, active, expired, refunded, restored, and server-denied states.
- If adding native payment dependencies or config plugins, include the required Deployment Impact section.

## Acceptance Criteria

- Mobile entitlement gate reads trusted server/provider state.
- Local `activated_preview` cannot unlock production features.
- Backend handles entitlement events idempotently.
- Store sandbox test plan is documented.

## Validation

- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`
- `./script/build_and_run.sh --doctor`
- If native dependencies/config changed: `cd apps/mobile && npx expo install --check`

## Final Response

Include provider decision, changed files, test results, sandbox/store setup still needed, and Deployment Impact if applicable.
