import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { Database } from "../data/types";
import {
  assertPremiumFeatureAccess,
  canAccessPremiumFeature,
} from "../features/subscriptions/entitlement-authorization";
import { authorizeStudentScopeRead, requirePrincipal } from "../runtime/authorization";
import { createResourceNotFoundError } from "../runtime/errors";
import { validateRequestParams, validateRequestQuery } from "../runtime/validation";
import {
  currentWeekRange,
  emptyProgressTotals,
  gradeBandFor,
  mapBadgeProgress,
  mapProgressTotals,
  mapSkillProgress,
  mapStreak,
  mapWeeklyReviewSummary,
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

    const [totalsRows, skills, badges, studentBadges, weeklyReview] = await Promise.all([
      database.listProgressTotalsForStudents([profile.id]),
      database.listSkillProgressForStudents([profile.id]),
      database.listActiveBadges(badgeCatalogLimit),
      database.listStudentBadges(profile.id),
      includeExtendedProgress ? database.getLatestWeeklyReview(profile.id) : Promise.resolve(null),
    ]);

    const now = new Date();
    const totals = totalsRows[0] ?? emptyProgressTotals(profile.id);
    const hasAnyProgress = totalsRows.length > 0 || skills.length > 0;

    return {
      badges: mapBadgeProgress(badges, studentBadges),
      connectionStatus: "online",
      emptyState: hasAnyProgress
        ? null
        : {
            body: {
              fallback: "Progress shows up here after the first writing session.",
              key: "progress.emptyState.body",
            },
            title: { fallback: "No writing activity yet", key: "progress.emptyState.title" },
          },
      generatedAt: now.toISOString(),
      gradeBand: gradeBandFor(profile.gradeLevel),
      gradeLevel: profile.gradeLevel,
      skills: skills.map((record) => mapSkillProgress(record)),
      streak: mapStreak(totals, now.toISOString().slice(0, 10)),
      studentId: profile.id,
      totals: mapProgressTotals(totals),
      weeklyReview: weeklyReview ? mapWeeklyReviewSummary(weeklyReview) : null,
    };
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
      const recentActivity = activityDays
        .filter((day) => day.practicedSkills.includes(params.skillId))
        .map((day) => ({
          date: day.activityDate,
          minutesPracticed: day.minutesPracticed,
          wordsWritten: day.wordsWritten,
        }));

      return {
        ...mapSkillProgress(skill),
        recentActivity,
        studentId: profile.id,
        updatedAt: skill.updatedAt,
      };
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

    return {
      items: mapBadgeProgress(badges, studentBadges),
      // Cursor pagination is not implemented yet; responses are capped at the
      // first `limit` active badges.
      nextCursor: null,
    };
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

    return {
      ...mapWeeklyReviewSummary(weeklyReview),
      studentId: profile.id,
      totals: {
        assignmentsCompleted: activityDays.reduce((sum, day) => sum + day.assignmentsCompleted, 0),
        minutesPracticed: activityDays.reduce((sum, day) => sum + day.minutesPracticed, 0),
        revisionsCompleted: activityDays.reduce((sum, day) => sum + day.revisionsCompleted, 0),
        wordsWritten: activityDays.reduce((sum, day) => sum + day.wordsWritten, 0),
      },
    };
  });
}
