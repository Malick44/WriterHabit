export const aiReviewEndpoints = [
  "POST /api/v1/ai/review/submissions/:submissionId",
  "GET /api/v1/ai/review/submissions/:submissionId/status",
  "GET /api/v1/submissions/:submissionId/feedback",
  "POST /api/v1/submissions/:submissionId/revisions",
] as const;

export type AiReviewEndpoint = (typeof aiReviewEndpoints)[number];

// Framework-neutral placeholder for review jobs, feedback, and progress updates.
export class AiReviewService {}
