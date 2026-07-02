# Security And Privacy

Status: Prompt 25 security/privacy requirements and current implementation map.
WriterHabit currently has an Expo mobile app, Supabase public-client auth,
framework-neutral backend contracts, draft migrations, deterministic local
feature mocks, and a local Fastify backend runtime shell in `services/api/`.
Production deployment, a migration runner, resource-level authorization, and
critical feature persistence do not exist yet.

## Canonical Code Paths

- Mobile public Supabase config:
  `apps/mobile/src/core/config/supabaseConfig.ts`
- Mobile Supabase client:
  `apps/mobile/src/core/supabase/supabaseClient.ts`
- Auth/session mapping:
  `apps/mobile/src/core/auth/sessionService.ts`
- Secure storage facade:
  `apps/mobile/src/services/storage/secureStorage.ts`
- Local JSON storage facade for non-secret drafts/canvas data:
  `apps/mobile/src/services/storage/localJsonStorage.ts`
- Planned API authorization rules:
  `services/api/docs/AUTHORIZATION_RULES.md`
- Planned database schema and RLS drafts:
  `services/api/docs/DATABASE_SCHEMA.md`,
  `services/api/migrations/202606090001_initial_WriterHabit_schema.sql`,
  `services/api/migrations/202606090002_privacy_rls_policies.sql`
- Audit scaffold:
  `services/api/src/features/audit/`

## Role-Based Access Rules

| Role | Access Requirement |
| --- | --- |
| Student | Can read and write only their own profile, onboarding, assignments, drafts, submissions, canvas documents, AI coaching, feedback, revisions, and progress. |
| Parent | Can read linked-student summaries, reports, bounded excerpts, feedback summaries, settings, and deletion/export request status through active parent-student links. Parents cannot submit assignments or run coaching as the student. |
| Teacher | Can manage classes they own, create assignments for those classes, read class rosters, read bounded submission/review detail for enrolled students, and leave coaching comments. Teachers cannot edit student profiles or submit student work. |
| Admin | Has scoped operational access only. Admin reads and writes must be audited and should avoid loading full student content unless required for a support or safety case. |
| Provider/System | Can call only verified webhook or internal job boundaries. Provider/system actions must use server-side credentials and write metadata-only audit logs. |

The planned backend must authorize requests after authentication and before
loading full student content where possible. Parent and teacher dashboards should
prefer summaries and bounded excerpts over full draft, full submission, canvas
stroke, or recognized-text payloads.

Current role trust: `services/api/src/runtime/auth.ts` verifies Supabase JWTs,
ignores client-writable `user_metadata.role`, and uses trusted
`app_metadata.role` only when present. `apps/mobile/src/core/auth/sessionService.ts`
uses the same source for UX routing and ignores client-writable role and
subscription metadata. Missing or invalid trusted role claims default to
`student` until production profile-table hydration is implemented.
`services/api/migrations/202606110001_server_owned_roles.sql` blocks public
authenticated updates to `public.users.role` and neutralizes legacy auth
metadata role sync hooks when present. The configured development Supabase
role-escalation boundary is verified by
`node scripts/verify-server-owned-roles.mjs --apply-local-migration`; parent and
teacher access still requires server-backed relationship or class state.

## Data Minimization

Collect only data required for writing instruction, account access, progress,
family/class linking, subscriptions, notifications, safety, and support.

Allowed data categories:

- Display name, email, role, locale, and account metadata.
- Grade level, grade band, writing goals, daily practice goal, and accessibility
  settings.
- Student assignments, typed drafts, submissions, bounded excerpts, canvas
  metadata, canvas stroke documents, feedback, revisions, and progress signals.
- Parent/student links, class rosters, teacher-created assignments, teacher
  comments, subscription entitlement state, notification preferences, and
  backend notification device metadata when a provider is selected.
- Safety and audit metadata that uses opaque IDs, request IDs, hashes, bounded
  excerpts, status values, and safety flags.

Do not collect precise location, social profiles, unnecessary school records,
service-role keys, provider secrets, full provider payloads in logs, or
unbounded freeform student content in audit metadata.

## Secret Handling

Mobile app code may use only public Expo Supabase environment variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- optional compatibility fallback `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Mobile backend calls may use only the public API origin variable:

- `EXPO_PUBLIC_API_BASE_URL`

`EXPO_PUBLIC_API_BASE_URL` is not a secret, but production builds must point it
at the deployed HTTPS API origin and must not rely on the development localhost
fallback in `apps/mobile/src/core/api/apiClient.ts`.

The mobile API client refreshes Supabase sessions once for backend responses
that use `401 auth.expired_token` with `retryable: true`. Other authentication
or authorization failures remain fail-closed and must be enforced by the
backend/RLS layer.

Service-role keys, database admin credentials, model-provider credentials, store
provider secrets, webhook signing secrets, APNs/FCM credentials, and raw push
tokens must never be placed in mobile app code, docs, `.codex`, screenshots,
logs, committed files, or client-visible payloads.

## Signed URL Requirements

Current state: canvas storage/sync is local-first and signed-in metadata/stroke
sync goes through authenticated backend routes; no production object upload
service exists yet.

Future signed URL requirements:

- Issue signed upload and download URLs only from authenticated backend
  endpoints after role and resource authorization.
- Derive object paths on the server from authenticated ownership scope such as
  student profile ID, assignment ID, and canvas document ID. Do not trust raw
  client path input.
- Keep upload URLs short-lived and single-purpose. Use separate endpoints for
  upload, preview, export, recognition, and download.
- Audit signed URL creation with actor ID, role, target canvas or submission ID,
  request ID, result, and hashed network metadata when available.
- Never log signed URLs, object tokens, raw canvas stroke JSON, recognized text,
  or storage provider credentials.

## Rate Limit Requirements

Current state: backend AI usage limits are scaffolded in
`services/api/src/features/ai/usage/ai-usage-limit.service.ts`; the Fastify
runtime shell does not enforce rate limits yet.

Future rate limits must cover:

- AI coach requests by authenticated user, student profile, plan, and school or
  family scope where applicable.
- AI review jobs by submission, student profile, idempotency key, and plan.
- Auth abuse thresholds, sign-in failures, parent-student link attempts, class
  roster changes, signed URL creation, notification registration, provider
  webhooks, and admin access.
- Token-budget estimates before model-provider calls.
- Clear `429 rate_limit.*` responses using the error catalog in
  `services/api/docs/ERROR_CODES.md`.

Rate-limit logs must use metadata only and must not contain full prompts, full
student writing, provider secrets, or service credentials.

## Audit Logging

The schema draft includes `public.audit_logs`, forced RLS, and admin-only access.
The framework-neutral audit scaffold in `services/api/src/features/audit/`
creates metadata-only audit events and maps them to the planned database row
shape.

Audit metadata should store opaque IDs, request IDs, hashes, safety flags, and
state transitions. It must redact or omit draft text, full submissions, prompts,
provider payloads, tokens, passwords, service-role values, and raw push tokens.
