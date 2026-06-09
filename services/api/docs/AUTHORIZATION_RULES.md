# WriteWise API Authorization Rules

Status: planned backend authorization model. Database RLS and migration details
now live in `services/api/docs/DATABASE_SCHEMA.md`,
`services/api/docs/DATA_RELATIONSHIPS.md`, and `services/api/migrations/`; this
document defines service-level rules for API handlers.

## Principals

| Principal | Source | Notes |
| --- | --- | --- |
| Student | Auth token user with role `student` | Can access their own profile, assignments, drafts, submissions, canvas documents, feedback, and progress. |
| Parent | Auth token user with role `parent` | Can access linked students through active parent-student links. |
| Teacher | Auth token user with role `teacher` | Can access classes they own and students enrolled in those classes. |
| Admin | Auth token user with role `admin` | Operational access only; actions must be audited. |
| Provider webhook | Verified signature | Limited to subscription or provider event endpoints. |

## Global Rules

- Authorize every request after authentication and before loading full student
  content where possible.
- Treat `404 resource.not_found` and `403 authorization.*` carefully so endpoints
  do not leak the existence of student records to unrelated users.
- Never trust client-supplied `role`, `studentId`, `parentId`, `teacherId`, or
  `classId` without checking the authenticated principal.
- Service-role credentials are backend-only and must not be logged.
- Mutating requests should write audit metadata: actor user ID, role, target
  resource ID, action, request ID, timestamp, and result.
- Student writing and canvas contents are educational records. Return bounded
  excerpts to parent and teacher dashboards unless the detailed endpoint is
  explicitly authorized.
- Signed URL endpoints must authorize the caller before creating the URL, derive
  object paths server-side, and audit URL creation without logging the URL.
- Rate limits must apply to AI, auth abuse thresholds, signed URL creation,
  provider webhooks, notification device registration, and admin access.

## Resource Access Matrix

| Resource | Student | Parent | Teacher | Admin |
| --- | --- | --- | --- | --- |
| Student profile | Own profile | Linked students, read mostly | Enrolled students, limited read | Scoped operational access |
| Onboarding | Own onboarding | No direct write | No direct write | Scoped operational access |
| Assignments | Own assigned work | Linked students, read | Classes they own, create/read/update | Scoped operational access |
| Drafts | Own drafts | No write; no full draft by default | No write; bounded preview after submission | Scoped operational access |
| Submissions | Own submissions | Linked student summaries and bounded excerpts | Class submissions and bounded review detail | Scoped operational access |
| Canvas documents | Own documents | Linked student previews | Class submission previews | Scoped operational access |
| AI coach | Own active work only | No direct coaching call | No direct student coaching call | No direct coaching call except diagnostics |
| AI review | Own submissions | Read linked feedback summaries | Read class feedback summaries | Scoped operational access |
| Progress | Own progress | Linked student reports | Class aggregates and enrolled student progress | Scoped operational access |
| Subscriptions | Own account or managed family account | Own account/family account | Own account/school account if enabled | Scoped operational access |

## Endpoint Rules

### Auth

- `POST /auth/sign-up` can create student, parent, or teacher accounts. Admin
  creation is out of band.
- `GET /auth/session` returns the authenticated user's derived role and public
  profile metadata only.
- Auth endpoints must not expose provider admin details or service-role keys.

### Students And Onboarding

- `GET /students/:studentId` requires one of:
  - student owns `studentId`
  - parent has an active link to `studentId`
  - teacher owns a class containing `studentId`
  - admin scoped access
- `PATCH /students/:studentId` is student-owned for age-appropriate profile
  fields. Parent-managed settings can be added later through parent settings
  endpoints. Teachers cannot edit student profiles.
- Onboarding save and complete endpoints are student-owned. Parent-assisted
  onboarding should still write as a linked parent action and be audited.

### Assignments

- Students can list, start, and submit only their own student assignments.
- Parents can read linked student assignment summaries but cannot start or
  submit assignments.
- Teachers can create assignments only for classes they own.
- Teachers can read assignment and submission state only for their classes.
- Assignment prompts and teacher comments must be checked for academic integrity
  and age-appropriate content.

### Submissions And Drafts

- Draft endpoints are student-owned.
- Draft responses return full student text only to the owning student.
- Parent and teacher review endpoints return bounded excerpts and feedback
  summaries unless a future policy explicitly expands access.
- Submitting a draft requires non-empty student-authored content.
- Revision submissions must contain student-written revised text for the focused
  task. The backend must not accept AI-generated final draft replacement flows.

### Canvas

- Canvas documents are student-owned.
- Signed upload URLs are issued only for authorized canvas document paths.
- Object paths should include server-derived ownership scope, not raw client
  path input.
- Parents and teachers can view previews only through linked student or class
  submission scope.
- Recognition text inherits the same access rules as the canvas document and
  related submission.

### AI Coach

- AI coach calls are student-owned and scoped to an active assignment or draft.
- Allowed actions are only:
  - `hint`
  - `brainstorm`
  - `check_sentence`
  - `explain_grammar`
  - `suggest_vocabulary`
  - `revision_question`
- Requests asking for a final answer, full rewrite, finished essay, or completed
  assignment return `422 ai_safety.*`.
- AI logs must store minimal metadata needed for safety, abuse prevention, and
  debugging. Do not store provider secrets or full prompts in general logs.
- Usage limits are enforced by authenticated user and student.

### AI Review

- A student can request review only for their own submitted work.
- AI review output must include one strength, one improvement, and one next
  revision task.
- AI review output must not provide a complete replacement draft.
- Parent and teacher access to review data follows linked student and class
  scope.
- Review job retries must be idempotent by submission ID and idempotency key.

### Progress

- Students can read their own progress.
- Parents can read linked student reports.
- Teachers can read aggregate class progress and enrolled student progress.
- Teacher class aggregates should avoid exposing sensitive individual details in
  aggregate endpoints unless the class roster scope is explicit.

### Subscriptions

- `GET /me/entitlements` is account-owned.
- Checkout and restore actions are account-owned and require idempotency keys.
- Store-provider webhooks require verified signatures and provider event
  idempotency.
- Webhook handlers must not trust provider payload account mapping without
  looking up the internal user or family entitlement record.

## Audit Events

Framework-neutral audit event contracts and metadata sanitization live in
`services/api/src/features/audit/`. The draft database row shape is
`public.audit_logs` in `services/api/migrations/202606090001_initial_writewise_schema.sql`.

Audit the following backend actions:

- account creation and sign-in failures above abuse thresholds
- parent-student link changes
- teacher class roster changes
- assignment creation, publication, and submission
- AI coach safety blocks
- AI review job creation and completion
- canvas signed URL creation, export, and recognition
- subscription checkout, restore, and webhook processing
- admin reads or writes

Suggested audit event shape:

```ts
interface AuditEvent {
  id: string;
  actorUserId: string | null;
  actorRole: "student" | "parent" | "teacher" | "admin" | "provider";
  action: string;
  targetType: string;
  targetId: string;
  requestId: string;
  result: "success" | "denied" | "failed";
  createdAt: string;
}
```
