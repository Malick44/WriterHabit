# Data Retention Policy

Status: Prompt 25 retention and deletion requirements. The current mobile app
uses local device storage for drafts, canvas documents, preferences, and
deterministic feature mocks. The planned backend schema, API contracts, and
Fastify runtime shell exist, but no production deletion worker or server-side
retention workflow exists yet.

## Current Storage Map

| Data | Current Path | Current Behavior |
| --- | --- | --- |
| Supabase auth session | `apps/mobile/src/core/supabase/supabaseClient.ts` | Public Supabase client auth persistence through Expo SQLite localStorage. |
| Secure values | `apps/mobile/src/services/storage/secureStorage.ts` | SecureStore facade for sensitive local values. |
| Preferences | `apps/mobile/src/services/storage/preferencesStorage.ts` | Local settings and preferences on device. |
| Typed drafts | `apps/mobile/src/features/writing-workspace/services/draftPersistenceService.ts` | Bounded local JSON draft storage validated before read/write. |
| Canvas documents | `apps/mobile/src/features/canvas/services/canvasPersistenceService.ts` | Bounded local JSON canvas document storage validated before read/write. |
| Planned server data | `services/api/docs/DATABASE_SCHEMA.md` and `services/api/migrations/` | Draft Supabase/Postgres schema with privacy boundaries and RLS; not applied by a production runner. |

## Retention Principles

- Keep only data needed for instruction, safety, progress, account operation,
  family/class linking, subscription state, and support.
- Keep full student writing and canvas stroke data separate from summaries.
- Prefer bounded excerpts for parent, teacher, progress, audit, and AI safety
  records.
- Delete or anonymize data when it is no longer needed for the active account,
  legal/safety requirements, security auditing, or user-requested export.
- Never retain service-role keys, provider secrets, raw push tokens, or model
  credentials in application data.

## Planned Backend Retention Requirements

These requirements apply when production route handlers, persistence, and the
deletion worker are implemented.

| Data Category | Retention Requirement |
| --- | --- |
| Active account profile data | Retain while the account is active and needed for product operation. |
| In-progress typed drafts | Retain while active; delete inactive server drafts after a configured retention window unless tied to an active assignment or legal/safety hold. |
| Submitted writing and feedback | Retain while account, class, or family reporting requires access; support export and deletion workflows. |
| Canvas documents and object storage | Retain while linked to active assignments or student-owned saved work; delete object storage files when related records are deleted. |
| Parent-student links and class rosters | Retain active records; keep minimal historical metadata for safety, support, and audit needs. |
| AI coach/review logs | Retain minimal metadata, bounded excerpts, safety flags, usage counts, and provider request IDs only where needed for safety, abuse prevention, support, and cost controls. |
| Audit logs | Retain metadata-only records for security and operational review according to the production retention schedule. Do not store full student content. |
| Notification device records | Retain only active hashed/encrypted device token records; delete on sign-out, token revocation, account deletion, or stale-device cleanup. |
| Subscription/provider events | Retain idempotency and entitlement records needed for account operation, refunds, dispute handling, and provider reconciliation. |

The exact production retention windows must be set before launch with legal,
school, and operational review. Until then, code should make retention windows
configuration-driven rather than hard-coded across feature modules.

## Deletion Requirements

Future backend deletion must support:

- Student or parent-requested account export and deletion.
- Deletion of local drafts/canvas data during sign-out or account removal where
  the mobile UX explicitly offers it.
- Cascading deletion from profile records to drafts, submissions, feedback,
  progress, canvas metadata, object storage files, notification devices, and
  parent/class links according to the schema relationships.
- Metadata-only audit records that record deletion request handling without
  storing deleted content.
- Idempotent deletion jobs so repeated requests do not recreate or leak data.

Deletion must not expose service-role credentials or raw provider payloads in
logs. API responses should return localization-ready status and recovery copy.

## Data Minimization For AI

- Build bounded excerpts before sending text to AI boundaries.
- Do not send full canvas stroke JSON to a model provider.
- Do not store full prompts in general logs.
- Store safety flags, request IDs, provider request IDs, token estimates, and
  bounded excerpts only when needed.
- Keep model-provider credentials backend-only.

## Local Device Data

Local typed drafts and canvas documents are non-secret learning content, but
they are still student data. The current app validates and bounds these payloads
before local storage. A future settings flow should expose clear local data
cleanup controls for families and school-managed devices.
