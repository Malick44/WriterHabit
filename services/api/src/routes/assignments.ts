import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { Database } from "../data/types";
import {
  authorizeStudentScopeRead,
  listVisibleStudentProfileIds,
  requirePrincipal,
} from "../runtime/authorization";
import { createForbiddenError, createResourceNotFoundError } from "../runtime/errors";
import { validateRequestParams, validateRequestQuery } from "../runtime/validation";
import { getNextAssignmentStatusOnStart } from "../features/workflows/writing-workflow-state-machine";
import {
  mapDailySelection,
  mapDraftSummary,
  mapInstructions,
  mapStudentAssignmentSummary,
  studentAssignmentStatusSchema,
} from "./writing-shared";

const defaultListLimit = 50;

const studentParamsSchema = z.object({
  studentId: z.string().min(1).max(128),
});

const assignmentParamsSchema = z.object({
  assignmentId: z.string().min(1).max(128),
});

const studentAssignmentActionParamsSchema = z.object({
  assignmentId: z.string().min(1).max(128),
  studentId: z.string().min(1).max(128),
});

const listQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(defaultListLimit).default(defaultListLimit),
  status: studentAssignmentStatusSchema.optional(),
  type: z.string().min(1).max(64).optional(),
});

export async function registerAssignmentRoutes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
  database: Database,
): Promise<void> {
  app.get("/students/:studentId/assignments", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, studentParamsSchema);
    const query = validateRequestQuery(request, listQuerySchema);
    const profile = await authorizeStudentScopeRead(database, principal, params.studentId);

    const records = await database.listStudentAssignments(profile.id, {
      ...(query.type ? { assignmentType: query.type } : {}),
      limit: query.limit,
      orderBy: "createdAt",
      ...(query.status ? { statuses: [query.status] } : {}),
    });

    return {
      items: records.map((record) => mapStudentAssignmentSummary(record)),
      // Cursor pagination is not implemented yet; responses are capped at the
      // newest `limit` student assignments.
      nextCursor: null,
    };
  });

  app.get("/students/:studentId/daily-assignment", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, studentParamsSchema);
    const profile = await authorizeStudentScopeRead(database, principal, params.studentId);

    // Daily pick simplification: no server-side selection engine exists yet,
    // so today's assignment is the most recently updated assigned or
    // in-progress student assignment. The selection block carries the
    // `most_recent_active_assignment` reason code unless richer metadata was
    // stored in daily_selection_metadata.
    const [record] = await database.listStudentAssignments(profile.id, {
      limit: 1,
      orderBy: "updatedAt",
      statuses: ["not_started", "in_progress"],
    });

    if (!record) {
      throw createResourceNotFoundError({
        reason: "no_active_student_assignment",
        studentId: params.studentId,
      });
    }

    return {
      ...mapStudentAssignmentSummary(record),
      selection: mapDailySelection(record.dailySelectionMetadata, record.assignment.difficulty),
    };
  });

  app.get("/assignments/:assignmentId", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, assignmentParamsSchema);
    const visibleStudentProfileIds = await listVisibleStudentProfileIds(database, principal);
    const record = await database.findStudentAssignmentForStudents(
      params.assignmentId,
      visibleStudentProfileIds,
    );

    if (!record) {
      // 404 instead of 403 so this endpoint does not leak whether an
      // assignment exists outside the caller's student scope.
      throw createResourceNotFoundError({ assignmentId: params.assignmentId });
    }

    const rubric = await database.listRubricCriteria(record.assignment.rubricId);
    // Full draft summaries are student-owned; parents and teachers get the
    // assignment detail without draft contents.
    const draft =
      principal.role === "student" ? await database.getDraftByStudentAssignmentId(record.id) : null;

    return {
      ...mapStudentAssignmentSummary(record),
      draft: draft ? mapDraftSummary(draft) : null,
      instructions: mapInstructions(record.assignment.instructions),
      rubric: rubric.map((criterion) => ({
        description: { fallback: criterion.descriptionFallback, key: criterion.descriptionKey },
        id: criterion.id,
        label: { fallback: criterion.labelFallback, key: criterion.labelKey },
        maxScore: criterion.maxScore,
        skill: criterion.skill,
      })),
      teacherNote:
        record.teacherNoteKey && record.teacherNoteFallback
          ? { fallback: record.teacherNoteFallback, key: record.teacherNoteKey }
          : null,
    };
  });

  app.post("/students/:studentId/assignments/:assignmentId/start", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, studentAssignmentActionParamsSchema);

    if (principal.role !== "student") {
      throw createForbiddenError({ details: params });
    }

    const profile = await authorizeStudentScopeRead(database, principal, params.studentId);
    const record = await database.findStudentAssignmentForStudents(params.assignmentId, [profile.id]);

    if (!record) {
      throw createResourceNotFoundError({ assignmentId: params.assignmentId, studentId: params.studentId });
    }

    const nextStatus = getNextAssignmentStatusOnStart(record.status);
    const startedAt = record.startedAt ?? new Date().toISOString();

    await database.updateStudentAssignment(record.id, {
      ...(nextStatus !== record.status ? { status: nextStatus } : {}),
      ...(record.startedAt ? {} : { startedAt }),
    });

    const updated = await database.getStudentAssignmentById(record.id);

    if (!updated) {
      throw createResourceNotFoundError({ studentAssignmentId: record.id });
    }

    return {
      ...mapStudentAssignmentSummary(updated),
      startedAt,
    };
  });
}
