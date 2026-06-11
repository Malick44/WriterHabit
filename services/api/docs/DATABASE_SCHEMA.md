# WriterHabit Database Schema

Status: Supabase/Postgres schema draft with a controlled migration/RLS test
runner, applied to the configured development Supabase instance through
`202606110002_resource_rls_hardening.sql` on 2026-06-11.
The current mobile app still uses Supabase auth, feature-owned deterministic
mock APIs, and local device storage. A Fastify API runtime shell now exists in
`services/api/`, but these tables are not wired to production route handlers
yet. The migration files live in:

- `services/api/migrations/202606090001_initial_writewise_schema.sql`
- `services/api/migrations/202606090002_privacy_rls_policies.sql`
- `services/api/migrations/202606100001_profile_settings_notification_sync.sql`
- `services/api/migrations/202606100002_canvas_document_stroke_count.sql`
- `services/api/migrations/202606110001_server_owned_roles.sql`
- `services/api/migrations/202606110002_resource_rls_hardening.sql`

Use `node scripts/supabase-migrations.mjs apply-and-verify` to apply ordered
migrations with checksum tracking and run the rollback-only RLS verification
suite in `services/api/tests/rls/resource-policy-verification.sql`.

## Schema Rules

- IDs are UUIDs.
- Timestamps use `timestamptz` with `now()` defaults.
- Table and column names use lowercase snake_case.
- User-facing copy stores localization keys and fallbacks instead of hard-coded
  UI paragraphs.
- Full student writing and canvas stroke payloads are separated from summary
  tables so parent and teacher reports can stay bounded.
- Foreign key columns are indexed.
- Multi-column indexes follow planned query patterns from
  `services/api/docs/API_CONTRACT.md`.
- RLS is enabled and forced for every app table in the draft.
- Service-role, provider, and database admin secrets are not represented in this
  schema or documentation.

## Core Identity

| Table | Purpose | Important constraints and indexes |
| --- | --- | --- |
| `users` | Public app profile for a Supabase auth user. | `id` references `auth.users(id)`, unique `email`, role check for `student`, `parent`, `teacher`, `admin`, `users_role_idx`; `202606110001_server_owned_roles.sql` rejects public-client and auth-metadata role changes so role grants stay backend/admin-owned. |
| `student_profiles` | Student grade, writing level, goals, daily goal, language, learning focus note, accessibility settings, onboarding completion. | Unique `user_id`, grade 1-12, daily goal in 5/10/15/20/30, generated `grade_band`, goal allow-list, language check, GIN index on `writing_goals`. |
| `parent_profiles` | Parent display profile. | Unique `user_id`. |
| `parent_settings` | Parent report and notification settings. | Primary key `parent_user_id`, constrained setting values. |
| `teacher_profiles` | Teacher display profile and optional school label. | Unique `user_id`. |
| `parent_student_links` | Parent-to-student relationship state. | Active/pending/revoked status, unique parent/student pair, indexes by parent and student status; public clients can read visible links but link status changes are backend/admin-owned. |

`studentId` in planned API contracts maps to `student_profiles.id`. A student's
auth account remains available through `student_profiles.user_id`.

## Classes And Assignments

| Table | Purpose | Important constraints and indexes |
| --- | --- | --- |
| `classes` | Teacher-owned class container. | FK to `teacher_profiles`, grade 1-12, active/archived status, `(teacher_profile_id, status)` index. |
| `class_students` | Student roster membership. | FK to class and student profile, active/removed status, partial unique active membership; roster changes are backend/admin-owned because active rows grant teacher access to student work. |
| `rubrics` | Assignment rubric header. | Grade range, assignment type allow-list, creator FK, `(assignment_type, grade_level_min, grade_level_max)` index. |
| `rubric_criteria` | Ordered rubric criteria. | FK to rubric, skill allow-list, max score fixed at 4, unique `(rubric_id, sort_order)`. |
| `assignments` | Catalog or teacher-created writing assignment. | FK to rubric, optional class, type/skill/difficulty constraints, prompt safety status, catalog and class indexes. |
| `student_assignments` | Per-student assignment lifecycle. | FK to student/assignment/class/current submission, status allow-list, unique catalog and class assignment indexes. |

Teacher-created prompts are represented with `prompt_safety_status` so future
backend services can block unsafe or assignment-completion-oriented content
before publication.

## Drafts, Submissions, And Canvas

| Table | Purpose | Important constraints and indexes |
| --- | --- | --- |
| `writing_drafts` | Student-owned autosaved typed draft. | Unique `student_assignment_id`, 20,000 character cap, version/count checks, student updated index. |
| `submissions` | Submission summary and lifecycle fields. | FK to student assignment and profile, idempotency key, revision number, bounded text excerpt. |
| `submission_contents` | Private full submitted text. | One row per submission, student-owned RLS only, 40,000 character cap. |
| `canvas_documents` | Canvas metadata, storage paths, recognition status, preview path. | FK to student, assignment, student assignment, template/status checks, student updated index. |
| `canvas_document_contents` | Private canvas stroke JSON and recognized text. | One row per canvas document, GIN index on strokes for diagnostics, student-owned RLS only. |
| `submission_canvas_documents` | Join table between submissions and canvas documents. | Composite primary key and indexed canvas FK. |

Privacy boundary:

- Parents and teachers may read submission and canvas summary rows when linked
  by family or class scope.
- Full draft text, full submission text, canvas strokes, and recognized text are
  protected in content tables for the owning student, admins, and backend service
  work only.
- API handlers should continue returning bounded excerpts to parent and teacher
  dashboards.

## Feedback And AI Safety

| Table | Purpose | Important constraints and indexes |
| --- | --- | --- |
| `review_jobs` | Idempotent AI review work queue metadata. | FK to submission/student, status allow-list, safety flag allow-list, unique submission/idempotency key. |
| `feedback` | Completed review summary. | One row per submission, one strength, one improvement, one next revision task represented as localization keys/fallbacks. |
| `revision_tasks` | Focused revision task attached to feedback. | FK to feedback, target writing skill, bounded original excerpt. |
| `feedback_rubric_scores` | Rubric score rows. | FK to feedback and rubric criterion, score 1-4, unique feedback/criterion pair. |
| `grammar_suggestions` | Coaching-oriented grammar suggestions. | FK to feedback and bounded original excerpt. |
| `submission_revisions` | Student-written revised excerpt submissions. | FK to submission/student/revision task, idempotency key, bounded revised excerpt. |
| `teacher_submission_comments` | Teacher instructional comments. | FK to submission and teacher profile, comment length cap. |
| `ai_coach_interactions` | Minimal AI coach safety and usage log. | Allowed coaching actions only, status and safety flag checks, bounded excerpts. |

AI outputs must remain coaching-only. The schema stores safety flags and bounded
excerpts for review and audit; it does not store provider secrets or model keys.

## Progress And Badges

| Table | Purpose | Important constraints and indexes |
| --- | --- | --- |
| `student_progress_totals` | Current progress dashboard totals and streak state. | One row per student profile, nonnegative checks, streak status check. |
| `student_skill_progress` | Per-skill trend and level. | Unique student/skill pair, skill allow-list, level 1-5. |
| `student_activity_days` | Daily practice facts. | Unique student/date, practiced skill allow-list, GIN index on practiced skills. |
| `weekly_reviews` | Weekly celebration and focus copy. | Unique student/week range. |
| `badges` | Badge catalog. | Unique code, localization keys/fallbacks, active index, criteria JSONB index. |
| `student_badges` | Student badge state. | Unique student/badge pair, locked/in-progress/unlocked status. |

Progress tables are denormalized for dashboard reads. Backend services should
derive them from submissions, revisions, feedback application, canvas activity,
and assignment completion events. Public clients can read authorized rows but
cannot directly mutate progress totals, skill progress, activity days, weekly
reviews, or student badge state.

## Entitlements And Notifications

| Table | Purpose | Important constraints and indexes |
| --- | --- | --- |
| `entitlements` | User or scoped subscription entitlement state. | FK owner user, plan/status/provider checks, provider subscription uniqueness. |
| `entitlement_provider_events` | Idempotent provider webhook receipt log. | Unique provider event ID, processing status check. |
| `notification_preferences` | Per-student notification settings. | Unique student profile, weekday/time checks. |
| `notification_devices` | Backend-only push device registration metadata. | Owner user FK, token hash uniqueness, encrypted token field, platform check. |
| `prepared_notifications` | Scheduled notification payload metadata. | FK student, notification type/status checks, due partial index. |

Push tokens should be encrypted or otherwise protected by backend infrastructure.
Application logs and docs should use token hashes or opaque IDs only.

`services/api/migrations/202606100001_profile_settings_notification_sync.sql`
adds RPCs for the current mobile app to sync student profile settings and
notification preferences while the production API runtime is still being
assembled:

- `get_own_student_profile_settings`
- `upsert_own_student_profile_settings`
- `get_own_notification_preferences`
- `upsert_own_notification_preferences`

`services/api/migrations/202606110001_server_owned_roles.sql` re-creates the
`public.users` self-update policy for safe profile-field edits and adds a
`users_reject_client_role_change` trigger. The trigger runs as `SECURITY
INVOKER` so public authenticated updates are checked as the caller, not as the
function owner. The migration also keeps legacy `auth.users` sync hooks, when
present, from copying client-writable `raw_user_meta_data.role` into
`public.users.role`. Public authenticated users cannot change
`public.users.role`; role grants require backend service-role/database admin
execution after the corresponding teacher approval, parent link, or operational
admin workflow.

`services/api/migrations/202606110002_resource_rls_hardening.sql` removes
public-client write policies for parent link state, class roster membership,
AI coach interaction logs, AI review jobs, progress tables, weekly reviews,
student badges, and prepared notifications. Authorized read policies remain in
place for owning students, active linked parents, and currently assigned
teachers.

`scripts/supabase-migrations.mjs` is the controlled migration and RLS verifier.
It records applied checksums in `public.writerhabit_schema_migrations`, applies
SQL files in filename order, and can run the resource RLS suite:

```bash
node scripts/supabase-migrations.mjs status
node scripts/supabase-migrations.mjs apply-and-verify
node scripts/supabase-migrations.mjs verify-rls
```

The RLS verification proves auth metadata cannot elevate role, students cannot
become admin, students cannot read/write another student's profile or
submission, parents can read active linked children only, revoked links deny
access, teachers can read class student submissions only while active in the
class roster, public clients cannot write system-owned review/AI/progress rows,
and the trusted service/admin SQL path can perform backend transitions.

## Audit Logs

| Table | Purpose | Important constraints and indexes |
| --- | --- | --- |
| `audit_logs` | Security and operational audit events. | Actor user FK, actor role/result checks, request ID, target and action indexes, JSONB metadata index. |

The API authorization doc lists actions that must be audited, including link
changes, roster changes, assignment publication, submission, AI safety blocks,
AI review jobs, canvas export/recognition, subscription provider events, and
admin access.

## RLS Helper Functions

The RLS migration defines security-definer helpers:

- `current_user_role()`
- `is_WriterHabit_admin()`
- `is_student_owner(student_profile_id)`
- `is_parent_for_student(student_profile_id)`
- `is_teacher_for_class(class_id)`
- `is_teacher_for_student(student_profile_id)`
- `is_student_in_class(class_id)`
- `can_read_student(student_profile_id)`
- `can_read_class(class_id)`
- `can_read_assignment(assignment_id)`
- `can_read_submission(submission_id)`
- `can_read_feedback(feedback_id)`
- `can_read_canvas_document(canvas_document_id)`
- `can_teacher_comment_on_submission(submission_id)`

The policies wrap `auth.uid()` calls in helper functions and rely on indexed
relationship columns to keep access checks bounded.

## Migration Notes

These migrations are applied to the configured development Supabase instance
through `node scripts/supabase-migrations.mjs apply-and-verify`. Before
production use:

1. Run `node scripts/supabase-migrations.mjs apply-and-verify` against a
   disposable Supabase branch or staging project using production-shaped
   credentials.
2. Run the same command against production during a controlled release window
   and archive the non-secret command output.
3. Decide whether public app clients will query these tables directly or only
   through backend API handlers.
4. Add seed data for catalog rubrics, badges, and assignment templates.
5. Keep adding endpoint-level integration tests as production route handlers
   replace deterministic mobile mocks.
