import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { Database } from "../data/types";
import {
  assertPremiumFeatureAccess,
  canAccessPremiumFeature,
} from "../features/subscriptions/entitlement-authorization";
import {
  mapStudentBadgesListApiResponse,
  mapStudentProgressApiResponse,
  mapStudentSkillDetailApiResponse,
  mapWeeklyReviewDetailApiResponse,
} from "../mappers/progress.mapper";
import { authorizeStudentScopeRead, requirePrincipal } from "../runtime/authorization";
import { createResourceNotFoundError } from "../runtime/errors";
import { validateRequestParams, validateRequestQuery } from "../runtime/validation";
import {
  currentWeekRange,
  writingSkillSchema,
} from "./dashboards-shared";

const badgeCatalogLimit = 100;

const studentParamsSchema = z.object({
  studentId: z.string().min(1).max(128),
});

const skillParamsSchema = z.object({
  skillId: writingSkillSchema,
  studentId: z.string().min(1).max(128),
});

const badgesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(badgeCatalogLimit).default(badgeCatalogLimit),
});

export async function registerProgressRoutes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
  database: Database,
): Promise<void> {
  app.get("/students/:studentId/progress", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, studentParamsSchema);
    const profile = await authorizeStudentScopeRead(database, principal, params.studentId);
    const includeExtendedProgress = await canAccessPremiumFeature(
      database,
      principal,
      "extended_progress_history",
    );

    const now = new Date();
    const week = currentWeekRange(now);
    const [totalsRows, skills, badges, studentBadges, weeklyReview, activityDays] = await Promise.all([
      database.listProgressTotalsForStudents([profile.id]),
      database.listSkillProgressForStudents([profile.id]),
      database.listActiveBadges(badgeCatalogLimit),
      database.listStudentBadges(profile.id),
      includeExtendedProgress ? database.getLatestWeeklyReview(profile.id) : Promise.resolve(null),
      database.listActivityDaysForStudents([profile.id], week),
    ]);

    return mapStudentProgressApiResponse({
      activityDays,
      badges,
      generatedAt: now.toISOString(),
      profile,
      skills,
      studentBadges,
      totals: totalsRows[0],
      weeklyReview,
    });
  });

  app.get(
    "/students/:studentId/progress/skills/:skillId",
    { preHandler: authenticate },
    async (request) => {
      const principal = requirePrincipal(request);
      const params = validateRequestParams(request, skillParamsSchema);
      const profile = await authorizeStudentScopeRead(database, principal, params.studentId);
      await assertPremiumFeatureAccess(database, principal, "extended_progress_history");

      const skills = await database.listSkillProgressForStudents([profile.id]);
      const skill = skills.find((record) => record.skill === params.skillId);

      if (!skill) {
        throw createResourceNotFoundError({ skillId: params.skillId, studentId: params.studentId });
      }

      // Recent practice history is computed from student_activity_days rows
      // for the current week that include this skill; the schema keeps no
      // per-skill rollup beyond the score columns.
      const week = currentWeekRange();
      const activityDays = await database.listActivityDaysForStudents([profile.id], week);
      return mapStudentSkillDetailApiResponse({
        activityDays,
        skill,
        skillId: params.skillId,
        studentId: profile.id,
      });
    },
  );

  app.get("/students/:studentId/badges", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, studentParamsSchema);
    const query = validateRequestQuery(request, badgesQuerySchema);
    const profile = await authorizeStudentScopeRead(database, principal, params.studentId);

    const [badges, studentBadges] = await Promise.all([
      database.listActiveBadges(query.limit),
      database.listStudentBadges(profile.id),
    ]);

    return mapStudentBadgesListApiResponse({ badges, studentBadges });
  });

  app.get("/students/:studentId/weekly-review", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, studentParamsSchema);
    const profile = await authorizeStudentScopeRead(database, principal, params.studentId);
    await assertPremiumFeatureAccess(database, principal, "extended_progress_history");

    const weeklyReview = await database.getLatestWeeklyReview(profile.id);

    if (!weeklyReview) {
      throw createResourceNotFoundError({
        reason: "no_weekly_review_yet",
        studentId: params.studentId,
      });
    }

    // The reviewed week's totals are computed from the activity-day rows in
    // the review's bounded date range; the schema stores no weekly rollup.
    const activityDays = await database.listActivityDaysForStudents([profile.id], {
      fromDate: weeklyReview.weekStart,
      toDate: weeklyReview.weekEnd,
    });

    return mapWeeklyReviewDetailApiResponse({
      activityDays,
      studentId: profile.id,
      weeklyReview,
    });
  });
}
