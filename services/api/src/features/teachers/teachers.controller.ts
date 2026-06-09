export const teacherEndpoints = [
  "GET /api/v1/teachers/:teacherId/dashboard",
  "GET /api/v1/teachers/:teacherId/classes",
  "POST /api/v1/teachers/:teacherId/classes",
  "GET /api/v1/classes/:classId/progress",
  "POST /api/v1/teachers/:teacherId/assignments",
  "GET /api/v1/teachers/:teacherId/assignments",
  "GET /api/v1/teachers/:teacherId/submissions",
  "GET /api/v1/teachers/:teacherId/submissions/:submissionId",
  "POST /api/v1/teachers/:teacherId/submissions/:submissionId/comment",
] as const;

export type TeacherEndpoint = (typeof teacherEndpoints)[number];

// Framework-neutral placeholder for class, assignment, and submission routes.
export class TeachersController {}
