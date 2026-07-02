import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { Database, StudentActivityDayRecord, StudentSkillProgressRecord } from "../data/types";
import {
  authorizeOwnedParentScope,
  authorizeParentLinkedStudentRead,
  requirePrincipal,
} from "../runtime/authorization";
import { validateRequestParams, validateRequestQuery } from "../runtime/validation";
import {
  mapParentDashboardApiResponse,
  mapParentLinkedStudentsListApiResponse,
  mapParentStudentReportApiResponse,
} from "../mappers/parents.mapper";
import {
  currentWeekRange,
} from "./dashboards-shared";
import { assertPremiumFeatureAccess } from "../features/subscriptions/entitlement-authorization";

const maxLinkedStudents = 50;
const dashboardStudentLimit = 20;

const parentParamsSchema = z.object({
  parentId: z.string().min(1).max(128),
});

const parentStudentParamsSchema = z.object({
  parentId: z.string().min(1).max(128),
  studentId: z.string().min(1).max(128),
});

const studentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(maxLinkedStudents).default(maxLinkedStudents),
});

function groupByStudentProfileId<RecordType extends StudentActivityDayRecord | StudentSkillProgressRecord>(
  records: readonly RecordType[],
): Map<string, RecordType[]> {
  const byStudentId = new Map<string, RecordType[]>();

  for (const record of records) {
    const existing = byStudentId.get(record.studentProfileId) ?? [];
    existing.push(record);
    byStudentId.set(record.studentProfileId, existing);
  }

  return byStudentId;
}

export async function registerParentRoutes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
  database: Database,
): Promise<void> {
  app.get("/parents/:parentId/dashboard", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, parentParamsSchema);
    authorizeOwnedParentScope(principal, params.parentId);

    const linkedStudents = await database.listParentLinkedStudents(
      principal.id,
      dashboardStudentLimit,
    );
    const studentProfileIds = linkedStudents.map((record) => record.studentProfileId);
    const week = currentWeekRange();

    const [totalsRows, skillRows, activityDays, assignedCounts] = await Promise.all([
      database.listProgressTotalsForStudents(studentProfileIds),
      database.listSkillProgressForStudents(studentProfileIds),
      database.listActivityDaysForStudents(studentProfileIds, week),
      Promise.all(studentProfileIds.map((id) => database.countStudentAssignments(id))),
    ]);

    return mapParentDashboardApiResponse({
      activityDaysByStudentId: groupByStudentProfileId(activityDays),
      assignedCountsByStudentId: new Map(
        studentProfileIds.map((studentProfileId, index) => [studentProfileId, assignedCounts[index] ?? 0]),
      ),
      generatedAt: new Date().toISOString(),
      parentId: principal.id,
      skillRowsByStudentId: groupByStudentProfileId(skillRows),
      students: linkedStudents,
      totalsByStudentId: new Map(totalsRows.map((row) => [row.studentProfileId, row])),
      week,
    });
  });

  app.get("/parents/:parentId/students", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, parentParamsSchema);
    const query = validateRequestQuery(request, studentsQuerySchema);
    authorizeOwnedParentScope(principal, params.parentId);

    const linkedStudents = await database.listParentLinkedStudents(principal.id, query.limit);

    return mapParentLinkedStudentsListApiResponse(linkedStudents);
  });

  app.get(
    "/parents/:parentId/students/:studentId/report",
    { preHandler: authenticate },
    async (request) => {
      const principal = requirePrincipal(request);
      const params = validateRequestParams(request, parentStudentParamsSchema);
      const profile = await authorizeParentLinkedStudentRead(
        database,
        principal,
        params.parentId,
        params.studentId,
      );
      await assertPremiumFeatureAccess(database, principal, "family_progress_reports");

      const week = currentWeekRange();
      const [totalsRows, skills, activityDays, assignedAssignments, weeklyReview] =
        await Promise.all([
          database.listProgressTotalsForStudents([profile.id]),
          database.listSkillProgressForStudents([profile.id]),
          database.listActivityDaysForStudents([profile.id], week),
          database.countStudentAssignments(profile.id),
          database.getLatestWeeklyReview(profile.id),
        ]);

      return mapParentStudentReportApiResponse({
        activityDays,
        assignedAssignments,
        generatedAt: new Date().toISOString(),
        skills,
        studentProfile: profile,
        totals: totalsRows[0],
        weeklyReview,
        week,
      });
    },
  );
}
