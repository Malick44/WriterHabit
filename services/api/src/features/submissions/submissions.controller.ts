export const submissionEndpoints = [
  "GET /api/v1/student-assignments/:studentAssignmentId/draft",
  "PUT /api/v1/student-assignments/:studentAssignmentId/draft",
  "DELETE /api/v1/student-assignments/:studentAssignmentId/draft",
  "POST /api/v1/student-assignments/:studentAssignmentId/submissions",
  "GET /api/v1/submissions/:submissionId",
  "POST /api/v1/submissions/:submissionId/revisions",
  "GET /api/v1/submissions/:submissionId/revisions",
] as const;

export type SubmissionEndpoint = (typeof submissionEndpoints)[number];

// Framework-neutral placeholder for draft, submission, and revision routes.
export class SubmissionsController {}
