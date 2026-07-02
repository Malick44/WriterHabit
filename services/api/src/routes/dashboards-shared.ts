import { z } from "zod";

/**
 * Read-only dashboard endpoints implemented by registerProgressRoutes,
 * registerParentRoutes, and registerTeacherRoutes. When a Database is
 * configured these are removed from the fail-closed placeholder
 * registrations; without a Database they keep returning 501 feature.disabled.
 */
export const dashboardImplementedEndpoints: ReadonlySet<string> = new Set([
  "GET /api/v1/students/:studentId/progress",
  "GET /api/v1/students/:studentId/progress/skills/:skillId",
  "GET /api/v1/students/:studentId/badges",
  "GET /api/v1/students/:studentId/weekly-review",
  "GET /api/v1/parents/:parentId/dashboard",
  "GET /api/v1/parents/:parentId/students",
  "GET /api/v1/parents/:parentId/students/:studentId/report",
  "GET /api/v1/teachers/:teacherId/dashboard",
  "GET /api/v1/teachers/:teacherId/classes",
  "GET /api/v1/classes/:classId/progress",
  "GET /api/v1/teachers/:teacherId/submissions",
  "GET /api/v1/teachers/:teacherId/submissions/:submissionId",
]);

export const writingSkills = [
  "spelling",
  "grammar",
  "punctuation",
  "sentence_structure",
  "vocabulary",
  "organization",
  "creativity",
  "clarity",
  "evidence_usage",
  "argument_strength",
  "revision_quality",
  "handwriting",
  "reading_response",
] as const;

export const writingSkillSchema = z.enum(writingSkills);

export interface IsoDateRange {
  fromDate: string;
  toDate: string;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Monday-to-Sunday UTC week containing `now`, as inclusive ISO dates. Used to
 * bound weekly aggregations over student_activity_days.
 */
export function currentWeekRange(now: Date = new Date()): IsoDateRange {
  const daysSinceMonday = (now.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return { fromDate: toIsoDate(monday), toDate: toIsoDate(sunday) };
}
