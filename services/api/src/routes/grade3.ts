import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { Database } from "../data/types";
import { authorizeOwnedStudentScope, requirePrincipal } from "../runtime/authorization";
import { ApiHttpError, createResourceNotFoundError } from "../runtime/errors";
import { validateRequestBody, validateRequestParams } from "../runtime/validation";

const completeDayParamsSchema = z.object({
  day: z.coerce.number().int().min(1).max(30),
  studentId: z.string().min(1).max(128),
});

const completeDayBodySchema = z.strictObject({
  estimatedMinutes: z.number().int().min(1).max(60).default(15),
});

/**
 * Grade 3 Writing Adventure day completion.
 *
 * Drafts autosave straight to Supabase from the client (owner-only RLS), but
 * completion is a server-owned workflow: it feeds the parent/teacher-visible
 * streak in student_progress_totals, so the server re-validates the day and
 * runs the writerhabit_complete_grade3_day_workflow transaction. Replays are
 * idempotent — a completed day is acknowledged without double-counting.
 */
export async function registerGrade3Routes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
  database: Database,
): Promise<void> {
  app.post(
    "/students/:studentId/grade3-days/:day/complete",
    { preHandler: authenticate },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const params = validateRequestParams(request, completeDayParamsSchema);
      const body = validateRequestBody(request, completeDayBodySchema);
      const profile = await authorizeOwnedStudentScope(database, principal, params.studentId);

      const progress = await database.getGrade3Progress(profile.id, params.day);

      if (!progress) {
        throw createResourceNotFoundError({
          day: params.day,
          reason: "grade3_day_not_started",
        });
      }

      if (progress.draft.trim().length === 0) {
        throw new ApiHttpError({
          code: "validation.empty_submission",
          details: { day: params.day },
        });
      }

      const result = await database.completeGrade3Day({
        day: params.day,
        minutes: body.estimatedMinutes,
        studentProfileId: profile.id,
      });

      return reply.code(result.alreadyCompleted ? 200 : 201).send({
        alreadyCompleted: result.alreadyCompleted,
        completed: result.completed,
        completedAt: result.completedAt,
        day: result.day,
        studentId: profile.id,
      });
    },
  );
}
