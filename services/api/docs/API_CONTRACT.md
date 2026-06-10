# WriteWise Backend API Contract

Status: planned contract for the future backend service. The current mobile app
uses Supabase client auth, Supabase RPCs for student profile settings and
notification preferences, plus feature-owned deterministic mock APIs and local
storage where noted in the repository docs.

Base path:

```txt
/api/v1
```

## Contract Rules

- All timestamps are ISO 8601 UTC strings.
- All IDs are opaque UUID strings unless a provider webhook supplies its own ID.
- All authenticated app requests use `Authorization: Bearer <user access token>`.
- Service-role, model-provider, store-provider, and database admin credentials
  never appear in mobile app code, docs, `.codex` files, screenshots, logs, or
  committed files.
- Backend responses that can surface in the UI should include localization-ready
  keys or stable labels, not hard-coded instructional paragraphs.
- AI endpoints must coach. They must not provide finished assignment answers,
  full polished rewrites, or "do my homework" flows.
- Student-facing responses should support grade bands:
  - `elementary`: grades 1-5, simpler wording and fewer visible metrics.
  - `middle`: grades 6-8, structured cards and revision support.
  - `high`: grades 9-12, rubric detail and essay-planning signals.

## Shared Types

```ts
type UserRole = "student" | "parent" | "teacher" | "admin";
type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type GradeBand = "elementary" | "middle" | "high";

type ConnectionStatus = "online" | "offline_cached";

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

type StudentAssignmentStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "reviewing"
  | "feedback_ready"
  | "revision_in_progress"
  | "completed";

interface LocalizedCopy {
  key: string;
  params?: Record<string, string | number | boolean>;
  fallback: string;
}

interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

interface EmptyState {
  title: LocalizedCopy;
  body: LocalizedCopy;
  actionLabel?: LocalizedCopy;
}

interface StudentDraftSummary {
  studentAssignmentId: string;
  wordCount: number;
  canvasPageCount: number;
  revisionNumber: number;
  preview: string;
  updatedAt: string;
}
```

## Standard Error Shape

Canonical error codes live in `services/api/docs/ERROR_CODES.md`.

```ts
interface ApiErrorResponse {
  error: {
    code: string;
    messageKey: string;
    fallbackMessage: string;
    details?: Record<string, unknown>;
    requestId: string;
    retryable: boolean;
  };
}
```

Example:

```json
{
  "error": {
    "code": "authorization.student_scope_denied",
    "messageKey": "errors.authorization.studentScopeDenied",
    "fallbackMessage": "You do not have access to this student profile.",
    "details": { "studentId": "student_123" },
    "requestId": "req_01HYWZ4G9M0W4J8V1QW9W2EJ6A",
    "retryable": false
  }
}
```

## Auth

The mobile app currently uses the public Supabase client in
`apps/mobile/src/core/supabase/supabaseClient.ts` and auth/session mapping in
`apps/mobile/src/core/auth/sessionService.ts`. These endpoints are the planned
backend contract if auth is proxied or session metadata is hydrated by the API.

```txt
POST /auth/sign-up
POST /auth/sign-in
POST /auth/sign-out
GET  /auth/session
```

```ts
interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  gradeLevel?: GradeLevel;
  onboardingCompleted: boolean;
}

interface AuthSessionResponse {
  user: AuthUser;
  accessToken: string;
  expiresAt: string;
}

interface SignUpRequest {
  email: string;
  password: string;
  displayName: string;
  role: Exclude<UserRole, "admin">;
}

interface SignInRequest {
  email: string;
  password: string;
}
```

Sign-up example:

```json
{
  "email": "student@example.com",
  "password": "minimum-8-characters",
  "displayName": "Avery",
  "role": "student"
}
```

Successful response:

```json
{
  "user": {
    "id": "user_01",
    "email": "student@example.com",
    "displayName": "Avery",
    "role": "student",
    "onboardingCompleted": false
  },
  "accessToken": "issued-by-auth-provider",
  "expiresAt": "2026-06-09T19:00:00.000Z"
}
```

## Students

```txt
GET   /students/:studentId
PATCH /students/:studentId
GET   /students/:studentId/home
GET   /me/students
```

`GET /me/students` returns the students visible to the authenticated user. A
student sees their own profile, a parent sees linked children, a teacher sees
students in their classes, and an admin can filter by school or class scope.

```ts
interface StudentProfileResponse {
  id: string;
  userId: string;
  displayName: string;
  gradeLevel: GradeLevel;
  gradeBand: GradeBand;
  learningFocusNote: string;
  writingLevel: "getting_started" | "building" | "steady" | "confident";
  writingGoals: WritingGoal[];
  dailyGoalMinutes: 5 | 10 | 15 | 20 | 30;
  language: string;
  parentUserIds: string[];
  teacherUserIds: string[];
  onboardingCompletedAt: string | null;
}

interface UpdateStudentProfileRequest {
  displayName?: string;
  gradeLevel?: GradeLevel;
  learningFocusNote?: string;
  writingGoals?: WritingGoal[];
  dailyGoalMinutes?: 5 | 10 | 15 | 20 | 30;
  language?: string;
}

interface StudentHomeResponse {
  studentId: string;
  gradeLevel: GradeLevel;
  gradeBand: GradeBand;
  generatedAt: string;
  connectionStatus: ConnectionStatus;
  todayAssignment: StudentAssignmentSummary | null;
  continueDraft: StudentDraftSummary | null;
  streak: {
    currentDays: number;
    bestDays: number;
    practicedToday: boolean;
    nextMilestoneDays: number;
  };
  weeklyWriting: {
    minutesCompleted: number;
    minutesGoal: number;
    sessionsCompleted: number;
  };
  skillProgress: Array<{
    skill: WritingSkill;
    progressPercent: number;
    label: LocalizedCopy;
  }>;
  emptyState: EmptyState | null;
}
```

## Onboarding

The mobile app stores in-progress onboarding locally and writes public auth
metadata on completion. Student profile settings are synced through the
Supabase RPCs created in
`services/api/migrations/202606100001_profile_settings_notification_sync.sql`;
broader onboarding records and production API hydration remain planned here.

```txt
GET  /students/:studentId/onboarding
PUT  /students/:studentId/onboarding
POST /students/:studentId/onboarding/complete
POST /students/:studentId/personalized-plan
```

```ts
interface OnboardingProgress {
  currentStep:
    | "role"
    | "grade"
    | "goals"
    | "confidence"
    | "daily_practice"
    | "plan";
  gradeLevel: GradeLevel | null;
  writingGoals: WritingGoal[];
  confidenceLevel: "getting_started" | "building" | "steady" | "confident" | null;
  dailyPracticeMinutes: 5 | 10 | 15 | 20 | 30 | null;
  completedAt: string | null;
  updatedAt: string;
}

interface SaveOnboardingRequest {
  currentStep: OnboardingProgress["currentStep"];
  gradeLevel?: GradeLevel;
  writingGoals?: WritingGoal[];
  confidenceLevel?: "getting_started" | "building" | "steady" | "confident";
  dailyPracticeMinutes?: 5 | 10 | 15 | 20 | 30;
}

interface PersonalizedPlanResponse {
  studentId: string;
  gradeBand: GradeBand;
  headline: LocalizedCopy;
  practiceMinutes: 5 | 10 | 15 | 20 | 30;
  focusSkills: WritingSkill[];
  firstWeekGoals: LocalizedCopy[];
  recommendedAssignmentTypes: AssignmentType[];
}
```

Completion example:

```json
{
  "currentStep": "plan",
  "gradeLevel": 6,
  "writingGoals": ["write_paragraphs", "improve_grammar"],
  "confidenceLevel": "building",
  "dailyPracticeMinutes": 15
}
```

## Assignments

```txt
GET  /students/:studentId/daily-assignment
GET  /students/:studentId/assignments
GET  /assignments/:assignmentId
POST /students/:studentId/assignments/:assignmentId/start
POST /students/:studentId/assignments/:assignmentId/submit
```

Query parameters for `GET /students/:studentId/assignments`:

```ts
interface AssignmentListQuery {
  status?: StudentAssignmentStatus;
  type?: AssignmentType;
  cursor?: string;
  limit?: number;
}

interface AssignmentRubricCriterion {
  id: string;
  label: LocalizedCopy;
  description: LocalizedCopy;
  maxScore: 4;
}

interface StudentAssignmentSummary {
  studentAssignmentId: string;
  assignmentId: string;
  title: LocalizedCopy;
  prompt: LocalizedCopy;
  assignmentType: AssignmentType;
  gradeLevelMin: GradeLevel;
  gradeLevelMax: GradeLevel;
  skillFocus: WritingSkill[];
  difficulty: "easy" | "moderate" | "challenging";
  estimatedMinutes: number;
  status: StudentAssignmentStatus;
  dueAt: string | null;
  currentSubmissionId: string | null;
}

interface DailyAssignmentResponse extends StudentAssignmentSummary {
  selection: {
    reasonCodes: string[];
    targetDifficulty: "easy" | "moderate" | "challenging";
  };
}

interface AssignmentDetailResponse extends StudentAssignmentSummary {
  instructions: LocalizedCopy[];
  rubric: AssignmentRubricCriterion[];
  draft: StudentDraftSummary | null;
  teacherNote: LocalizedCopy | null;
}

interface StartAssignmentResponse {
  studentAssignmentId: string;
  status: "in_progress";
  startedAt: string;
  draft: StudentDraftSummary;
}
```

Daily assignment example response:

```json
{
  "studentAssignmentId": "sa_01",
  "assignmentId": "assignment_101",
  "title": {
    "key": "assignments.daily.paragraphPractice.title",
    "fallback": "Build a clear paragraph"
  },
  "prompt": {
    "key": "assignments.daily.paragraphPractice.prompt",
    "fallback": "Write one paragraph about a small choice that made your day better."
  },
  "assignmentType": "paragraph_writing",
  "gradeLevelMin": 6,
  "gradeLevelMax": 8,
  "skillFocus": ["organization", "clarity"],
  "difficulty": "moderate",
  "estimatedMinutes": 15,
  "status": "not_started",
  "dueAt": null,
  "currentSubmissionId": null,
  "selection": {
    "reasonCodes": ["matches_goals", "supports_weak_skill"],
    "targetDifficulty": "moderate"
  }
}
```

## Submissions And Drafts

The typed writing workspace currently persists drafts locally. Backend draft and
submission sync is planned here.

```txt
GET    /student-assignments/:studentAssignmentId/draft
PUT    /student-assignments/:studentAssignmentId/draft
DELETE /student-assignments/:studentAssignmentId/draft
POST   /student-assignments/:studentAssignmentId/submissions
GET    /submissions/:submissionId
POST   /submissions/:submissionId/revisions
GET    /submissions/:submissionId/revisions
```

```ts
interface DraftResponse extends StudentDraftSummary {
  text: string;
  canvasDocumentIds: string[];
  autosaveVersion: number;
}

interface SaveDraftRequest {
  text: string;
  canvasDocumentIds: string[];
  autosaveVersion: number;
}

interface CreateSubmissionRequest {
  typedText: string;
  canvasDocumentIds: string[];
  clientDraftVersion: number;
  idempotencyKey: string;
}

interface SubmissionResponse {
  id: string;
  studentAssignmentId: string;
  studentId: string;
  status: "submitted" | "reviewing" | "feedback_ready" | "revision_in_progress" | "completed";
  typedTextExcerpt: string;
  canvasDocumentIds: string[];
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  revisionNumber: number;
  submittedAt: string;
  feedbackId: string | null;
}

interface SubmitRevisionRequest {
  revisedExcerpt: string;
  revisionTaskId: string;
  idempotencyKey: string;
}
```

Submission example:

```json
{
  "typedText": "My paragraph is student-written text...",
  "canvasDocumentIds": ["canvas_01"],
  "clientDraftVersion": 4,
  "idempotencyKey": "ios-device-generated-uuid"
}
```

## Canvas

The mobile canvas stores compact stroke documents locally and saves locally
before any backend attempt. `apps/mobile/src/features/canvas/services/canvasSyncService.ts`
now scaffolds backend sync with deterministic signed upload and export
placeholders by default. It only calls these planned API routes when
`EXPO_PUBLIC_WRITEWISE_ENABLE_CANVAS_BACKEND_SYNC=true`; this repository still
does not contain a running backend server.

Backend canvas storage splits editable payloads from metadata:

- Stroke JSON is uploaded through a signed URL and referenced by object path.
- Metadata endpoints store template, title, stroke count, client/server version,
  assignment attachment, preview/export state, and sync timestamps.
- Export and recognition endpoints queue placeholder jobs until runtime workers
  exist.

```txt
GET    /students/:studentId/canvas-documents
POST   /students/:studentId/canvas-documents
GET    /canvas-documents/:canvasDocumentId
PUT    /canvas-documents/:canvasDocumentId
DELETE /canvas-documents/:canvasDocumentId
POST   /canvas-documents/:canvasDocumentId/attach
POST   /canvas-documents/:canvasDocumentId/export
POST   /canvas-documents/:canvasDocumentId/recognize-text
POST   /canvas-documents/:canvasDocumentId/upload-url
```

```ts
type CanvasTemplate =
  | "blank_page"
  | "lined_paper"
  | "storyboard"
  | "mind_map"
  | "essay_plan"
  | "vocabulary_web"
  | "handwriting_practice"
  | "annotate_passage";

interface CanvasPoint {
  x: number;
  y: number;
  pressure?: number;
}

interface CanvasStroke {
  id: string;
  tool: "pen" | "highlighter" | "eraser";
  color: string;
  width: number;
  points: CanvasPoint[];
  createdAt: string;
}

interface CanvasDocumentMetadataResponse {
  id: string;
  studentId: string;
  assignmentId: string | null;
  template: CanvasTemplate;
  title: string;
  strokeCount: number;
  syncStatus: "local_only" | "saving" | "saved" | "sync_failed";
  attachedAt: string | null;
  previewImageUrl: string | null;
  recognizedText: string | null;
  clientVersion: number;
  serverVersion: number;
  storageObjectPath: string | null;
  exportStatus: "not_requested" | "queued" | "ready" | "failed";
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CanvasDocumentResponse extends CanvasDocumentMetadataResponse {
  strokes?: CanvasStroke[];
}

interface UpsertCanvasMetadataRequest {
  title: string;
  template: CanvasTemplate;
  strokeCount: number;
  clientVersion: number;
  storageObjectPath: string;
  previewImageUrl?: string | null;
  updatedAt: string;
}

interface AttachCanvasRequest {
  assignmentId: string;
  clientVersion: number;
}

interface SignedUploadUrlRequest {
  clientVersion: number;
  contentType: "application/json" | "image/png" | "application/pdf";
  fileKind: "stroke-document" | "preview-image" | "export";
  sizeBytes?: number;
}

interface SignedUploadUrlResponse {
  uploadUrl: string;
  objectPath: string;
  expiresAt: string;
  method: "PUT";
  contentType: string;
  requiredHeaders: Record<string, string>;
}

interface CanvasExportRequest {
  clientVersion: number;
  format: "preview_png" | "pdf";
  sourceObjectPath: string;
}

interface CanvasExportResponse {
  canvasDocumentId: string;
  exportId: string;
  format: "preview_png" | "pdf";
  status: "queued" | "ready" | "failed";
  previewImageUrl: string | null;
  generatedAt: string;
}
```

Canvas recognition response:

```json
{
  "canvasDocumentId": "canvas_01",
  "status": "completed",
  "recognizedText": "The student handwritten text appears here.",
  "confidence": 0.84,
  "generatedAt": "2026-06-09T18:10:00.000Z"
}
```

## AI Coach

Current mobile AI coach responses are deterministic mocks guarded by local policy
checks. Framework-neutral backend service scaffolding now exists under
`services/api/src/features/ai/coach/` and shared AI support folders:

- `services/api/src/features/ai/contracts.ts`
- `services/api/src/features/ai/prompts/ai-prompt-builder.service.ts`
- `services/api/src/features/ai/safety/`
- `services/api/src/features/ai/moderation/`
- `services/api/src/features/ai/usage/`
- `services/api/src/features/ai/providers/mock-ai-provider.ts`

The backend scaffold builds bounded grade-aware prompts, checks academic
integrity, runs deterministic input/output moderation placeholders, evaluates
usage limits, and returns mock coaching responses. It does not call an external
model provider yet.

Allowed coaching actions:

```txt
POST /ai/coach/hint
POST /ai/coach/brainstorm
POST /ai/coach/check-sentence
POST /ai/coach/explain-grammar
POST /ai/coach/suggest-vocabulary
POST /ai/coach/revision-question
```

No endpoint may provide "write my essay", "finish for me", "give me the answer",
"generate final draft", or equivalent assignment-completion actions.

```ts
type AiCoachAction =
  | "hint"
  | "brainstorm"
  | "check_sentence"
  | "explain_grammar"
  | "suggest_vocabulary"
  | "revision_question";

interface AiCoachRequest {
  action: AiCoachAction;
  studentId: string;
  studentAssignmentId: string;
  gradeLevel: GradeLevel;
  writingLevel: "getting_started" | "building" | "steady" | "confident";
  draftExcerpt: string;
  selectedText?: string;
  canvasRecognizedText?: string;
  rubricCriteria: AssignmentRubricCriterion[];
  locale: string;
}

interface AiCoachResponse {
  id: string;
  action: AiCoachAction;
  status: "completed" | "safety_blocked";
  safetyFlags: Array<
    | "assignment_completion_request"
    | "full_rewrite_request"
    | "answer_request"
    | "age_inappropriate"
  >;
  title: LocalizedCopy;
  coachingMessage: LocalizedCopy;
  nextStep: LocalizedCopy;
  questionForStudent: LocalizedCopy | null;
  usage: {
    requestsToday: number;
    dailyLimit: number;
  };
  generatedAt: string;
}
```

Coach response example:

```json
{
  "id": "coach_01",
  "action": "hint",
  "status": "completed",
  "safetyFlags": [],
  "title": {
    "key": "aiCoach.hint.title",
    "fallback": "Try one focused hint"
  },
  "coachingMessage": {
    "key": "aiCoach.hint.organization",
    "params": { "skill": "organization" },
    "fallback": "Pick the clearest reason first, then add one detail that proves it."
  },
  "nextStep": {
    "key": "aiCoach.nextStep.addDetail",
    "fallback": "Add one detail in your own words."
  },
  "questionForStudent": {
    "key": "aiCoach.question.bestEvidence",
    "fallback": "Which detail best supports your idea?"
  },
  "usage": { "requestsToday": 2, "dailyLimit": 20 },
  "generatedAt": "2026-06-09T18:11:00.000Z"
}
```

## AI Review And Feedback

The current mobile feedback review feature uses a deterministic local mock
facade. Backend AI review jobs, feedback persistence, and progress sync are
planned here. Framework-neutral backend review service scaffolding now exists in
`services/api/src/features/ai/review/`; it creates review job responses, parses
structured feedback from the mock provider, validates output policy, and returns
one strength, one improvement, one next revision task, rubric scores, grammar
suggestions, and progress-earned metadata.

```txt
POST /ai/review/submissions/:submissionId
GET  /ai/review/submissions/:submissionId/status
GET  /submissions/:submissionId/feedback
POST /submissions/:submissionId/revisions
```

```ts
interface ReviewSubmissionRequest {
  studentId: string;
  gradeLevel: GradeLevel;
  assignmentId: string;
  rubricId: string;
  typedText: string;
  canvasRecognizedText?: string;
  idempotencyKey: string;
}

interface ReviewSubmissionResponse {
  reviewJobId: string;
  feedbackId: string | null;
  status: "queued" | "processing" | "completed" | "failed" | "safety_blocked";
  queuedAt: string;
}

interface FeedbackResponse {
  id: string;
  submissionId: string;
  studentId: string;
  assignmentId: string;
  assignmentTitle: LocalizedCopy;
  submittedTextExcerpt: string;
  summary: {
    strength: LocalizedCopy;
    improvement: LocalizedCopy;
    nextRevisionTask: LocalizedCopy;
  };
  revisionTask: {
    id: string;
    instruction: LocalizedCopy;
    targetSkill: WritingSkill;
    guidingQuestion: LocalizedCopy;
    originalExcerpt: string;
  };
  rubricScores: Array<{
    criterionId: string;
    score: 1 | 2 | 3 | 4;
    maxScore: 4;
    level: "starting" | "building" | "meeting" | "strong";
    coachingNote: LocalizedCopy;
  }>;
  grammarSuggestions: Array<{
    id: string;
    title: LocalizedCopy;
    explanation: LocalizedCopy;
    originalExcerpt: string;
    studentAction: LocalizedCopy;
  }>;
  progressEarned: {
    minutes: number;
    points: number;
    skill: WritingSkill;
  };
  createdAt: string;
}
```

Feedback must include one strength, one improvement, and one next revision task.
It must not include a complete replacement draft.

## Progress

```txt
GET /students/:studentId/progress
GET /students/:studentId/progress/skills/:skillId
GET /students/:studentId/badges
GET /students/:studentId/weekly-review
```

```ts
interface ProgressDashboardResponse {
  studentId: string;
  gradeLevel: GradeLevel;
  gradeBand: GradeBand;
  generatedAt: string;
  connectionStatus: ConnectionStatus;
  totals: {
    assignmentsCompleted: number;
    minutesThisWeek: number;
    weeklyMinutesGoal: number;
    wordsWritten: number;
    revisionsCompleted: number;
    rubricImprovement: number;
    aiFeedbackApplied: number;
    handwritingMinutes: number;
  };
  streak: {
    currentDays: number;
    bestDays: number;
    practicedToday: boolean;
    status: "continued" | "at_risk" | "missed" | "not_started";
  };
  skills: Array<{
    skill: WritingSkill;
    currentScore: number;
    previousScore: number;
    level: 1 | 2 | 3 | 4 | 5;
    label: LocalizedCopy;
  }>;
  badges: BadgeProgress[];
  weeklyReview: WeeklyReviewSummary | null;
  emptyState: EmptyState | null;
}

interface BadgeProgress {
  badgeId: string;
  name: LocalizedCopy;
  description: LocalizedCopy;
  status: "locked" | "in_progress" | "unlocked";
  progressPercent: number;
  unlockedAt: string | null;
}

interface WeeklyReviewSummary {
  weekStart: string;
  weekEnd: string;
  celebration: LocalizedCopy;
  focusForNextWeek: LocalizedCopy;
}
```

## Parents

```txt
GET   /parents/:parentId/dashboard
GET   /parents/:parentId/students
GET   /parents/:parentId/students/:studentId/report
GET   /parents/:parentId/submissions/:submissionId
GET   /parents/:parentId/settings
PATCH /parents/:parentId/settings
```

```ts
interface ParentDashboardResponse {
  parentId: string;
  generatedAt: string;
  connectionStatus: ConnectionStatus;
  students: Array<{
    id: string;
    displayName: string;
    gradeLevel: GradeLevel;
    relationshipLabel: LocalizedCopy;
    weeklyProgress: ParentWeeklyProgress;
  }>;
  emptyState: EmptyState | null;
}

interface ParentWeeklyProgress {
  weekLabel: string;
  minutesCompleted: number;
  minutesGoal: number;
  sessionsCompleted: number;
  completedAssignments: number;
  assignedAssignments: number;
  streakDays: number;
  skillImprovementPercent: number;
  areaToPractice: WritingSkill;
  celebration: LocalizedCopy;
}

interface ParentSettings {
  aiCoachAccess: "hints_and_revision" | "restricted";
  assignmentAlertsEnabled: boolean;
  digestFrequency: "weekly" | "twice_weekly";
  practiceReminderEnabled: boolean;
  quietHoursLabel: string;
  shareWeeklySummaryWithTeacher: boolean;
  weeklyReportEmailEnabled: boolean;
}
```

Parents can view progress, feedback summaries, bounded writing excerpts, canvas
previews, and settings for linked students. They cannot edit a student's writing,
submit assignments, or impersonate a student.

## Teachers

```txt
GET  /teachers/:teacherId/dashboard
GET  /teachers/:teacherId/classes
POST /teachers/:teacherId/classes
GET  /classes/:classId/progress
POST /teachers/:teacherId/assignments
GET  /teachers/:teacherId/assignments
GET  /teachers/:teacherId/submissions
GET  /teachers/:teacherId/submissions/:submissionId
POST /teachers/:teacherId/submissions/:submissionId/comment
```

```ts
interface TeacherDashboardResponse {
  teacherId: string;
  generatedAt: string;
  connectionStatus: ConnectionStatus;
  classes: TeacherClassSummary[];
  submissionsNeedingReview: TeacherSubmissionSummary[];
  emptyState: EmptyState | null;
}

interface TeacherClassSummary {
  id: string;
  name: string;
  gradeLevel: GradeLevel;
  studentCount: number;
  activeAssignmentCount: number;
  submissionsNeedingReview: number;
  averageCompletionPercent: number;
  averageSkillScore: number;
  weeklyWritingMinutes: number;
}

interface CreateTeacherAssignmentRequest {
  title: string;
  prompt: string;
  gradeLevel: GradeLevel;
  classId: string;
  assignmentType: AssignmentType;
  skillFocus: WritingSkill[];
  dueDate: string;
  rubric: Array<{
    label: string;
    description: string;
    maxScore: 4;
  }>;
  allowCanvas: boolean;
}

interface TeacherSubmissionSummary {
  id: string;
  studentId: string;
  studentDisplayName: string;
  assignmentId: string;
  assignmentTitle: string;
  status: StudentAssignmentStatus;
  submittedAt: string | null;
  wordCount: number;
  hasCanvas: boolean;
}

interface TeacherCommentRequest {
  comment: string;
}
```

Teacher-created assignment prompts must be validated for grade level, class
scope, rubric completeness, and academic integrity. Teacher comments are
instructional feedback; they must not replace a student's draft.

## Subscriptions

The current mobile subscription feature uses deterministic local entitlement
mocks. Backend entitlement and provider sync are planned here.

```txt
GET  /me/entitlements
POST /subscriptions/checkout
POST /subscriptions/restore
POST /webhooks/revenuecat
POST /webhooks/stripe
```

```ts
type SubscriptionStatus = "free" | "trial" | "active" | "past_due";

interface EntitlementsResponse {
  userId: string;
  role: UserRole;
  status: SubscriptionStatus;
  canAccessPremium: boolean;
  currentPlanId: "writewise_plus_monthly" | "writewise_plus_yearly" | null;
  renewalLabel: string | null;
  connectionStatus: ConnectionStatus;
  generatedAt: string;
  managementUrl: string | null;
  trustLinks: {
    termsUrl: string;
    privacyUrl: string;
  };
  plans: SubscriptionPlan[];
  features: SubscriptionFeature[];
}

interface SubscriptionPlan {
  id: "writewise_plus_monthly" | "writewise_plus_yearly";
  billingPeriod: "month" | "year";
  priceLabel: string;
  trialDays: number;
  isRecommended: boolean;
}

interface SubscriptionFeature {
  id:
    | "safe_ai_coach"
    | "daily_practice"
    | "extended_progress_history"
    | "family_progress_reports"
    | "teacher_class_insights"
    | "rubric_detail"
    | "canvas_archive";
  includedIn: "free" | "plus";
  supportedRoles: UserRole[];
}

interface CheckoutRequest {
  planId: SubscriptionPlan["id"];
  returnUrl: string;
  idempotencyKey: string;
}

interface CheckoutResponse {
  status: "created";
  checkoutUrl: string;
  expiresAt: string;
}

interface RestoreResponse {
  status: "restored" | "not_found";
  entitlements: EntitlementsResponse;
}
```

Webhook endpoints must verify provider signatures before parsing payloads and
must be idempotent by provider event ID.

## Notifications

The mobile app now stores notification preferences through Supabase RPCs,
schedules local reminders with `expo-notifications`, and attempts to register an
Expo push token with the backend account API when a native build supplies one.
`services/api/src/features/notifications/` contains the framework-neutral
backend delivery service for token registration and Expo push sends. A deployed
API runtime, push credentials, and scheduler/worker are still required for
production remote push delivery.

```txt
GET  /students/:studentId/notification-preferences
PUT  /students/:studentId/notification-preferences
POST /students/:studentId/notifications/register-device
POST /students/:studentId/notifications/unregister-device
GET  /students/:studentId/notifications/prepared
POST /notifications/send-due
POST /notifications/weekly-reports
```

Device tokens must be stored only on the backend, never in public docs or logs.
Store encrypted token ciphertext and a stable token hash in
`notification_devices`; logs should use opaque device IDs or hashes only.

```ts
type NotificationDevicePlatform = "ios" | "android" | "web";

interface NotificationPreferencesRequest {
  enabled: boolean;
  timezone: string;
  dailyAssignment: { enabled: boolean; timeOfDay: string };
  streak: { enabled: boolean; timeOfDay: string };
  incompleteAssignment: { enabled: boolean; timeOfDay: string };
  weeklyReport: {
    enabled: boolean;
    timeOfDay: string;
    weekday: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  };
}

interface RegisterNotificationDeviceRequest {
  expoPushToken: string;
  idempotencyKey?: string;
  platform: NotificationDevicePlatform;
}

interface RegisterNotificationDeviceResponse {
  deviceId: string;
  status: "registered";
}

interface SendDueNotificationsRequest {
  dueBefore: string;
  limit?: number;
}

interface SendDueNotificationsResponse {
  failed: number;
  sent: number;
  skipped: number;
}
```

## Idempotency And Concurrency

- Mutating endpoints that can be retried accept `idempotencyKey`.
- Draft and canvas saves should include a client version or updated timestamp.
- Conflicting writes return `409 conflict.version_mismatch` with the latest
  server version metadata.
- AI review and subscription webhook endpoints are idempotent.

## Mobile Migration Notes

Current mobile mock facades and local persistence remain source-of-truth for the
running app until backend implementation prompts wire them to this service:

- Auth: `apps/mobile/src/core/auth/sessionService.ts`
- Onboarding: `apps/mobile/src/features/onboarding/`
- Assignments: `apps/mobile/src/features/assignments/api/assignmentsApi.ts`
- Writing drafts: `apps/mobile/src/features/writing-workspace/`
- Canvas: `apps/mobile/src/features/canvas/`
- AI coach: `apps/mobile/src/features/ai-coach/api/aiCoachApi.ts`
- Feedback review: `apps/mobile/src/features/feedback-review/api/feedbackreviewApi.ts`
- Progress: `apps/mobile/src/features/progress/api/progressApi.ts`
- Parent: `apps/mobile/src/features/parent/api/parentApi.ts`
- Teacher: `apps/mobile/src/features/teacher/api/teacherApi.ts`
- Subscriptions: `apps/mobile/src/features/subscriptions/api/subscriptionsApi.ts`
