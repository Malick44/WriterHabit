# Release Blocker Review: 02 Server-Derived Roles And Authorization

## 1. Executive summary

Changes requested. The mobile and Fastify runtime changes move role/session mapping away from client-writable `user_metadata`, and the added unit/integration tests pass. However, the new database hardening migration does not actually block public-client updates to `public.users.role`: the trigger function is `SECURITY DEFINER` but checks `current_user`, so it runs the allow-list check as the function owner instead of the authenticated caller.

Because `public.users.role` feeds admin/RLS helpers, this leaves the core student-to-admin escalation path unresolved.

## 2. Findings by severity

### P0 - `public.users.role` can still be escalated through the self-update policy

`services/api/migrations/202606110001_server_owned_roles.sql:6` creates `users_self_update_profile_fields` for `UPDATE` to `authenticated` with only `id = auth.uid()` checks at `services/api/migrations/202606110001_server_owned_roles.sql:8` and `services/api/migrations/202606110001_server_owned_roles.sql:9`. That policy allows an authenticated user to update their own `public.users` row unless another guard blocks unsafe columns.

The intended guard is `public.reject_client_user_role_change()`, but it is declared `security definer` at `services/api/migrations/202606110001_server_owned_roles.sql:14` and checks `current_user` at `services/api/migrations/202606110001_server_owned_roles.sql:18`. In a security-definer function, `current_user` is the function owner. The configured development database confirms the applied function is `prosecdef = true` and owned by `supabase_admin`, so the condition treats ordinary authenticated updates as admin-owned and does not raise.

Impact: a public authenticated client can still attempt `UPDATE public.users SET role = 'admin' WHERE id = auth.uid()`. If that succeeds, `public.current_user_role()` reads `public.users.role` at `services/api/migrations/202606090002_privacy_rls_policies.sql:11`, `public.is_WriterHabit_admin()` trusts it at `services/api/migrations/202606090002_privacy_rls_policies.sql:23`, and admin policies such as `users_admin_all` at `services/api/migrations/202606090002_privacy_rls_policies.sql:342` through `services/api/migrations/202606090002_privacy_rls_policies.sql:346` can be unlocked.

Required fix: make the trigger check the invoker/JWT role, not the definer role, or remove the broad self-update path and expose only scoped RPCs/column-safe updates. Add a real RLS regression test proving an authenticated user cannot change their own `public.users.role` to `parent`, `teacher`, or `admin`, while the approved service/admin path still can.

### P1 - Documentation says the role migration blocks client role updates, but it does not

The docs now state the migration blocks public authenticated role changes in `services/api/docs/AUTHORIZATION_RULES.md:65`, `docs/SECURITY_PRIVACY.md:50`, `docs/KNOWN_ISSUES.md:8`, and `docs/APP_IMPLEMENTATION_AUDIT.md:159`. Because the trigger is ineffective, those statements overstate the current security state.

Required fix: after correcting the migration and adding RLS tests, update the docs to describe the verified behavior. Until then, keep the release checklist language explicit that this remains unresolved, not merely unapplied in production.

## 3. Validation reviewed or run

- Reviewed current diff from `HEAD` and touched auth, onboarding, migration, API-doc, audit, and known-issues files.
- Ran `npm test -- src/core/auth/sessionService.test.ts --runInBand` in `apps/mobile`: passed, 5 tests.
- Ran `npm test -- src/features/auth/types.test.ts --runInBand` in `apps/mobile`: passed, 4 tests.
- Ran `npm test -- src/core/auth/authStore.test.ts --runInBand` in `apps/mobile`: passed, 5 tests.
- Ran `npm test` in `services/api`: passed, 9 tests.
- Ran `npm run lint -- --max-warnings=0` in `apps/mobile`: passed.
- Ran `./script/build_and_run.sh --typecheck`: passed.
- Ran `./script/build_and_run.sh --test`: passed, 46 suites / 200 tests.
- Queried development Supabase metadata without printing secrets: `reject_client_user_role_change` is `SECURITY DEFINER` and owned by `supabase_admin`; `users_self_update_profile_fields` exists for authenticated self-updates.

## 4. Documentation/release-checklist accuracy

The docs correctly acknowledge that production migration application, profile hydration, parent links, teacher approval, and resource-level authorization remain open. The role-hardening migration language is not accurate yet because the migration does not provide the claimed client-role-update protection.

## 5. Required implementation follow-up

Fix `services/api/migrations/202606110001_server_owned_roles.sql` so public authenticated users cannot mutate `public.users.role` under RLS. Then add database/RLS validation for student-to-admin, student-to-teacher, and student-to-parent escalation attempts, plus a positive test for the approved backend/admin grant path. Update the affected docs after the test proves the behavior.

## 6. Final decision

REVIEW_STATUS: changes_requested
