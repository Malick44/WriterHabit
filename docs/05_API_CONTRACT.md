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
`apps/mobile/src/features/assignments/api/assignmentsApi.ts`.

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

## Parent

```txt
GET  /parents/:parentId/dashboard
GET  /parents/:parentId/students
GET  /parents/:parentId/students/:studentId/report
GET  /parents/:parentId/submissions/:submissionId
POST /parents/:parentId/submissions/:submissionId/comment
```

## Teacher

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
