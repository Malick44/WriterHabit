export const progressEndpoints = [
  "GET /api/v1/students/:studentId/progress",
  "GET /api/v1/students/:studentId/progress/skills/:skillId",
  "GET /api/v1/students/:studentId/badges",
  "GET /api/v1/students/:studentId/weekly-review",
] as const;

export type ProgressEndpoint = (typeof progressEndpoints)[number];

// Framework-neutral placeholder for progress dashboard and badge routes.
export class ProgressController {}
