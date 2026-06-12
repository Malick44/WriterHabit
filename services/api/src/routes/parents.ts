import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { Database, ParentLinkedStudentRecord } from "../data/types";
import {
  authorizeOwnedParentScope,
  authorizeParentLinkedStudentRead,
  requirePrincipal,
} from "../runtime/authorization";
import { validateRequestParams, validateRequestQuery } from "../runtime/validation";
import { localizedCopy } from "./writing-shared";
import {
  computeWeeklyProgress,
  currentWeekRange,
  emptyProgressTotals,
  gradeBandFor,
  mapProgressTotals,
  mapSkillProgress,
  mapStreak,
  mapWeeklyReviewSummary,
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

function mapLinkedStudent(record: ParentLinkedStudentRecord) {
  return {
    displayName: record.displayName,
    gradeLevel: record.gradeLevel,
    id: record.studentProfileId,
    relationshipLabel: localizedCopy(
      `parents.relationship.${record.relationshipLabel}`,
      record.relationshipLabel,
    ),
  };
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

    const students = linkedStudents.map((record, index) => {
      const totals =
        totalsRows.find((row) => row.studentProfileId === record.studentProfileId) ??
        emptyProgressTotals(record.studentProfileId);

      return {
        ...mapLinkedStudent(record),
        weeklyProgress: computeWeeklyProgress({
          activityDays: activityDays.filter(
            (day) => day.studentProfileId === record.studentProfileId,
          ),
          assignedAssignments: assignedCounts[index] ?? 0,
          skills: skillRows.filter((row) => row.studentProfileId === record.studentProfileId),
          totals,
          week,
        }),
      };
    });

    return {
      connectionStatus: "online",
      emptyState:
        students.length > 0
          ? null
          : {
              body: {
                fallback: "Link a student account to see weekly writing progress here.",
                key: "parents.dashboard.emptyState.body",
              },
              title: { fallback: "No linked students yet", key: "parents.dashboard.emptyState.title" },
            },
      generatedAt: new Date().toISOString(),
      parentId: principal.id,
      students,
    };
  });

  app.get("/parents/:parentId/students", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, parentParamsSchema);
    const query = validateRequestQuery(request, studentsQuerySchema);
    authorizeOwnedParentScope(principal, params.parentId);

    const linkedStudents = await database.listParentLinkedStudents(principal.id, query.limit);

    return {
      items: linkedStudents.map((record) => ({
        ...mapLinkedStudent(record),
        gradeBand: gradeBandFor(record.gradeLevel),
      })),
      // Cursor pagination is not implemented yet; responses are capped at the
      // first `limit` active links.
      nextCursor: null,
    };
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

      const now = new Date();
      const totals = totalsRows[0] ?? emptyProgressTotals(profile.id);

      return {
        generatedAt: now.toISOString(),
        gradeBand: gradeBandFor(profile.gradeLevel),
        gradeLevel: profile.gradeLevel,
        skills: skills.map((record) => mapSkillProgress(record)),
        streak: mapStreak(totals, now.toISOString().slice(0, 10)),
        studentId: profile.id,
        totals: mapProgressTotals(totals),
        weeklyProgress: computeWeeklyProgress({
          activityDays,
          assignedAssignments,
          skills,
          totals,
          week,
        }),
        weeklyReview: weeklyReview ? mapWeeklyReviewSummary(weeklyReview) : null,
      };
    },
  );
}
