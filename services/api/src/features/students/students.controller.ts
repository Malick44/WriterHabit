export const studentEndpoints = [
  "GET /api/v1/students/:studentId",
  "PATCH /api/v1/students/:studentId",
  "GET /api/v1/students/:studentId/home",
  "GET /api/v1/me/students",
] as const;

export type StudentEndpoint = (typeof studentEndpoints)[number];

// Framework-neutral placeholder for student profile and home read-model routes.
export class StudentsController {}
