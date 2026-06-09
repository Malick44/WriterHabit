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
storage. The current submit path validates non-empty student writing and routes
to `/(student)/review/[submissionId]`; it does not call a backend submission API
yet.

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

```txt
POST /ai/coach/hint
POST /ai/coach/brainstorm
POST /ai/coach/check-sentence
POST /ai/coach/explain-grammar
POST /ai/coach/suggest-vocabulary
POST /ai/coach/revision-question
```

## AI Review

```txt
POST /ai/review/submissions/:submissionId
GET  /ai/review/submissions/:submissionId/status
GET  /submissions/:submissionId/feedback
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
