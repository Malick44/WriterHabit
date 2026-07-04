import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { Database } from "../data/types";
import {
  authorizeOwnedStudentAssignment,
  authorizeOwnedSubmission,
  authorizeSubmissionRead,
  requirePrincipal,
} from "../runtime/authorization";
import { ApiHttpError, createResourceNotFoundError } from "../runtime/errors";
import { validateRequestBody, validateRequestParams } from "../runtime/validation";
import {
  computeTextStats,
  toExcerpt,
} from "./writing-shared";
import {
  mapDraftResponse,
  mapRevisionListApiResponse,
  mapRevisionResponse,
  mapSubmissionResponse,
} from "../mappers/writing-loop.mapper";
import {
  assertAssignmentTransition,
  assertSubmissionTransition,
} from "../features/workflows/writing-workflow-state-machine";

const studentAssignmentParamsSchema = z.object({
  studentAssignmentId: z.string().min(1).max(128),
});

const submissionParamsSchema = z.object({
  submissionId: z.string().min(1).max(128),
});

const saveDraftBodySchema = z.strictObject({
  autosaveVersion: z.number().int().min(1),
  canvasDocumentIds: z.array(z.string().min(1).max(128)).max(20).default([]),
  // Optional so autosave clients that don't manage rubric state can omit it
  // without clobbering saved checkmarks.
  rubricChecks: z.record(z.string(), z.boolean()).optional(),
  text: z.string().max(20_000),
});

const createSubmissionBodySchema = z.strictObject({
  canvasDocumentIds: z.array(z.string().min(1).max(128)).max(20).default([]),
  clientDraftVersion: z.number().int().min(1),
  idempotencyKey: z.string().min(1).max(128),
  typedText: z.string().max(40_000),
});

const createRevisionBodySchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(128),
  revisedExcerpt: z.string().max(4000),
  revisionTaskId: z.string().min(1).max(128),
});

async function assertCanvasDocumentsBelongToStudentAssignment(input: {
  assignmentId: string;
  canvasDocumentIds: string[];
  database: Database;
  studentProfileId: string;
}): Promise<void> {
  if (input.canvasDocumentIds.length === 0) {
    return;
  }

  const uniqueCanvasDocumentIds = [...new Set(input.canvasDocumentIds)];
  const documents = await input.database.listCanvasDocumentsByIds(uniqueCanvasDocumentIds);
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const missingCanvasDocumentIds = uniqueCanvasDocumentIds.filter((id) => !documentsById.has(id));
  const invalidCanvasDocumentIds = uniqueCanvasDocumentIds.filter((id) => {
    const document = documentsById.get(id);

    return (
      !document ||
      document.studentProfileId !== input.studentProfileId ||
      (document.assignmentId !== null && document.assignmentId !== input.assignmentId)
    );
  });

  if (missingCanvasDocumentIds.length > 0 || invalidCanvasDocumentIds.length > 0) {
    throw new ApiHttpError({
      code: "validation.invalid_canvas_attachment",
      details: {
        invalidCanvasDocumentIds,
        missingCanvasDocumentIds,
      },
    });
  }
}

export async function registerSubmissionRoutes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
  database: Database,
): Promise<void> {
  app.get("/student-assignments/:studentAssignmentId/draft", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, studentAssignmentParamsSchema);
    await authorizeOwnedStudentAssignment(database, principal, params.studentAssignmentId);

    const draft = await database.getDraftByStudentAssignmentId(params.studentAssignmentId);

    if (!draft) {
      throw createResourceNotFoundError({ studentAssignmentId: params.studentAssignmentId });
    }

    return mapDraftResponse(draft);
  });

  app.put("/student-assignments/:studentAssignmentId/draft", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, studentAssignmentParamsSchema);
    const body = validateRequestBody(request, saveDraftBodySchema);
    const { profile, studentAssignment } = await authorizeOwnedStudentAssignment(
      database,
      principal,
      params.studentAssignmentId,
    );

    const existing = await database.getDraftByStudentAssignmentId(params.studentAssignmentId);

    if (existing && body.autosaveVersion < existing.autosaveVersion) {
      throw new ApiHttpError({
        code: "conflict.version_mismatch",
        details: {
          currentAutosaveVersion: existing.autosaveVersion,
          requestedAutosaveVersion: body.autosaveVersion,
        },
      });
    }

    await assertCanvasDocumentsBelongToStudentAssignment({
      assignmentId: studentAssignment.assignmentId,
      canvasDocumentIds: body.canvasDocumentIds,
      database,
      studentProfileId: profile.id,
    });

    const stats = computeTextStats(body.text);
    const draft = await database.saveDraft({
      autosaveVersion: body.autosaveVersion,
      canvasDocumentIds: body.canvasDocumentIds,
      paragraphCount: stats.paragraphCount,
      revisionNumber: existing?.revisionNumber ?? 1,
      rubricChecks: body.rubricChecks ?? existing?.rubricChecks ?? {},
      sentenceCount: stats.sentenceCount,
      studentAssignmentId: studentAssignment.id,
      studentProfileId: profile.id,
      textContent: body.text,
      textPreview: stats.preview,
      wordCount: stats.wordCount,
    });

    if (studentAssignment.status === "not_started") {
      await database.updateStudentAssignment(studentAssignment.id, {
        startedAt: new Date().toISOString(),
        status: "in_progress",
      });
    } else if (studentAssignment.status === "feedback_ready") {
      await database.updateStudentAssignment(studentAssignment.id, {
        status: "revision_in_progress",
      });
    }

    return mapDraftResponse(draft);
  });

  app.delete(
    "/student-assignments/:studentAssignmentId/draft",
    { preHandler: authenticate },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const params = validateRequestParams(request, studentAssignmentParamsSchema);
      await authorizeOwnedStudentAssignment(database, principal, params.studentAssignmentId);
      await database.deleteDraft(params.studentAssignmentId);

      return reply.code(204).send();
    },
  );

  app.post(
    "/student-assignments/:studentAssignmentId/submissions",
    { preHandler: authenticate },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const params = validateRequestParams(request, studentAssignmentParamsSchema);
      const body = validateRequestBody(request, createSubmissionBodySchema);
      const { profile, studentAssignment } = await authorizeOwnedStudentAssignment(
        database,
        principal,
        params.studentAssignmentId,
      );

      const typedText = body.typedText;

      if (typedText.trim().length === 0) {
        throw new ApiHttpError({
          code: "validation.empty_submission",
          details: { studentAssignmentId: studentAssignment.id },
        });
      }

      // Idempotent retry: the same key with the same contents returns the
      // already-created submission instead of replaying the transition.
      const existing = await database.findSubmissionByIdempotencyKey(
        studentAssignment.id,
        body.idempotencyKey,
      );

      if (existing) {
        const existingText = await database.getSubmissionContent(existing.id);

        if (existingText === typedText) {
          return reply.code(200).send(mapSubmissionResponse(existing));
        }

        throw new ApiHttpError({
          code: "conflict.duplicate_idempotency_key",
          details: { idempotencyKey: body.idempotencyKey },
        });
      }

      assertAssignmentTransition(studentAssignment.status, "submit_work");

      await assertCanvasDocumentsBelongToStudentAssignment({
        assignmentId: studentAssignment.assignmentId,
        canvasDocumentIds: body.canvasDocumentIds,
        database,
        studentProfileId: profile.id,
      });

      const stats = computeTextStats(typedText);
      const revisionNumber = (await database.getMaxSubmissionRevisionNumber(studentAssignment.id)) + 1;
      const submission = await database.createSubmission({
        canvasDocumentIds: body.canvasDocumentIds,
        idempotencyKey: body.idempotencyKey,
        paragraphCount: stats.paragraphCount,
        revisionNumber,
        sentenceCount: stats.sentenceCount,
        studentAssignmentId: studentAssignment.id,
        studentProfileId: profile.id,
        typedText,
        typedTextExcerpt: toExcerpt(typedText),
        wordCount: stats.wordCount,
      });

      return reply.code(201).send(mapSubmissionResponse(submission));
    },
  );

  app.get("/submissions/:submissionId", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, submissionParamsSchema);
    const submission = await authorizeSubmissionRead(database, principal, params.submissionId);

    return mapSubmissionResponse(submission);
  });

  app.get("/submissions/:submissionId/revisions", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, submissionParamsSchema);
    const submission = await authorizeSubmissionRead(database, principal, params.submissionId);
    const revisions = await database.listSubmissionRevisions(submission.id);

    return mapRevisionListApiResponse(revisions);
  });

  app.post("/submissions/:submissionId/revisions", { preHandler: authenticate }, async (request, reply) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, submissionParamsSchema);
    const body = validateRequestBody(request, createRevisionBodySchema);
    const submission = await authorizeOwnedSubmission(database, principal, params.submissionId);

    if (body.revisedExcerpt.trim().length === 0) {
      throw new ApiHttpError({
        code: "validation.empty_submission",
        details: { submissionId: submission.id },
      });
    }

    // Revisions are unique per (submission, idempotency key), mirroring the
    // submission_revisions unique index: a retry with identical content is
    // answered with the stored revision, anything else conflicts.
    const existing = await database.findSubmissionRevisionByIdempotencyKey(
      submission.id,
      body.idempotencyKey,
    );

    if (existing) {
      if (
        existing.revisedExcerpt === body.revisedExcerpt &&
        existing.revisionTaskId === body.revisionTaskId
      ) {
        return reply.code(200).send(mapRevisionResponse(existing));
      }

      throw new ApiHttpError({
        code: "conflict.duplicate_idempotency_key",
        details: { idempotencyKey: body.idempotencyKey },
      });
    }

    const feedback = await database.getFeedbackBySubmissionId(submission.id);

    if (!feedback || !feedback.revisionTask) {
      throw new ApiHttpError({
        code: "conflict.status_transition_invalid",
        details: {
          currentStatus: submission.status,
          requestedTransition: "complete_revision",
          resource: "submission",
          reason: "feedback_not_ready",
        },
      });
    }

    if (feedback.revisionTask.id !== body.revisionTaskId) {
      throw new ApiHttpError({
        code: "conflict.status_transition_invalid",
        details: {
          requestedRevisionTaskId: body.revisionTaskId,
          resource: "revision_task",
          reason: "revision_task_mismatch",
        },
      });
    }

    const studentAssignment = await database.getStudentAssignmentById(submission.studentAssignmentId);

    if (!studentAssignment) {
      throw createResourceNotFoundError({ studentAssignmentId: submission.studentAssignmentId });
    }

    assertSubmissionTransition(submission.status, "complete_revision");
    assertAssignmentTransition(studentAssignment.status, "complete_revision");

    const revision = await database.createSubmissionRevision({
      idempotencyKey: body.idempotencyKey,
      revisedExcerpt: body.revisedExcerpt,
      revisionTaskId: body.revisionTaskId,
      studentProfileId: submission.studentProfileId,
      submissionId: submission.id,
    });

    return reply.code(201).send(mapRevisionResponse(revision));
  });
}
