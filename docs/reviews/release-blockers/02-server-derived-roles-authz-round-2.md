# Release Blocker Review: 02 Server-Derived Roles And Authorization, Round 2

## 1. Executive summary

Approved for this task scope. The round-1 P0 finding is fixed: `services/api/migrations/202606110001_server_owned_roles.sql:220` now creates `reject_client_user_role_change()` as `SECURITY INVOKER`, and the trigger at `services/api/migrations/202606110001_server_owned_roles.sql:236` through `services/api/migrations/202606110001_server_owned_roles.sql:239` blocks authenticated public-client role changes while preserving the admin/service grant path.

Mobile production role trust is also tightened. Session mapping ignores client-writable `user_metadata.role` and `user_metadata.subscription_status` in `apps/mobile/src/core/auth/sessionService.ts:22` through `apps/mobile/src/core/auth/sessionService.ts:46`, sign-up no longer sends role or entitlement fields at `apps/mobile/src/core/auth/sessionService.ts:182` through `apps/mobile/src/core/auth/sessionService.ts:192`, and onboarding completion no longer writes role at `apps/mobile/src/core/auth/sessionService.ts:206` through `apps/mobile/src/core/auth/sessionService.ts:229`.

Remaining production migration application, full profile hydration, and broader resource RLS coverage are still release blockers, but they are documented honestly as broader follow-up in `docs/KNOWN_ISSUES.md:8` and `docs/APP_IMPLEMENTATION_AUDIT.md:182` through `docs/APP_IMPLEMENTATION_AUDIT.md:193`.

## 2. Findings by severity

No unresolved P0/P1 findings in this task scope.

Notes reviewed:

- Backend JWT principal derivation still ignores `user_metadata.role` and derives elevated roles only from trusted `app_metadata.role` in `services/api/src/runtime/auth.ts:49` through `services/api/src/runtime/auth.ts:60`.
- API resource helpers enforce student ownership, active parent links, and teacher class links in `services/api/src/runtime/authorization.ts:54` through `services/api/src/runtime/authorization.ts:98`, `services/api/src/runtime/authorization.ts:110` through `services/api/src/runtime/authorization.ts:162`, and `services/api/src/runtime/authorization.ts:169` through `services/api/src/runtime/authorization.ts:257`.
- Production onboarding only exposes parent/teacher role completion when the trusted session role is already parent/teacher in `apps/mobile/src/features/onboarding/screens/RoleSelectionScreen.tsx:53` through `apps/mobile/src/features/onboarding/screens/RoleSelectionScreen.tsx:63`, and `apps/mobile/src/features/onboarding/hooks/useOnboarding.ts:40` through `apps/mobile/src/features/onboarding/hooks/useOnboarding.ts:50` fails closed on non-dev role mismatch.
- In-repo security-definer RPCs that update `public.users` only update profile fields, not `role`; for example `services/api/migrations/202606100001_profile_settings_notification_sync.sql:247` through `services/api/migrations/202606100001_profile_settings_notification_sync.sql:253`.

## 3. Validation reviewed or run

- Reviewed current diff from `HEAD`, including touched auth, onboarding, migration, API docs, audit, known-issues, and security docs.
- Reviewed `docs/reviews/release-blockers/02-server-derived-roles-authz-round-1.md`.
- Reviewed new mobile session escalation tests in `apps/mobile/src/core/auth/sessionService.test.ts`.
- Reviewed new RLS verifier in `scripts/verify-server-owned-roles.mjs`; it asserts the trigger is not security-definer at `scripts/verify-server-owned-roles.mjs:80` through `scripts/verify-server-owned-roles.mjs:98` and tests auth-metadata escalation, public-client role changes, safe profile self-updates, and admin grants at `scripts/verify-server-owned-roles.mjs:119` through `scripts/verify-server-owned-roles.mjs:270`.
- Ran `./script/build_and_run.sh --typecheck`: passed.
- Ran `cd apps/mobile && npm run lint -- --max-warnings=0`: passed.
- Ran `./script/build_and_run.sh --test`: passed, 46 suites / 200 tests.
- Ran `cd services/api && npm test`: passed, 2 files / 35 tests.
- Ran `node scripts/verify-server-owned-roles.mjs --apply-local-migration`: passed.
- Ran `git diff --check HEAD`: passed.

## 4. Documentation/release-checklist accuracy

Documentation is accurate for the reviewed state.

- `services/api/docs/AUTHORIZATION_RULES.md:15` through `services/api/docs/AUTHORIZATION_RULES.md:23` documents trusted role derivation and mobile metadata distrust.
- `services/api/docs/AUTHORIZATION_RULES.md:45` through `services/api/docs/AUTHORIZATION_RULES.md:77` documents route gates as UX-only, server-owned `public.users.role`, verifier coverage, teacher approval, and parent link requirements.
- `docs/SECURITY_PRIVACY.md:46` through `docs/SECURITY_PRIVACY.md:57` describes the current role trust model and remaining parent/teacher relationship requirement.
- `docs/KNOWN_ISSUES.md:8` keeps database/RLS production migration and broader resource-boundary proof open instead of overstating release readiness.

## 5. Required implementation follow-up

No required local fixes for this task before merge.

Follow-up remains for later release-blocker work:

- Apply the role-hardening migration through the production migration path.
- Complete server-owned role/profile/entitlement hydration for production handlers.
- Broaden RLS/resource-boundary tests across student, parent, teacher, admin, and service workflows.

## 6. Final decision

REVIEW_STATUS: approved
