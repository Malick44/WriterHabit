# Release Blocker Review: 03 RLS Migration Runner And Policy Tests

## 1. Executive summary

The task implementation satisfies the WW-REL-002 review scope for a local, repeatable Supabase migration and RLS verification gate. The new runner records ordered migration checksums in `public.writerhabit_schema_migrations`, refuses checksum drift, and runs the rollback-only RLS verification suite. The resource hardening migration removes broad public-client write policies for relationship and system-owned rows, while preserving authorized reads for students, linked parents, assigned teachers, and trusted admin/service execution.

Reviewed current diff from HEAD, including the untracked runner, migration, and RLS verification SQL:

- `scripts/supabase-migrations.mjs`
- `services/api/migrations/202606110002_resource_rls_hardening.sql`
- `services/api/tests/rls/resource-policy-verification.sql`
- `AGENTS.md`
- `.codex/EXECUTION_STATE.md`
- `docs/KNOWN_ISSUES.md`
- `services/api/docs/AUTHORIZATION_RULES.md`
- `services/api/docs/DATABASE_SCHEMA.md`

## 2. Findings by severity

### P0

None.

### P1

None.

### P2 / residual risks

- Production application remains an operator-controlled release step, not something this local implementation can complete without staging/production Supabase credentials. This is documented in `docs/KNOWN_ISSUES.md:8` and `services/api/docs/DATABASE_SCHEMA.md:214`.
- The RLS suite covers the required release-blocker boundaries, but it is still fixture-based SQL coverage. As production API handlers replace route shells and mobile mocks, endpoint-level tests should continue to be added for route authorization and audit behavior.

## 3. Validation reviewed or run

Reviewed implementation coverage:

- `scripts/supabase-migrations.mjs:124` creates the migration ledger with RLS enabled/forced and revokes anonymous/authenticated access.
- `scripts/supabase-migrations.mjs:168` applies migrations in filename order and rejects checksum mismatches for already-applied migrations.
- `scripts/supabase-migrations.mjs:215` runs `services/api/tests/rls/resource-policy-verification.sql`.
- `services/api/migrations/202606110002_resource_rls_hardening.sql:9` removes direct parent-link accept/reactivation writes.
- `services/api/migrations/202606110002_resource_rls_hardening.sql:13` removes direct teacher roster management and replaces it with admin-only policy handling.
- `services/api/migrations/202606110002_resource_rls_hardening.sql:22` removes public-client AI interaction log writes.
- `services/api/migrations/202606110002_resource_rls_hardening.sql:37` removes public-client review job management.
- `services/api/migrations/202606110002_resource_rls_hardening.sql:47` through `services/api/migrations/202606110002_resource_rls_hardening.sql:87` hardens derived progress, weekly review, badge, and prepared-notification writes.
- `services/api/tests/rls/resource-policy-verification.sql:462` tests auth-metadata role escalation and direct student-to-admin update denial.
- `services/api/tests/rls/resource-policy-verification.sql:501` tests student isolation for another student's profile/submission.
- `services/api/tests/rls/resource-policy-verification.sql:539` tests active parent link visibility and revoked-link denial.
- `services/api/tests/rls/resource-policy-verification.sql:601` tests teacher class submission visibility and removed roster denial.
- `services/api/tests/rls/resource-policy-verification.sql:651` tests public-client denial for system-owned review, feedback, AI log, and progress writes.
- `services/api/tests/rls/resource-policy-verification.sql:767` tests trusted service/admin backend transitions.

Commands run:

```bash
node scripts/supabase-admin.mjs health
```

Result: passed against the configured development Supabase; no service-role secret was printed.

```bash
node scripts/supabase-migrations.mjs apply-and-verify
```

Result: passed. All six migrations were already applied with checksum-ok state, and resource RLS verification passed.

```bash
node scripts/supabase-migrations.mjs status
```

Result: passed. All six migrations reported `applied:checksum-ok`.

```bash
./script/build_and_run.sh --typecheck
```

Result: passed.

```bash
./script/build_and_run.sh --test
```

Result: passed, 46 suites and 200 tests.

```bash
git diff --check HEAD
```

Result: passed.

## 4. Documentation/release-checklist accuracy

The documentation is accurate for the current repository state:

- `docs/KNOWN_ISSUES.md:8` honestly marks WW-REL-002 resolved for the repository-local migration/RLS gate and explicitly says production still requires owner/backend operator execution with staging/production credentials.
- `services/api/docs/DATABASE_SCHEMA.md:18` documents the new `apply-and-verify` command and the rollback-only RLS suite.
- `services/api/docs/DATABASE_SCHEMA.md:172` accurately summarizes the policy behaviors verified by the SQL suite.
- `services/api/docs/DATABASE_SCHEMA.md:218` through `services/api/docs/DATABASE_SCHEMA.md:222` correctly keeps production execution as a controlled release step.
- `services/api/docs/AUTHORIZATION_RULES.md:67` through `services/api/docs/AUTHORIZATION_RULES.md:83` reflects server-owned role grants, resource RLS hardening, and the verified role/resource boundaries.

## 5. Required implementation follow-up

No P0/P1 implementation follow-up is required for release-blocker task 03.

Recommended non-blocking follow-up:

- Keep `node scripts/supabase-admin.mjs health` and `node scripts/supabase-migrations.mjs apply-and-verify` in database release gates.
- Run the same migration/RLS command against staging and production during the controlled release path.
- Add endpoint-level authorization tests as production persistence handlers are implemented.

## 6. Final decision

Approved. The implementation closes the local code and verification requirements for WW-REL-002, with the remaining production credential/application step documented as an external release operation.

REVIEW_STATUS: approved
