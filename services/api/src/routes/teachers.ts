import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type {
  ClassRecord,
  Database,
  SubmissionStatus,
} from "../data/types";
import {
  authorizeOwnedClassRead,
  authorizeOwnedTeacherScope,
  authorizeSubmissionRead,
  requirePrincipal,
} from "../runtime/authorization";
import { assertPremiumFeatureAccess } from "../features/subscriptions/entitlement-authorization";
import { validateRequestParams, validateRequestQuery } from "../runtime/validation";
import {
  mapTeacherClassSummaryApiResponse,
  mapTeacherClassesListApiResponse,
  mapTeacherClassProgressApiResponse,
  mapTeacherDashboardApiResponse,
  mapTeacherQueueApiResponse,
} from "../mappers/teachers.mapper";
import { mapSubmissionResponse } from "../mappers/writing-loop.mapper";
import { currentWeekRange } from "./dashboards-shared";
import { type IsoDateRange } from "../mappers/dashboards.mapper";

const maxClasses = 50;
const dashboardClassLimit = 20;
const classRosterLimit = 100;
const maxQueueItems = 50;
const dashboardQueueLimit = 20;

/** Submission states a teacher still needs to act on. */
const reviewQueueStatuses: readonly SubmissionStatus[] = ["submitted", "reviewing"];

const teacherParamsSchema = z.object({
  teacherId: z.string().min(1).max(128),
});

const teacherSubmissionParamsSchema = z.object({
  submissionId: z.string().min(1).max(128),
  teacherId: z.string().min(1).max(128),
});

const classParamsSchema = z.object({
  classId: z.string().min(1).max(128),
});

const classesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(maxClasses).default(maxClasses),
});

const queueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(maxQueueItems).default(maxQueueItems),
  status: z
    .enum(["submitted", "reviewing", "feedback_ready", "revision_in_progress", "completed"])
    .optional(),
});

/**
 * Per-class dashboard numbers, computed from bounded queries because the
 * schema keeps no class-level rollups: counts come from class-scoped
 * student_assignments/assignments, skill and weekly-minute averages from the
 * roster's student_skill_progress and student_activity_days rows.
 */
async function buildClassSummary(database: Database, classRecord: ClassRecord, week: IsoDateRange) {
  const roster = await database.listClassStudents(classRecord.id, classRosterLimit);
  const rosterIds = roster.map((student) => student.studentProfileId);

  const [activeAssignmentCount, needsReview, totalAssigned, completed, skillRows, activityDays] =
    await Promise.all([
      database.countClassActiveAssignments(classRecord.id),
      database.countClassStudentAssignments(classRecord.id, ["submitted", "reviewing"]),
      database.countClassStudentAssignments(classRecord.id),
      database.countClassStudentAssignments(classRecord.id, ["completed"]),
      database.listSkillProgressForStudents(rosterIds),
      database.listActivityDaysForStudents(rosterIds, week),
    ]);

  return mapTeacherClassSummaryApiResponse({
    activeAssignmentCount,
    activityDays,
    classRecord,
    completedAssignments: completed,
    needsReview,
    rosterSize: roster.length,
    skillRows,
    totalAssigned,
  });
}

export async function registerTeacherRoutes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
  database: Database,
): Promise<void> {
  app.get("/teachers/:teacherId/dashboard", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, teacherParamsSchema);
    const teacherProfile = await authorizeOwnedTeacherScope(database, principal, params.teacherId);

    const week = currentWeekRange();
    const classes = await database.listTeacherClasses(teacherProfile.id, dashboardClassLimit);
    const [classSummaries, queue] = await Promise.all([
      Promise.all(classes.map((classRecord) => buildClassSummary(database, classRecord, week))),
      database.listSubmissionQueueForClasses(
        classes.map((classRecord) => classRecord.id),
        { limit: dashboardQueueLimit, statuses: reviewQueueStatuses },
      ),
    ]);

    return mapTeacherDashboardApiResponse({
      classes: classSummaries,
      generatedAt: new Date().toISOString(),
      queue,
      teacherId: teacherProfile.id,
    });
  });

  app.get("/teachers/:teacherId/classes", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, teacherParamsSchema);
    const query = validateRequestQuery(request, classesQuerySchema);
    const teacherProfile = await authorizeOwnedTeacherScope(database, principal, params.teacherId);

    const week = currentWeekRange();
    const classes = await database.listTeacherClasses(teacherProfile.id, query.limit);
    const items = await Promise.all(
      classes.map((classRecord) => buildClassSummary(database, classRecord, week)),
    );

    return mapTeacherClassesListApiResponse(items);
  });

  app.get("/classes/:classId/progress", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, classParamsSchema);
    const { classRecord } = await authorizeOwnedClassRead(database, principal, params.classId);
    await assertPremiumFeatureAccess(database, principal, "teacher_class_insights");

    const week = currentWeekRange();
    const roster = await database.listClassStudents(classRecord.id, classRosterLimit);
    const rosterIds = roster.map((student) => student.studentProfileId);
    const [totalsRows, skillRows, activityDays] = await Promise.all([
      database.listProgressTotalsForStudents(rosterIds),
      database.listSkillProgressForStudents(rosterIds),
      database.listActivityDaysForStudents(rosterIds, week),
    ]);

    return mapTeacherClassProgressApiResponse({
      activityDays,
      classRecord,
      generatedAt: new Date().toISOString(),
      roster,
      skillRows,
      totalsRows,
      weekLabel: `${week.fromDate} - ${week.toDate}`,
    });
  });

  app.get("/teachers/:teacherId/submissions", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, teacherParamsSchema);
    const query = validateRequestQuery(request, queueQuerySchema);
    const teacherProfile = await authorizeOwnedTeacherScope(database, principal, params.teacherId);

    const classes = await database.listTeacherClasses(teacherProfile.id, maxClasses);
    const queue = await database.listSubmissionQueueForClasses(
      classes.map((classRecord) => classRecord.id),
      {
        limit: query.limit,
        statuses: query.status ? [query.status] : reviewQueueStatuses,
      },
    );

    return mapTeacherQueueApiResponse(queue);
  });

  app.get(
    "/teachers/:teacherId/submissions/:submissionId",
    { preHandler: authenticate },
    async (request) => {
      const principal = requirePrincipal(request);
      const params = validateRequestParams(request, teacherSubmissionParamsSchema);
      await authorizeOwnedTeacherScope(database, principal, params.teacherId);

      // Teacher read access is the enrolled-class scope already enforced by
      // the shared submission read rule; the response stays excerpt-bounded.
      const submission = await authorizeSubmissionRead(database, principal, params.submissionId);

      return mapSubmissionResponse(submission);
    },
  );
}
