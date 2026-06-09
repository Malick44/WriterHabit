# 05 — API Contract

Base path:

```txt
/api/v1
```

## Auth

These are planned backend API contracts. The current mobile auth/session implementation uses the public Supabase client in `apps/mobile/src/core/supabase/supabaseClient.ts` and `apps/mobile/src/core/auth/sessionService.ts`.

```txt
POST /auth/sign-up
POST /auth/sign-in
POST /auth/sign-out
GET  /auth/session
```

## Onboarding

```txt
GET  /students/:studentId/onboarding
POST /students/:studentId/onboarding
POST /students/:studentId/personalized-plan
```

## Assignments

These are planned backend API contracts. The current mobile assignment feature
uses deterministic mock data in
`apps/mobile/src/features/assignments/api/assignmentsApi.ts`. The current daily
assignment is selected through
`apps/mobile/src/features/assignments/services/dailyAssignmentService.ts`, which
uses grade, goals, weak skills, history, daily minutes, repeat avoidance,
inactivity, and gradual difficulty adjustment.

```txt
GET  /students/:studentId/daily-assignment
GET  /students/:studentId/assignments
GET  /assignments/:assignmentId
POST /students/:studentId/assignments/:assignmentId/start
POST /students/:studentId/assignments/:assignmentId/submit
```

## Writing Drafts

These are planned backend API contracts. The current mobile typed writing
workspace uses local device persistence in
`apps/mobile/src/features/writing-workspace/services/draftPersistenceService.ts`
through `apps/mobile/src/services/storage/localJsonStorage.ts`. Local drafts are
Zod-validated, autosaved, restored per student and assignment, and capped before
storage. The current submit path validates non-empty student writing, saves the
draft locally, and routes to `/(student)/review/[submissionId]`; feedback review
then uses a deterministic local mock facade rather than a backend submission API.

```txt
GET    /student-assignments/:studentAssignmentId/draft
PUT    /student-assignments/:studentAssignmentId/draft
DELETE /student-assignments/:studentAssignmentId/draft
```

## Canvas

These are planned backend API contracts. The current mobile canvas feature uses
local device persistence through
`apps/mobile/src/features/canvas/services/canvasPersistenceService.ts` and the
shared `localJsonStorage` facade. Canvas documents are Zod-validated,
autosaved, capped for memory safety, and attach to assignments locally. The
current implementation does not upload preview images, PDFs, or recognized text.

```txt
GET    /students/:studentId/canvas-documents
POST   /students/:studentId/canvas-documents
GET    /canvas-documents/:canvasDocumentId
PUT    /canvas-documents/:canvasDocumentId
DELETE /canvas-documents/:canvasDocumentId
POST   /canvas-documents/:canvasDocumentId/attach
POST   /canvas-documents/:canvasDocumentId/export
POST   /canvas-documents/:canvasDocumentId/recognize-text
```

## AI Coach

These are planned backend API contracts. The current mobile AI coach feature
uses a deterministic local mock facade in
`apps/mobile/src/features/ai-coach/api/aiCoachApi.ts`. Requests are built by
`apps/mobile/src/features/ai-coach/services/aiCoachContextService.ts`, validated
with Zod, guarded by
`apps/mobile/src/features/ai-coach/services/aiCoachPolicyService.ts`, and
rendered through the workspace coach drawer. No model keys, service-role keys,
or backend AI calls are present in the mobile app.

```txt
POST /ai/coach/hint
POST /ai/coach/brainstorm
POST /ai/coach/check-sentence
POST /ai/coach/explain-grammar
POST /ai/coach/suggest-vocabulary
POST /ai/coach/revision-question
```

## AI Review

These are planned backend API contracts. The current mobile feedback review
feature uses a deterministic local mock facade in
`apps/mobile/src/features/feedback-review/api/feedbackreviewApi.ts`. It reads
assignment mock data and locally saved draft text, returns bounded excerpts,
validates responses with Zod from
`apps/mobile/src/features/feedback-review/types.ts`, and renders loading,
processing, empty, error, offline, success, revision, and completion states. No
model credentials, service-role keys, or backend AI calls are present in the
mobile app.

```txt
POST /ai/review/submissions/:submissionId
GET  /ai/review/submissions/:submissionId/status
GET  /submissions/:submissionId/feedback
POST /submissions/:submissionId/revisions
```

## Progress

```txt
GET /students/:studentId/progress
GET /students/:studentId/progress/skills/:skillId
GET /students/:studentId/badges
GET /students/:studentId/weekly-review
```

Current mobile implementation:

- Local facade: `apps/mobile/src/features/progress/api/progressApi.ts`
- Zod contracts: `apps/mobile/src/features/progress/types.ts`
- View model: `apps/mobile/src/features/progress/services/progressViewModel.ts`
- Streak logic: `apps/mobile/src/features/progress/services/streakService.ts`
- Badge unlock logic: `apps/mobile/src/features/progress/services/badgeUnlockService.ts`

The local facade returns deterministic mock progress data for assignments
completed, streak inputs, weekly minutes, words written, revisions, rubric
improvement, AI feedback applied, handwriting time, skill progress, badges, and
weekly review. Backend persistence and authorization for these endpoints remain
future work.

## Notifications

These are planned backend/provider contracts. The current mobile implementation
does not add `expo-notifications`, does not request notification permissions,
does not register APNs/FCM tokens, and does not call a push provider.

```txt
GET  /students/:studentId/notification-preferences
PUT  /students/:studentId/notification-preferences
POST /students/:studentId/notifications/register-device
POST /students/:studentId/notifications/unregister-device
GET  /students/:studentId/notifications/prepared
POST /notifications/weekly-reports
```

Current mobile implementation:

- Notification preparation: `apps/mobile/src/core/notifications/notificationService.ts`
- Local preferences: `apps/mobile/src/features/profile-settings/services/notificationPreferencesService.ts`
- Daily assignment selector: `apps/mobile/src/features/assignments/services/dailyAssignmentService.ts`
- Streak continuation inputs: `apps/mobile/src/features/progress/services/streakService.ts`

Prepared notification types are `daily_assignment`, `streak`,
`incomplete_assignment`, and `weekly_report`. Payloads contain localization keys,
params, a local wall-clock schedule string, and route target metadata only.
Backend scheduling, device registration, provider delivery, token storage, and
parent/teacher weekly report generation remain future work.

## Parent

Current mobile facade:

```ts
parentApi.getDashboard({ parentId, selectedStudentId })
parentApi.getStudentReport({ parentId, studentId })
parentApi.getAssignmentReview({ parentId, submissionId })
parentApi.getSettings({ parentId })
parentApi.updateSettings({ parentId, settings })
```

These methods live in `apps/mobile/src/features/parent/api/parentApi.ts` and
currently return deterministic Zod-validated mock data for success, empty,
error, and offline scenarios.

Planned backend endpoints:

```txt
GET  /parents/:parentId/dashboard
GET  /parents/:parentId/students
GET  /parents/:parentId/students/:studentId/report
GET  /parents/:parentId/submissions/:submissionId
GET  /parents/:parentId/settings
PATCH /parents/:parentId/settings
```

## Teacher

Current mobile facade:

```ts
teacherApi.getDashboard({ teacherId })
teacherApi.getAssignments({ teacherId })
teacherApi.createAssignment({ teacherId, title, prompt, gradeLevel, classId, skillFocus, dueDate, rubric, allowCanvas })
teacherApi.getClassProgress({ teacherId, classId })
teacherApi.getSubmissions({ teacherId })
teacherApi.getSubmissionReview({ teacherId, submissionId })
teacherApi.updateSubmissionComment({ teacherId, submissionId, comment })
```

These methods live in `apps/mobile/src/features/teacher/api/teacherApi.ts` and
currently return deterministic Zod-validated mock data for success, empty,
error, and offline scenarios. The assignment creation form validates title,
prompt, grade, class, skill focus, due date, rubric criteria, and canvas
attachment settings before calling the local facade.

Planned backend endpoints:

```txt
GET  /teachers/:teacherId/dashboard
GET  /teachers/:teacherId/classes
POST /teachers/:teacherId/classes
GET  /classes/:classId/progress
POST /teachers/:teacherId/assignments
GET  /teachers/:teacherId/submissions
GET  /teachers/:teacherId/submissions/:submissionId
POST /teachers/:teacherId/submissions/:submissionId/comment
```

## Subscriptions

```txt
GET  /me/entitlements
POST /subscriptions/checkout
POST /subscriptions/restore
POST /webhooks/revenuecat
POST /webhooks/stripe
```

Current mobile subscription mock behavior lives in `apps/mobile/src/features/subscriptions/api/subscriptionsApi.ts` and is validated by `apps/mobile/src/features/subscriptions/types.ts`.
Local scenarios can be exercised with `EXPO_PUBLIC_WRITEWISE_SUBSCRIPTION_SCENARIO=success|premium|trial|past_due|empty|error|offline`.

```ts
interface SubscriptionApiResponse {
  userId: string;
  role: "student" | "parent" | "teacher" | "admin";
  status: "free" | "trial" | "active" | "past_due";
  canAccessPremium: boolean;
  currentPlanId: "writewise_plus_monthly" | "writewise_plus_yearly" | null;
  renewalLabel: string | null;
  connectionStatus: "online" | "offline_cached";
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
  supportedRoles: Array<"student" | "parent" | "teacher" | "admin">;
}
```

The local checkout action activates a mock trial entitlement in memory; it does not charge an account. The local restore action returns `restored` only when the mock scenario or current session already has `trial` or `active` status; otherwise it returns `not_found`.

## Error Response Shape

```ts
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId: string;
}
```

## Standard Pagination Shape

```ts
interface Page<T> {
  items: T[];
  nextCursor?: string;
}
```

## AI Review Request

```ts
interface ReviewSubmissionRequest {
  submissionId: string;
  studentId: string;
  gradeLevel: number;
  assignmentId: string;
  typedText: string;
  canvasRecognizedText?: string;
  rubricId: string;
}
```

## AI Review Response

```ts
interface ReviewSubmissionResponse {
  feedbackId: string;
  status: "queued" | "processing" | "completed" | "failed";
}
```

## Current Mobile AI Review Mock Response

```ts
interface FeedbackReviewResponse {
  studentId: string;
  gradeLevel: number;
  generatedAt: string;
  connectionStatus: "online" | "offline_cached";
  status: "processing" | "completed" | "missing";
  review: FeedbackReview | null;
}

interface FeedbackReview {
  id: string;
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  submittedTextExcerpt: string;
  summary: {
    strength: string;
    improvement: string;
    nextRevisionTask: string;
  };
  revisionTask: {
    instruction: string;
    originalExcerpt: string;
    targetSkill: string;
    guidingQuestion: string;
  };
  rubricScores: Array<{
    criterionId: string;
    score: number;
    maxScore: 4;
    level: "starting" | "building" | "meeting" | "strong";
    coachingNote: string;
  }>;
  grammarSuggestions: Array<{
    title: string;
    explanation: string;
    studentAction: string;
    originalExcerpt: string;
  }>;
  progressEarned: {
    minutes: number;
    points: number;
    skill: string;
  };
}
```

Current mock scenarios can be selected with
`EXPO_PUBLIC_WRITEWISE_FEEDBACK_REVIEW_SCENARIO`:

- `success`
- `processing`
- `empty`
- `error`
- `offline`
