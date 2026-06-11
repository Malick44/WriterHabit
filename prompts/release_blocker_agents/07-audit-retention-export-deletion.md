# Agent Prompt: Audit, Retention, Export, And Deletion

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close audit `P0-10`: audit logging, data retention, account/data export, deletion requests, object cleanup, and privacy operations are not operational.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/supabase-postgres-best-practices/SKILL.md`.
6. Read this prompt.

## Scope

- Make privacy operations real enough for production staging.
- Persist audit events.
- Implement export/delete request records and worker-ready processing.
- Add retention policy enforcement hooks.

## Files To Inspect

- `docs/DATA_RETENTION_POLICY.md`
- `docs/SECURITY_PRIVACY_ACADEMIC_INTEGRITY.md`
- `services/api/src/features/audit/audit.service.ts`
- `services/api/src/features/privacy/**`
- `services/api/migrations/*.sql`
- `services/api/docs/AUDIT_LOGGING.md`
- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/AUTHORIZATION_RULES.md`

## Requirements

- `AuditLogService` must persist events to `audit_logs` in production paths.
- Sensitive actions must emit audit events: auth role/profile changes, assignment submission, AI review, feedback publication, parent/teacher access, payment entitlement changes, notification delivery changes, export/delete requests.
- Add export/delete request APIs with authorization and status tracking.
- Add deletion worker interface or runnable job that handles relational rows and object storage cleanup.
- Add retention config and tests for expired data selection.
- Avoid logging student draft content or secrets.

## Acceptance Criteria

- Audit sink is no longer null in production.
- Export/delete requests are persisted and visible to authorized users/admin paths.
- Deletion/retention job can run idempotently.
- Tests cover audit persistence, safe metadata, access denial, and idempotency.

## Validation

- Backend audit/privacy tests.
- Migration/RLS tests for audit/privacy tables.
- `./script/build_and_run.sh --typecheck`
- `./script/build_and_run.sh --test`

## Final Response

Include operational workflows added, tables/endpoints touched, tests run, and remaining legal/product review needs.
