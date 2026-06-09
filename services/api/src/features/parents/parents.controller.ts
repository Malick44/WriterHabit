export const parentEndpoints = [
  "GET /api/v1/parents/:parentId/dashboard",
  "GET /api/v1/parents/:parentId/students",
  "GET /api/v1/parents/:parentId/students/:studentId/report",
  "GET /api/v1/parents/:parentId/submissions/:submissionId",
  "GET /api/v1/parents/:parentId/settings",
  "PATCH /api/v1/parents/:parentId/settings",
] as const;

export type ParentEndpoint = (typeof parentEndpoints)[number];

// Framework-neutral placeholder for linked-student reporting and parent settings.
export class ParentsController {}
