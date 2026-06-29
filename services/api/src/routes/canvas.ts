import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { CanvasDocumentRecord, Database, StudentProfileRecord } from "../data/types";
import {
  authorizeStudentScopeRead,
  requirePrincipal,
} from "../runtime/authorization";
import { createForbiddenError, createResourceNotFoundError } from "../runtime/errors";
import { validateRequestBody, validateRequestParams } from "../runtime/validation";

const MAX_CANVAS_LIST_LIMIT = 100;

export const implementedCanvasEndpoints: ReadonlySet<string> = new Set([
  "GET /api/v1/students/:studentId/canvas-documents",
  "GET /api/v1/canvas-documents/:canvasDocumentId",
  "PUT /api/v1/canvas-documents/:canvasDocumentId",
  "POST /api/v1/canvas-documents/:canvasDocumentId/attach",
  "POST /api/v1/canvas-documents/:canvasDocumentId/export",
  "POST /api/v1/canvas-documents/:canvasDocumentId/upload-url",
]);

const canvasDocumentParamsSchema = z.object({
  canvasDocumentId: z.string().uuid(),
});

const studentCanvasParamsSchema = z.object({
  studentId: z.string().min(1).max(128),
});

const canvasTemplateSchema = z.enum([
  "blank_page",
  "lined_paper",
  "storyboard",
  "mind_map",
  "essay_plan",
  "vocabulary_web",
  "handwriting_practice",
  "annotate_passage",
]);

const canvasPointSchema = z.object({
  pressure: z.number().min(0).max(1).optional(),
  x: z.number().finite(),
  y: z.number().finite(),
});

const canvasStrokeSchema = z.object({
  color: z.string().min(1).max(64),
  createdAt: z.string().datetime(),
  id: z.string().min(1).max(128),
  opacity: z.number().min(0).max(1).optional(),
  points: z.array(canvasPointSchema).max(32),
  tool: z.enum(["pen", "eraser", "highlighter"]),
  width: z.number().positive().max(32),
});

const upsertCanvasBodySchema = z.strictObject({
  assignmentId: z.string().min(1).max(128).nullable().optional(),
  clientVersion: z.number().int().min(1),
  previewImageUrl: z.string().nullable().optional(),
  storageObjectPath: z.string().min(1).max(512).nullable().optional(),
  strokeCount: z.number().int().min(0).max(500).optional(),
  strokes: z.array(canvasStrokeSchema).max(500).default([]),
  studentId: z.string().min(1).max(128),
  template: canvasTemplateSchema,
  title: z.string().trim().min(1).max(160),
  updatedAt: z.string().datetime().optional(),
});

const attachCanvasBodySchema = z.strictObject({
  assignmentId: z.string().min(1).max(128),
  clientVersion: z.number().int().min(1),
  studentId: z.string().min(1).max(128),
});

const uploadUrlBodySchema = z.strictObject({
  clientVersion: z.number().int().min(1),
  contentType: z.enum(["application/json", "image/png", "application/pdf"]),
  fileKind: z.enum(["stroke-document", "preview-image", "export"]),
  sizeBytes: z.number().int().positive().max(10_000_000).optional(),
});

const exportBodySchema = z.strictObject({
  clientVersion: z.number().int().min(1),
  format: z.enum(["preview_png", "pdf"]),
  sourceObjectPath: z.string().min(1).max(512),
});

function getCanvasObjectPath(input: {
  canvasDocumentId: string;
  clientVersion: number;
  contentType: string;
  fileKind: string;
}) {
  const extension = input.contentType === "image/png" ? "png" : input.contentType === "application/pdf" ? "pdf" : "json";
  return `canvas/${input.canvasDocumentId}/${input.fileKind}/v${input.clientVersion}.${extension}`;
}

function mapCanvasDocument(record: CanvasDocumentRecord) {
  return {
    assignmentId: record.assignmentId,
    attachedAt: record.attachedAt,
    canvasDocumentId: record.id,
    clientVersion: record.clientVersion,
    createdAt: record.createdAt,
    exportStatus: record.exportStatus,
    previewImageUrl: record.previewImagePath,
    recognizedText: record.recognizedText,
    serverVersion: record.serverVersion,
    storageObjectPath: record.objectPath,
    strokeCount: record.strokeCount,
    strokes: record.strokes,
    syncStatus: record.syncStatus,
    template: record.template,
    title: record.title,
    updatedAt: record.updatedAt,
  };
}

function mapCanvasSummary(record: CanvasDocumentRecord) {
  return {
    assignmentId: record.assignmentId,
    canvasDocumentId: record.id,
    clientVersion: record.clientVersion,
    isAttached: Boolean(record.assignmentId),
    previewImageUrl: record.previewImagePath,
    strokeCount: record.strokeCount,
    syncStatus: record.syncStatus,
    template: record.template,
    title: record.title,
    updatedAt: record.updatedAt,
  };
}

async function authorizeStudentCanvasWrite(
  database: Database,
  principalId: string,
  studentId: string,
): Promise<StudentProfileRecord> {
  const profile = await database.getStudentProfileByUserId(principalId);

  if (!profile || (studentId !== principalId && studentId !== profile.id)) {
    throw createForbiddenError({
      code: "authorization.student_scope_denied",
      details: { studentId },
    });
  }

  return profile;
}

async function resolveStudentAssignmentId(input: {
  assignmentId: string | null | undefined;
  database: Database;
  studentProfileId: string;
}): Promise<string | null> {
  if (!input.assignmentId) {
    return null;
  }

  const studentAssignment = await input.database.findStudentAssignmentForStudents(input.assignmentId, [
    input.studentProfileId,
  ]);

  if (!studentAssignment) {
    throw createResourceNotFoundError({ assignmentId: input.assignmentId });
  }

  return studentAssignment.id;
}

export async function registerCanvasRoutes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
  database: Database,
): Promise<void> {
  app.get("/students/:studentId/canvas-documents", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, studentCanvasParamsSchema);
    const profile = await authorizeStudentScopeRead(database, principal, params.studentId);
    const documents = await database.listCanvasDocumentsForStudent(profile.id, MAX_CANVAS_LIST_LIMIT);

    return {
      items: documents.map(mapCanvasSummary),
      nextCursor: null,
    };
  });

  app.get("/canvas-documents/:canvasDocumentId", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, canvasDocumentParamsSchema);
    const document = await database.getCanvasDocumentById(params.canvasDocumentId);

    if (!document) {
      throw createResourceNotFoundError({ canvasDocumentId: params.canvasDocumentId });
    }

    await authorizeStudentScopeRead(database, principal, document.studentProfileId);

    return mapCanvasDocument(document);
  });

  app.put("/canvas-documents/:canvasDocumentId", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);

    if (principal.role !== "student") {
      throw createForbiddenError();
    }

    const params = validateRequestParams(request, canvasDocumentParamsSchema);
    const body = validateRequestBody(request, upsertCanvasBodySchema);
    const profile = await authorizeStudentCanvasWrite(database, principal.id, body.studentId);
    const existing = await database.getCanvasDocumentById(params.canvasDocumentId);

    if (existing && existing.studentProfileId !== profile.id) {
      throw createForbiddenError({
        code: "authorization.student_scope_denied",
        details: { canvasDocumentId: params.canvasDocumentId },
      });
    }

    const studentAssignmentId = await resolveStudentAssignmentId({
      assignmentId: body.assignmentId,
      database,
      studentProfileId: profile.id,
    });
    const document = await database.upsertCanvasDocument({
      assignmentId: body.assignmentId ?? null,
      clientVersion: body.clientVersion,
      id: params.canvasDocumentId,
      objectPath: body.storageObjectPath ?? getCanvasObjectPath({
        canvasDocumentId: params.canvasDocumentId,
        clientVersion: body.clientVersion,
        contentType: "application/json",
        fileKind: "stroke-document",
      }),
      previewImagePath: body.previewImageUrl ?? null,
      studentAssignmentId,
      studentProfileId: profile.id,
      strokes: body.strokes,
      syncStatus: "saved",
      template: body.template,
      title: body.title,
    });

    return mapCanvasDocument(document);
  });

  app.post("/canvas-documents/:canvasDocumentId/attach", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);

    if (principal.role !== "student") {
      throw createForbiddenError();
    }

    const params = validateRequestParams(request, canvasDocumentParamsSchema);
    const body = validateRequestBody(request, attachCanvasBodySchema);
    const profile = await authorizeStudentCanvasWrite(database, principal.id, body.studentId);
    const existing = await database.getCanvasDocumentById(params.canvasDocumentId);

    if (!existing) {
      throw createResourceNotFoundError({ canvasDocumentId: params.canvasDocumentId });
    }

    if (existing.studentProfileId !== profile.id) {
      throw createForbiddenError({
        code: "authorization.student_scope_denied",
        details: { canvasDocumentId: params.canvasDocumentId },
      });
    }

    const studentAssignmentId = await resolveStudentAssignmentId({
      assignmentId: body.assignmentId,
      database,
      studentProfileId: profile.id,
    });
    const document = await database.upsertCanvasDocument({
      assignmentId: body.assignmentId,
      clientVersion: Math.max(body.clientVersion, existing.clientVersion),
      id: existing.id,
      objectPath: existing.objectPath,
      previewImagePath: existing.previewImagePath,
      studentAssignmentId,
      studentProfileId: profile.id,
      strokes: existing.strokes,
      syncStatus: "saved",
      template: existing.template,
      title: existing.title,
    });

    return {
      assignmentId: document.assignmentId,
      attachedAt: document.attachedAt ?? document.updatedAt,
      canvasDocumentId: document.id,
      clientVersion: document.clientVersion,
      syncStatus: "saved",
    };
  });

  app.post("/canvas-documents/:canvasDocumentId/upload-url", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, canvasDocumentParamsSchema);
    const body = validateRequestBody(request, uploadUrlBodySchema);
    const document = await database.getCanvasDocumentById(params.canvasDocumentId);

    if (document) {
      await authorizeStudentScopeRead(database, principal, document.studentProfileId);
    } else if (principal.role !== "student") {
      throw createForbiddenError();
    }

    const objectPath = getCanvasObjectPath({
      canvasDocumentId: params.canvasDocumentId,
      clientVersion: body.clientVersion,
      contentType: body.contentType,
      fileKind: body.fileKind,
    });

    return {
      contentType: body.contentType,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      method: "PUT",
      objectPath,
      requiredHeaders: {
        "content-type": body.contentType,
        "x-WriterHabit-canvas-client-version": String(body.clientVersion),
      },
      uploadUrl: `server-managed://${objectPath}`,
    };
  });

  app.post("/canvas-documents/:canvasDocumentId/export", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const params = validateRequestParams(request, canvasDocumentParamsSchema);
    const body = validateRequestBody(request, exportBodySchema);
    const document = await database.getCanvasDocumentById(params.canvasDocumentId);

    if (!document) {
      throw createResourceNotFoundError({ canvasDocumentId: params.canvasDocumentId });
    }

    await authorizeStudentScopeRead(database, principal, document.studentProfileId);

    return {
      canvasDocumentId: params.canvasDocumentId,
      exportId: `canvas-export-${params.canvasDocumentId}-${body.clientVersion}`,
      format: body.format,
      generatedAt: new Date().toISOString(),
      previewImageUrl: document.previewImagePath,
      status: "queued",
    };
  });
}
