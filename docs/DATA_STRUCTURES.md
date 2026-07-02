# WriterHabit Data Structures

Status: current repository map as of the mobile Expo app and Fastify/Supabase
backend scaffold in this workspace. This document describes the real TypeScript
models, validation boundaries, local persistence shapes, and planned backend
table alignment. It is not a replacement for the database schema reference in
`services/api/docs/DATABASE_SCHEMA.md`.

## Purpose

WriterHabit has several data layers today:

- shared product enums in `packages/shared/`
- mobile feature-owned Zod schemas and view models in `apps/mobile/src/features/`
- local mobile persistence through SecureStore, Expo SQLite localStorage, and
  feature-owned SQLite
- backend persistence contracts in `services/api/src/data/*.types.ts`
- Supabase/Postgres migrations in `services/api/migrations/`

The current structure is usable, but it is not yet a single unified data model.
New work should avoid creating duplicate enums or unvalidated object shapes and
should promote stable cross-feature contracts into shared packages as they
become production-backed.

## Data Ownership Rules

| Layer                  | Owns                                                                                                                         | Current source                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Shared contracts       | Stable product-wide enums, shared Zod schemas, and minimal cross-package shapes.                                             | `packages/shared/src/schemas.ts`, `packages/shared/src/types.ts`                                                      |
| Mobile API/read models | Feature-specific screen data, loading/error scenarios, and Zod validation for mock or API responses.                         | `apps/mobile/src/features/*/types.ts`                                                                                 |
| Mobile local state     | UI state, offline/no-session draft recovery, local preferences, local canvas documents, and Grade 3 SQLite fallback.         | Feature stores/services under `apps/mobile/src/features/` plus storage facades in `apps/mobile/src/services/storage/` |
| Backend records        | Database row and repository contract shapes for the writing workflow, progress, entitlements, notifications, and audit logs. | Domain files under `services/api/src/data/`; repository barrel in `services/api/src/data/types.ts`                    |
| Database schema        | Postgres tables, indexes, constraints, RLS, and trusted workflow functions.                                                  | `services/api/migrations/`, documented in `services/api/docs/DATABASE_SCHEMA.md`                                      |

## Canonical Shared Enums

`packages/shared/src/schemas.ts` exports shared Zod schemas for the small
product-wide contract surface used by mobile and backend tests.
`packages/shared/src/types.ts` re-exports the schema-inferred types and keeps
minimal shared interfaces.

```ts
type UserRole = "student" | "parent" | "teacher" | "admin";
type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type WritingGoal =
  | "improve_spelling"
  | "write_better_sentences"
  | "write_paragraphs"
  | "write_essays"
  | "creative_writing"
  | "test_prep"
  | "improve_grammar"
  | "school_assignments"
  | "improve_handwriting";

type WritingSkill =
  | "spelling"
  | "grammar"
  | "punctuation"
  | "sentence_structure"
  | "vocabulary"
  | "organization"
  | "creativity"
  | "clarity"
  | "evidence_usage"
  | "argument_strength"
  | "revision_quality"
  | "handwriting"
  | "reading_response";

type AssignmentType =
  | "sentence_practice"
  | "paragraph_writing"
  | "essay_writing"
  | "creative_writing"
  | "reading_response"
  | "grammar_practice"
  | "vocabulary_practice"
  | "test_prep"
  | "journal"
  | "handwriting_practice";
```

Current state: assignment, student-home, AI coach, feedback-review, progress,
parent, teacher, onboarding, writing-workspace, and subscription feature schemas
now import these shared enum schemas instead of redeclaring their own copies.

## Mobile Feature Data Structures

### Auth

Source:

- `apps/mobile/src/features/auth/types.ts`
- `apps/mobile/src/core/auth/authTypes.ts`
- `apps/mobile/src/core/auth/sessionService.ts`
- `apps/mobile/src/core/auth/authStore.ts`

Primary shapes:

- `SignInFormValues`
- `LoginLinkFormValues`
- `SignUpInputValues`
- `SignUpFormValues`
- `AuthSession`
- role routing/session source types in core auth

Validation:

- Zod validates email/password/name input in `features/auth/types.ts`.
- Mobile session role and subscription entitlement are derived from trusted
  server-owned auth metadata, not client-writable user metadata.

Persistence:

- Supabase auth uses Expo SQLite localStorage through
  `apps/mobile/src/core/supabase/supabaseClient.ts`.

### Onboarding

Source:

- `apps/mobile/src/features/onboarding/types.ts`
- `apps/mobile/src/features/onboarding/stores/onboardingStore.ts`
- `apps/mobile/src/features/onboarding/services/onboardingPersistenceService.ts`

Primary shapes:

```ts
type OnboardingRole = "student" | "parent" | "teacher";
type WritingConfidenceLevel =
  "getting_started" | "building" | "steady" | "confident";
type DailyPracticeMinutes = 5 | 10 | 15 | 20 | 30;

type OnboardingProgress = {
  role?: OnboardingRole;
  gradeLevel?: GradeLevel;
  writingGoals: WritingGoal[];
  confidenceLevel?: WritingConfidenceLevel;
  dailyPracticeMinutes?: DailyPracticeMinutes;
  updatedAt?: string;
};

type CompletedOnboardingProfile = {
  role: "student";
  gradeLevel: GradeLevel;
  writingGoals: WritingGoal[];
  confidenceLevel: WritingConfidenceLevel;
  dailyPracticeMinutes: DailyPracticeMinutes;
};
```

Validation:

- Zod schemas validate in-progress and completed onboarding data.
- `MAX_WRITING_GOALS = 4`.

Persistence:

- Signed-in onboarding writes partial recovery state, including the pre-grade
  role step, to `users.onboarding_progress`.
- Once grade-level data is available, signed-in student onboarding also syncs
  canonical profile fields to `student_profiles`.
- `preferencesStorage` keeps no-session and failed-remote-write recovery under a
  per-user key from `onboardingPersistenceService.ts`.
- Role/entitlement authority remains server-owned; the onboarding recovery JSON
  does not grant app roles.

### Student Home

Source:

- `apps/mobile/src/features/student-home/types.ts`
- `apps/mobile/src/features/student-home/api/studentHomeApi.ts`
- `apps/mobile/src/features/student-home/services/studentHomeViewModel.ts`

Primary shapes:

- `StudentHomeApiResponse`
- `StudentHomeAssignment`
- `StudentHomeDraft`
- `StudentHomeFeedback`
- `StudentHomeSkillProgress`
- `StudentHomeViewModel`

Nature:

- Read model for the student dashboard.
- Signed-in dashboard reads are derived from Supabase rows for the logged
  student's profile, progress totals, skill progress, assignments, drafts, and
  recent feedback. No-session/demo dashboard data remains deterministic/mock.
- Not a persisted table by itself.

### Assignments

Source:

- `apps/mobile/src/features/assignments/types.ts`
- `apps/mobile/src/features/assignments/api/assignmentsApi.ts`
- `apps/mobile/src/features/assignments/services/assignmentStatusService.ts`
- `apps/mobile/src/features/assignments/services/dailyAssignmentService.ts`
- `apps/mobile/src/features/assignments/services/attachmentTypes.ts`

Primary shapes:

```ts
type AssignmentStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "reviewing"
  | "feedback_ready"
  | "revision_in_progress"
  | "completed";

type AssignmentRecord = {
  id: string;
  title: string;
  prompt: string;
  assignmentType: AssignmentType;
  gradeLevelMin: GradeLevel;
  gradeLevelMax: GradeLevel;
  skillFocus: WritingSkill[];
  difficulty: "easy" | "moderate" | "challenging";
  estimatedMinutes: number;
  rubricId: string;
  status: AssignmentStatus;
  assignedLabel: string;
  dueLabel: string;
  instructions: string[];
  rubric: AssignmentRubricCriterion[];
  draft: AssignmentDraftSummary | null;
  currentSubmissionId?: string;
  studentAssignmentId?: string;
  submittedLabel?: string;
  teacherNote?: string;
};
```

Attachments:

```ts
type AssignmentAttachmentKind = "image" | "file";
type ExtractionStatus = "pending" | "extracting" | "done" | "error";
```

Validation:

- Zod validates history, detail, and submission response data.
- Attachment extraction runs locally. When a signed-in student submits from the
  assignment upload flow, the extracted or student-edited response text is sent
  through the backend submission workflow and stored in `submission_contents`
  with the normal bounded `submissions.typed_text_excerpt`. Signed-in
  submissions also store bounded attachment metadata in
  `submission_attachments`, including client attachment ID, kind, file name,
  MIME type, size, storage object path, upload status, extraction status, and
  extracted text excerpt. Uploaded photo/file bytes are stored in the private
  `submission-attachments` Supabase Storage bucket for signed-in submissions.

Current persistence:

- Signed-in assignment history/detail reads use Supabase rows for
  `student_assignments`, `assignments`, `rubrics`, `rubric_criteria`, and
  `writing_drafts`.
- Signed-in submission confirmation calls the backend workflow route, which
  persists submission rows under the authenticated student's profile.
- No-session/demo assignment data remains deterministic/mock.

Backend alignment:

- Planned backend tables: `assignments`, `student_assignments`,
  `rubrics`, `rubric_criteria`, `submissions`, `submission_contents`.
- Backend row types live in `services/api/src/data/types.ts`.

### Writing Workspace

Source:

- `apps/mobile/src/features/writing-workspace/types.ts`
- `apps/mobile/src/features/writing-workspace/services/draftPersistenceService.ts`
- `apps/mobile/src/features/writing-workspace/services/writingMetricsService.ts`

Primary shapes:

```ts
type WritingAutosaveStatus =
  "idle" | "restoring" | "unsaved" | "saving" | "saved" | "failed";
type WritingSubmitError = "empty_draft" | "save_failed" | "submit_failed";

type WritingDraft = {
  assignmentId: string;
  canvasAttachment: WritingCanvasAttachment | null;
  createdAt: string;
  revisionNumber: number;
  studentId: string;
  text: string;
  updatedAt: string;
};
```

Limits:

- `MAX_DRAFT_TEXT_LENGTH = 20_000`.

Persistence:

- Signed-in draft data is persisted in Supabase `writing_drafts`.
- No-session and failed remote saves fall back to `localJsonStorage`.
- Local storage key format is generated by `draftPersistenceService.ts` from
  student and assignment IDs.

Backend alignment:

- Backend table: `writing_drafts`.
- Backend full submission text is stored separately in `submission_contents`.

### Canvas

Source:

- `apps/mobile/src/features/canvas/types.ts`
- `apps/mobile/src/features/canvas/services/canvasPersistenceService.ts`
- `apps/mobile/src/features/canvas/services/canvasDocumentService.ts`
- `apps/mobile/src/features/canvas/services/canvasSyncService.ts`

Primary shapes:

```ts
type CanvasTool = "pen" | "eraser" | "highlighter";
type CanvasTemplate =
  | "blank_page"
  | "lined_paper"
  | "storyboard"
  | "mind_map"
  | "essay_plan"
  | "vocabulary_web"
  | "handwriting_practice"
  | "annotate_passage";
type CanvasSyncStatus = "local_only" | "saving" | "saved" | "sync_failed";

type CanvasDocument = {
  id: string;
  studentId: string;
  title: string;
  template: CanvasTemplate;
  strokes: CanvasStroke[];
  syncStatus: CanvasSyncStatus;
  createdAt: string;
  updatedAt: string;
  assignmentId?: string;
  attachedAt?: string;
  recognizedText?: string;
  storageObjectPath?: string;
  previewImageUrl?: string;
};
```

Limits:

- `MAX_CANVAS_STROKES = 240`
- `MAX_CANVAS_POINTS_PER_STROKE = 16`
- `MAX_CANVAS_DOCUMENTS = 24`
- `MAX_CANVAS_UNDO_STEPS = 12`

Persistence:

- Canvas document data is local-first and syncs to backend canvas tables plus
  the private `canvas-artifacts` Supabase Storage bucket by default for signed-in
  sessions.
- Sync status is explicit and must never block drawing.

Backend alignment:

- Backend metadata table: `canvas_documents`.
- Backend private payload table: `canvas_document_contents`.
- Backend private object bucket: `canvas-artifacts`.
- Submission join table: `submission_canvas_documents`.

### AI Coach

Source:

- `apps/mobile/src/features/ai-coach/types.ts`
- `apps/mobile/src/features/ai-coach/services/aiCoachContextService.ts`
- `apps/mobile/src/features/ai-coach/services/aiCoachPolicyService.ts`
- `apps/mobile/src/features/ai-coach/services/academicIntegrityService.ts`
- `services/api/src/routes/ai-coach.ts`
- `services/api/src/features/ai/contracts.ts`
- `services/api/src/features/ai/coach/ai-coach.service.ts`
- `services/api/src/data/audit.types.ts`

Primary shapes:

```ts
type AiCoachAction =
  | "hint"
  | "brainstorm"
  | "sentence_check"
  | "explain_mistake"
  | "revision_help"
  | "stronger_word"
  | "ask_question";

type AiCoachSafetyFlag =
  | "answer_request"
  | "assignment_completion_request"
  | "empty_context"
  | "full_rewrite_request"
  | "unsafe_output"
  | "unsupported_action";
```

Important limits:

- `MAX_AI_COACH_DRAFT_EXCERPT_LENGTH = 1_200`
- `MAX_AI_COACH_CANVAS_EXCERPT_LENGTH = 600`
- `MAX_AI_COACH_STUDENT_REQUEST_LENGTH = 360`

Safety rule:

- Coach data must remain coaching-only. It can return strengths, improvement
  guidance, next steps, and questions. It must not generate finished assignment
  text for the student.

Backend alignment:

- Signed-in mobile coach requests are posted to backend AI coach endpoints.
- The backend authorizes the owning student profile, resolves
  `student_assignments`, and writes request outcome metadata to
  `ai_coach_interactions`.
- Backend contracts also define AI review, moderation, usage, provider, and
  safety result shapes under `services/api/src/features/ai/`.

### Feedback Review And Revision

Source:

- `apps/mobile/src/features/feedback-review/types.ts`
- `apps/mobile/src/features/feedback-review/api/feedbackreviewApi.ts`
- `apps/mobile/src/features/feedback-review/services/feedbackReviewService.ts`
- `apps/mobile/src/features/feedback-review/services/revisionPersistenceService.ts`

Primary shapes:

- `FeedbackReview`
- `FeedbackSummary`
- `FeedbackRevisionTask`
- `FeedbackRubricScore`
- `GrammarSuggestion`
- `FeedbackRevisionDraft`
- `FeedbackRevisionCompletion`

Limits:

- `MAX_FEEDBACK_REVIEW_EXCERPT_LENGTH = 900`
- `MAX_FEEDBACK_REVISION_TEXT_LENGTH = 2_400`

Persistence:

- Signed-in revision draft autosave persists to Supabase
  `submission_revision_drafts`.
- No-session and failed remote revision draft saves fall back to
  `localJsonStorage`.
- Signed-in feedback review and revision completion use backend routes; no-session
  demo paths still use deterministic local review data.

Backend alignment:

- Tables: `review_jobs`, `feedback`, `revision_tasks`,
  `feedback_rubric_scores`, `grammar_suggestions`,
  `submission_revision_drafts`, and `submission_revisions`.
- Trusted backend workflow functions own review-job, feedback publication, and
  revision completion transitions.

### Progress And Badges

Source:

- `apps/mobile/src/features/progress/types.ts`
- `apps/mobile/src/features/progress/api/progressApi.ts`
- `apps/mobile/src/features/progress/services/streakService.ts`
- `apps/mobile/src/features/progress/services/badgeUnlockService.ts`

Primary shapes:

- `ProgressApiResponse`
- `ProgressTotals`
- `ProgressDailyActivity`
- `ProgressSkill`
- `ProgressWeeklyReview`
- `ProgressBadgeDefinition`
- `ProgressDashboardViewModel`

Backend alignment:

- Signed-in progress reads use the backend `GET /students/:studentId/progress`
  route, backed by `student_progress_totals`, `student_skill_progress`,
  `student_activity_days`, `weekly_reviews`, `badges`, and `student_badges`.
- Public clients should read authorized progress rows only. Progress mutations
  are backend workflow-owned.

### Grade 3 Writing Adventure

Source:

- `apps/mobile/src/features/grade3-writing-adventure/types.ts`
- `apps/mobile/src/features/grade3-writing-adventure/content/grade3WritingProgram.content.ts`
- `apps/mobile/src/features/grade3-writing-adventure/services/grade3WritingProgressService.ts`

Primary shapes:

```ts
type Grade3PlanningState = {
  talkIdea: string;
  beginning: string;
  middle: string;
  end: string;
};

type Grade3WritingProgress = {
  day: number;
  draft: string;
  strongerSentence: string;
  favoriteSentence: string;
  checklist: Record<string, boolean>;
  planning: Grade3PlanningState;
  completed: boolean;
  updatedAt: string;
};
```

Persistence:

Signed-in Supabase persistence:

- Table: `grade3_writing_progress`.
- Owner key: `student_profile_id`, with a unique `(student_profile_id, day)`
  index.
- RLS: student owner/admin can manage rows; authorized readers can select rows
  through `can_read_student`.
- `draft`, `stronger_sentence`, and `favorite_sentence` are capped at 6,000
  characters.

Scope:

- Signed-in student progress is stored in Supabase.
- No-session and failed remote saves fall back to
  `writerhabit_grade3_writing_adventure.db` through Expo SQLite.
- Canvas/upload is optional support; typed daily writing can submit when
  validation requirements are complete.

### Parent

Source:

- `apps/mobile/src/features/parent/types.ts`
- `apps/mobile/src/features/parent/api/parentApi.ts`
- `apps/mobile/src/features/parent/services/parentViewModel.ts`

Primary shapes:

- `ParentDashboardApiResponse`
- `ParentStudentReportApiResponse`
- `ParentAssignmentReviewApiResponse`
- `ParentSettingsApiResponse`
- `ParentStudentSummary`
- `ParentWeeklyProgress`
- `ParentAssignmentSummary`
- `ParentAssignmentReview`

Nature:

- Parent models are bounded read models for linked-student visibility.
- For signed-in Supabase sessions, the parent dashboard, student report,
  assignment review, and linked-student settings summaries now derive from the
  logged user's own seeded `student_profiles`, `student_progress_totals`,
  `student_skill_progress`, `student_assignments`, `submissions`, `feedback`,
  `feedback_rubric_scores`, `canvas_documents`, and `parent_settings` rows.
  Parent settings updates upsert the logged user's `parent_settings` row. The
  deterministic parent data remains the no-session/dev scenario fallback.
- Full draft text, full submission text, raw canvas strokes, and AI coach logs
  should not be exposed to parent dashboards.

Backend alignment:

- Relationship table: `parent_student_links`.
- Parent profile/settings tables: `parent_profiles`, `parent_settings`.

### Teacher

Source:

- `apps/mobile/src/features/teacher/types.ts`
- `apps/mobile/src/features/teacher/api/teacherApi.ts`
- `apps/mobile/src/features/teacher/services/teacherViewModel.ts`

Primary shapes:

- `TeacherDashboardApiResponse`
- `TeacherAssignmentsApiResponse`
- `TeacherSubmissionsApiResponse`
- `TeacherClassProgressApiResponse`
- `TeacherSubmissionReviewApiResponse`
- `CreateTeacherAssignmentInput`
- `CreateTeacherAssignmentFormValues`

Nature:

- Teacher models are class-scoped read/write view models.
- Signed-in teacher dashboard, assignment list, submission queue, class
  progress, and submission review read models now derive from the logged dev
  user's seeded student assignment, submission, feedback, rubric, canvas,
  progress, and skill rows.
- Assignment creation has a Zod form schema. Signed-in creation writes a
  teacher-owned rubric, rubric criteria, assignment, and same-dev-student
  `student_assignments` row to Supabase. Signed-in teacher comments insert
  `teacher_submission_comments` rows through the logged user's seeded teacher
  profile and class roster.
- Signed-in teacher dashboard insight dismissal syncs through
  `teacher_profiles.dashboard_preferences`, with local preference storage only
  as no-session/recovery fallback.
- Deterministic/mock teacher data remains the no-session/dev scenario fallback.

Backend alignment:

- Planned tables: `teacher_profiles`, `classes`, `class_students`,
  `assignments`, `student_assignments`, `teacher_submission_comments`.

### Student Messages

Source:

- `apps/mobile/src/features/messages/hooks/useStudentMessages.ts`
- `apps/mobile/src/features/messages/screens/StudentMessagesScreen.tsx`

Primary shape:

```ts
type MessageSenderKind = "teacher" | "coach";

interface StudentMessageThread {
  id: string;
  senderKind: MessageSenderKind;
  senderName: string;
  initials: string;
  timeLabel: string;
  preview: string;
}
```

Persistence:

- Signed-in student messages are read from Supabase `student_messages`.
- No-session/demo sessions use localized fallback threads.
- Public clients can select authorized message rows, but message writes are
  admin/service-owned so students cannot forge teacher or coach messages.

### Daily Practice

Source:

- `apps/mobile/src/features/practice/data/practiceCatalog.ts`
- `apps/mobile/src/features/practice/hooks/usePracticeSession.ts`
- `apps/mobile/src/features/practice/screens/PracticeSessionScreen.tsx`

Primary shapes:

- `PracticeSkill`
- `PracticeTask`
- `PracticeSessionState`

Persistence:

- Signed-in practice completion is stored in Supabase `practice_sessions` by
  student profile, skill, task, and completion date. Rows also store bounded
  evidence metadata: whether canvas was used, attachment count, extracted-text
  excerpt, and optional response text.
- The practice completion streak shown by the session screen is derived from
  recent `practice_sessions.completed_on` rows for signed-in sessions.
- No-session/demo sessions keep the previous local in-memory behavior.

### Subscriptions

Source:

- `apps/mobile/src/features/subscriptions/types.ts`
- `apps/mobile/src/features/subscriptions/api/subscriptionsApi.ts`
- `apps/mobile/src/features/subscriptions/services/entitlementService.ts`
- `services/api/src/features/subscriptions/subscriptions.contracts.ts`

Primary shapes:

```ts
type SubscriptionStatus =
  | "free"
  | "trial"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "refunded"
  | "grace_period";

type SubscriptionPlanId =
  "WriterHabit_plus_monthly" | "WriterHabit_plus_yearly";
```

Backend alignment:

- Planned/applied tables: `entitlements`, `entitlement_provider_events`.
- RevenueCat webhook handling is backend-owned.
- Mobile gates premium features from trusted entitlement responses; mobile local
  session state does not grant paid access.

### Profile Settings, Accessibility, And Notifications

Source:

- `apps/mobile/src/features/profile-settings/types.ts`
- `apps/mobile/src/features/profile-settings/hooks/useStudentProfileSummary.ts`
- `apps/mobile/src/features/profile-settings/accessibility/accessibilitySettingsStore.ts`
- `apps/mobile/src/features/profile-settings/services/studentProfileSettingsPreferenceService.ts`
- `apps/mobile/src/features/profile-settings/services/notificationPreferencesService.ts`
- `apps/mobile/src/core/notifications/notificationService.ts`
- `apps/mobile/src/core/notifications/notificationDeliveryService.ts`
- `services/api/src/features/notifications/notifications.contracts.ts`

Primary shapes:

- `ProfileSettingsState`
- accessibility settings from `apps/mobile/src/shared/utils/accessibility.ts`
- student profile settings preference payload
- notification preference payload
- notification device registration and prepared notification contracts
- student profile summary for the profile tab, including level/points display,
  daily goal, and badge shelf counts

Persistence:

- The student profile tab reads signed-in summary data from Supabase:
  `student_profiles.daily_goal_minutes`, `student_progress_totals`, and
  `student_badges`. Level and points are display values derived from persisted
  progress totals; no fixed profile gamification fixture is used for signed-in
  sessions.
- Accessibility settings use `preferencesStorage` with key
  `accessibility.settings.v1` for local recovery and sync to
  `student_profiles.accessibility_settings` for signed-in student sessions.
- Student profile settings and notification preferences use per-student
  `preferencesStorage` keys and sync through Supabase RPCs when possible.
- Push device tokens must be registered through backend boundaries and are not
  stored as plain local preferences.

Backend alignment:

- Tables: `notification_preferences`, `notification_devices`,
  `prepared_notifications`.
- RPCs for current mobile sync are defined in
  `202606100001_profile_settings_notification_sync.sql`.

## Mobile Storage Map

| Storage facade         | Backing store                    | Prefix                                    | Data examples                                                                                                            |
| ---------------------- | -------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `secureStorage`        | Expo SecureStore                 | `WriterHabit.secure.`                     | Raw secure string values when needed.                                                                                    |
| `preferencesStorage`   | Expo SecureStore                 | `WriterHabit.pref.`                       | No-session/fallback onboarding progress, profile settings, notification preferences, accessibility settings, dismissed teacher insight flag. |
| `localJsonStorage`     | Expo SQLite localStorage install | `WriterHabit.local.`                      | No-session/fallback writing drafts, canvas local documents, dev theme tuner overrides.                                   |
| Supabase auth storage  | Expo SQLite localStorage install | Supabase-managed localStorage keys        | Supabase auth session persistence.                                                                                       |
| Grade 3 SQLite service | Expo SQLite database             | `writerhabit_grade3_writing_adventure.db` | No-session/fallback `grade3_writing_progress` table.                                                                     |

Storage rules:

- Validate or normalize objects before persisting them.
- Keep full student writing local/private unless an explicit submission workflow
  stores it through a backend-owned path.
- Do not store service-role keys, provider secrets, push tokens, or AI provider
  credentials in mobile storage.
- Store bounded excerpts in read models for parent/teacher surfaces.

## Backend Persistence Map

The backend data contract is split across domain files under
`services/api/src/data/`; `services/api/src/data/types.ts` remains the
repository barrel and `Database` interface. The files mirror the Postgres
migration drafts. Important groups:

| Domain             | Backend records                                                                                                                                    | Tables                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity           | `StudentProfileRecord`, `TeacherProfileRecord`, relationship records                                                                               | `users`, `student_profiles`, `parent_profiles`, `teacher_profiles`, `parent_student_links`                                                      |
| Assignments        | `AssignmentRecord`, `StudentAssignmentRecord`, `RubricCriterionRecord`                                                                             | `assignments`, `student_assignments`, `rubrics`, `rubric_criteria`                                                                              |
| Drafts/submissions | `DraftRecord`, `SubmissionRecord`, `SubmissionRevisionRecord`                                                                                      | `writing_drafts`, `submissions`, `submission_contents`, `submission_attachments`, `submission_revision_drafts`, `submission_revisions`          |
| Canvas             | `CanvasDocumentRecord`                                                                                                                             | `canvas_documents`, `canvas_document_contents`, `submission_canvas_documents`                                                                   |
| Feedback/AI review | `ReviewJobRecord`, `FeedbackRecord`, `RevisionTaskRecord`, `FeedbackRubricScoreRecord`, `GrammarSuggestionRecord`                                  | `review_jobs`, `feedback`, `revision_tasks`, `feedback_rubric_scores`, `grammar_suggestions`                                                    |
| Progress           | `StudentProgressTotalsRecord`, `StudentSkillProgressRecord`, `StudentActivityDayRecord`, `WeeklyReviewRecord`, `BadgeRecord`, `StudentBadgeRecord` | `student_progress_totals`, `student_skill_progress`, `student_activity_days`, `practice_sessions`, `weekly_reviews`, `badges`, `student_badges` |
| Messages           | student message thread rows                                                                                                                        | `student_messages`                                                                                                                              |
| Entitlements       | `EntitlementRecord`, `EntitlementProviderEventRecord`                                                                                              | `entitlements`, `entitlement_provider_events`                                                                                                   |
| Notifications      | notification contracts                                                                                                                             | `notification_preferences`, `notification_devices`, `prepared_notifications`                                                                    |
| Audit              | audit contracts                                                                                                                                    | `audit_logs`                                                                                                                                    |

The backend `Database` interface is intentionally a repository boundary. Tests
can inject fakes; production should wire a Supabase service-role
implementation. Routes should stay fail-closed when a persistence implementation
is not configured.

Dev seeding:

- `scripts/seed-dev-user-supabase.mjs` creates or updates one student auth user
  and seeds student-owned rows plus same-user teacher profile/class roster rows
  across the signed-in surfaces above.
- After SQL seeding, the script uploads the seeded editable canvas artifact to
  the private `canvas-artifacts` bucket and a placeholder uploaded-evidence
  object to the private `submission-attachments` bucket, then marks the seeded
  `submission_attachments` row as `uploaded`.
- The script finishes with a verification query that fails if required dev-user
  rows are missing for assignment, writing draft, submission, submission
  content, feedback detail, canvas content, progress, activity, weekly review,
  badge, notification, parent settings, teacher profile, teacher dashboard
  preferences, teacher class, class roster, entitlement, AI coach, message,
  practice, attachment, Storage object, or attachment upload state coverage.
- `node scripts/seed-dev-user-supabase.mjs verify` runs the same verification
  without mutating auth users, table rows, or Storage objects.
- The seed script still requires `.env.supabase-admin` with
  `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; without those values local
  static checks can run, but live migration/seed verification cannot.

## Data Flow By Workflow

### Daily Assignment Writing

```txt
StudentHomeApiResponse
  -> AssignmentRecord
  -> WritingWorkspaceResponse
  -> WritingDraft local autosave
  -> AssignmentSubmissionResponse / backend SubmissionRecord
  -> review_jobs
  -> FeedbackReviewResponse
  -> FeedbackRevisionCompletion
  -> progress tables
```

Current state:

- Signed-in student home and assignment reads use Supabase rows for the logged
  student's seeded profile, assignments, drafts, submissions, feedback, and
  progress. No-session/demo reads remain deterministic/mock.
- Signed-in writing drafts autosave to Supabase `writing_drafts`; no-session
  and failed remote saves use local recovery storage.
- Backend workflow types and tables exist for production submission/review
  flows, but full mobile-to-production integration is still incomplete.

### Canvas Writing

```txt
CanvasDocument local-first
  -> canvas sync status
  -> optional assignment attachment
  -> optional submission join
  -> parent/teacher bounded preview
```

Canvas content is the highest-risk mobile payload. Keep stroke counts and
summary metadata separate from full stroke arrays wherever possible.

### AI Coaching

```txt
AiCoachContext
  -> safety policy
  -> AiCoachPrompt
  -> AiCoachResponse
  -> optional ai_coach_interactions audit/usage row
```

Do not allow a data shape that implies finished-assignment generation. The
allowed action enum is intentionally coaching-focused.

### Grade 3 Writing Adventure

```txt
grade3WritingProgram.content.ts
  -> Grade3 lesson flow state
  -> Supabase grade3_writing_progress row when signed in
  -> grade3_writing_progress SQLite row when no-session/fallback
  -> home/progress/library read models
```

Grade 3 progress is intentionally separate from general assignment/progress
tables. Signed-in rows are student-owned Supabase records; no-session and failed
remote writes keep the original SQLite fallback.

## Validation Boundary Rules

1. Data from API clients must have a Zod schema before being rendered.
2. Data from local storage must be parsed through a schema or a normalizer.
3. Data sent to AI services must be bounded by max lengths and safety enums.
4. Data persisted to backend workflow tables must go through trusted workflow
   functions or backend service-role repository methods.
5. View models may combine feature data for rendering, but they should not
   become persistence models.

## Known Structure Gaps

These are not blockers for current local work, but they explain why the project
feels inconsistent:

- Mobile feature schemas and backend route contracts are not generated from a
  single source.
- Some surfaces use deterministic/mock APIs while backend table contracts
  already exist; the current consolidation keeps those mock paths only for
  no-session/demo fallback on surfaces that now have signed-in Supabase paths.
- Parent and teacher read models are feature-owned. Parent and teacher now have
  signed-in Supabase read branches for the single logged dev user's student
  data; teacher create/comment writes use the same user's seeded teacher
  profile/class roster locally, but still need scoped backend routes before
  production.
- Some legacy local storage keys remain feature-local; new shared keys should
  be registered in `apps/mobile/src/services/storage/storageKeys.ts`.
- Notification and audit do not currently expose implemented HTTP routes in
  `services/api/src/routes/`; their contract boundaries live in feature
  services. Keep adding route mappers when those endpoints move out of
  placeholders.

## Recommended Data Structure Refactor Plan

Status as of this update:

1. Done: create `packages/shared/src/schemas.ts` with Zod schemas for `GradeLevel`,
   `WritingGoal`, `WritingSkill`, `AssignmentType`, assignment status,
   subscription status, and common date strings.
2. Done: re-export schema-inferred types from `packages/shared` and replace
   duplicate mobile feature enum schemas in the active feature type files.
3. Started: add `apps/mobile/src/services/storage/storageKeys.ts` for stable
   local key names and ownership comments. Writing drafts, onboarding progress,
   profile settings, notification preferences, and accessibility settings use
   the registry.
4. Done: split `services/api/src/data/types.ts` into domain files:
   `identity.types.ts`, `assignments.types.ts`, `canvas.types.ts`,
   `feedback.types.ts`, `progress.types.ts`, `entitlements.types.ts`,
   `notifications.types.ts`, and `audit.types.ts`.
5. Done for currently implemented production routes: introduce mapper files for production routes:
   database row -> API response -> mobile view model. Assignment list/detail,
   parent dashboard/student list, teacher dashboard/submission queue, student
   writing-loop submissions/revisions, dashboard row summaries, student
   progress, canvas list/detail, AI coach, feedback review, and subscription
   entitlement responses now use mapper files under `services/api/src/mappers/`.
6. Done for current list/read models: keep full student content private by default. Contract tests verify
   full drafts, full submissions, canvas document ids, raw strokes, recognized
   handwriting text, and AI interaction details stay out of assignment,
   parent-dashboard, teacher-dashboard, progress, canvas-list, notification,
   and audit contracts where applicable.
7. Done for current mobile-facing production mappings: add contract tests that compare backend API responses with mobile
   Zod schemas before replacing mock APIs. Current coverage includes assignment
   detail, parent dashboard, teacher dashboard, student progress, canvas
   list/detail, AI coach, feedback review, subscription entitlement, notification
   registration, and audit database-row mappings.

## Quick Reference: Where To Add A New Data Shape

| New data shape                    | Put it here first                                                                                          | Promote when                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| One screen's rendering-only state | Feature component/screen file                                                                              | It is reused by multiple components.         |
| Feature API response              | `apps/mobile/src/features/<feature>/types.ts` with Zod schema                                              | It is used by backend and mobile.            |
| Feature local persisted state     | Feature `services/` file with schema/normalizer                                                            | It crosses feature boundaries.               |
| Product-wide enum                 | `packages/shared/src/schemas.ts` plus schema-inferred exports from `packages/shared/src/types.ts`          | Immediately if multiple features use it.     |
| Backend database row              | Domain files under `services/api/src/data/` plus the repository barrel in `services/api/src/data/types.ts` | It appears in a migration/repository method. |
| Backend route contract            | `services/api/src/features/<feature>/*.contracts.ts`                                                       | Mobile consumes the production endpoint.     |
| UI view model                     | Feature `services/*ViewModel.ts`                                                                           | Do not persist view models.                  |
