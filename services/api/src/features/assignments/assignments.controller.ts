export const assignmentEndpoints = [
  "GET /api/v1/students/:studentId/daily-assignment",
  "GET /api/v1/students/:studentId/assignments",
  "GET /api/v1/assignments/:assignmentId",
  "POST /api/v1/students/:studentId/assignments/:assignmentId/start",
  "POST /api/v1/students/:studentId/assignments/:assignmentId/submit",
] as const;

export type AssignmentEndpoint = (typeof assignmentEndpoints)[number];

// Framework-neutral placeholder for a future controller adapter.
export class AssignmentsController {
  // Owns daily assignment selection and student assignment lifecycle endpoints.
}
