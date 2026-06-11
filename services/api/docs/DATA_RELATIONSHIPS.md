# WriterHabit Data Relationships

Status: planned relationship map for the database drafts in
`services/api/migrations/`. The Fastify API runtime shell exists, but neither
the runtime nor the current mobile app has been wired to these tables yet.

## Identity Graph

```txt
auth.users
  -> public.users
      -> student_profiles
      -> parent_profiles
      -> teacher_profiles
```

`public.users.id` is the app-facing copy of the Supabase auth user ID. Role
specific tables reference that user row with a unique `user_id`.

`student_profiles.id` is the canonical `studentId` used by planned API
endpoints. Use `student_profiles.user_id` only when an endpoint needs the
student's auth account.

## Family Access

```txt
users(parent)
  -> parent_profiles
  -> parent_student_links(parent_user_id, student_profile_id)
      -> student_profiles
```

An active `parent_student_links` row grants parent read access to the linked
student's profile, assignment summaries, submission excerpts, feedback summaries,
progress, badges, notification preferences, and weekly reports.

Parents do not receive direct database access to:

- `writing_drafts.text_content`
- `submission_contents.typed_text`
- `canvas_document_contents.strokes`
- `canvas_document_contents.recognized_text`
- `ai_coach_interactions`

Parent-facing APIs should continue returning bounded excerpts and summaries.

## Teacher And Class Access

```txt
users(teacher)
  -> teacher_profiles
      -> classes
          -> class_students
              -> student_profiles
```

Teachers can read classes they own and active roster students in those classes.
Class membership also allows the teacher to read assignment/submission summaries,
feedback summaries, student progress, and teacher comment records for enrolled
students.

Teacher-created assignments use this path:

```txt
teacher_profiles
  -> classes
      -> assignments(class_id, created_by_user_id)
          -> student_assignments
```

Teacher comments attach to submission summaries:

```txt
teacher_profiles
  -> teacher_submission_comments
      -> submissions
```

Teacher APIs should not expose full draft text or full canvas stroke payloads by
default.

## Assignment Lifecycle

```txt
rubrics
  -> rubric_criteria

assignments
  -> student_assignments
      -> writing_drafts
      -> submissions
          -> submission_contents
          -> submission_canvas_documents
              -> canvas_documents
```

Key lifecycle fields:

- `assignments.status`: `draft`, `published`, `archived`.
- `assignments.prompt_safety_status`: `pending_review`, `approved`, `blocked`.
- `student_assignments.status`: mirrors the planned mobile/API lifecycle from
  `not_started` through `completed`.
- `student_assignments.current_submission_id`: points to the latest submission
  once one exists.
- `writing_drafts.autosave_version` and `canvas_documents.client_version` support
  conflict detection for future sync APIs.
- `submissions.idempotency_key` and `submission_revisions.idempotency_key`
  support retry-safe writes.
- Assignment submission, feedback publication, and revision completion are
  backend-owned workflow transitions. Public clients cannot forge
  `submissions`, `review_jobs`, `feedback`, `revision_tasks`,
  `submission_revisions`, assignment completion state, or progress rows.

Catalog assignments have `assignments.class_id = null`. Teacher assignments
point at `classes.id`.

## Canvas Relationship

```txt
student_profiles
  -> canvas_documents
      -> canvas_document_contents

student_assignments
  -> canvas_documents(student_assignment_id)

submissions
  -> submission_canvas_documents
      -> canvas_documents
```

Canvas metadata and private payloads are split:

- `canvas_documents` stores template, title, sync status, storage paths,
  preview path, recognition status, and attachment metadata.
- `canvas_document_contents` stores strokes and recognized text.

This split lets APIs show canvas previews to linked parents and teachers without
granting direct access to full handwriting/canvas content.

## AI Review And Feedback

```txt
submissions
  -> review_jobs
  -> feedback
      -> revision_tasks
      -> feedback_rubric_scores
          -> rubric_criteria
      -> grammar_suggestions
  -> submission_revisions
```

Feedback rows are designed around the product safety contract:

- one strength
- one improvement
- one next revision task
- rubric scores
- grammar suggestions that ask for student action

`review_jobs.safety_flags` and `ai_coach_interactions.safety_flags` record
blocked or risky requests without storing provider secrets.

## Progress And Badges

```txt
student_profiles
  -> student_progress_totals
  -> student_skill_progress
  -> student_activity_days
  -> weekly_reviews
  -> student_badges
      -> badges
```

Progress tables are read-optimized. Backend services should derive them from:

- assignment starts and completions
- submitted word, sentence, and paragraph counts
- revision submissions
- feedback applied
- handwriting/canvas practice time
- rubric score changes

`badges` is a catalog table. `student_badges` stores each student's progress
toward or unlock state for catalog badges.

## Entitlements

```txt
users
  -> entitlements
  -> entitlement_provider_events(owner_user_id)
```

`entitlements.owner_user_id` represents the account that owns the subscription
or local entitlement. `scope_type` and `scope_id` allow later family, class, or
school entitlements without changing the core row shape.

Provider webhook idempotency is enforced through unique
`(provider, provider_event_id)` rows in `entitlement_provider_events`.

## Notifications

```txt
student_profiles
  -> notification_preferences
  -> prepared_notifications

users
  -> notification_devices
```

Notification preferences are per student. Device records belong to a user and
may optionally scope to a student profile for family devices.

Device tokens are represented as encrypted token material plus a hash for lookup.
They should never be written to application logs, committed files, screenshots,
or public documentation.

## Audit Trail

```txt
users(actor)
  -> audit_logs
```

Audit rows use `actor_user_id`, `actor_role`, `action`, `target_type`,
`target_id`, `request_id`, and `result`. `actor_user_id` may be null for verified
provider or system events.

Audit metadata is JSONB for non-secret diagnostic context. It should store
opaque IDs, request IDs, hashes, and result metadata rather than full student
writing, provider payload secrets, or push tokens.

## Privacy-Aware Read Paths

| Principal | Primary relationship check | Typical access |
| --- | --- | --- |
| Student | `student_profiles.user_id = auth.uid()` | Own profile, assignments, drafts, submissions, canvas content, feedback, progress. |
| Parent | Active `parent_student_links` row. | Linked student summaries, bounded submission excerpts, feedback summaries, reports, notification preferences. |
| Teacher | Owns class containing active `class_students` row. | Class roster, assignment state, submission summaries, feedback summaries, class progress, comments. |
| Admin | Server/admin-owned `users.role = 'admin'`. | Scoped operational access with audit logging. |

API handlers should authorize before loading full content and should avoid
returning sensitive rows to parent or teacher dashboards unless a detailed,
explicitly authorized endpoint is added later.
