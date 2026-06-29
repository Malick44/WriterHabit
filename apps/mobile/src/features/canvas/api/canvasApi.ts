import type { GradeLevel } from "@WriterHabit/shared";

import {
  canvasDetailResponseSchema,
  canvasListResponseSchema,
  type CanvasDetailResponse,
  type CanvasDocument,
  type CanvasDocumentSummary,
  type CanvasListResponse,
  type CanvasTemplate,
} from "../types";
import { createCanvasDocument, getCanvasDocumentSummary } from "../services/canvasDocumentService";
import { canvasPersistenceService } from "../services/canvasPersistenceService";
import { canvasSyncService, readCanvasScenario } from "../services/canvasSyncService";

interface CanvasRequestInput {
  gradeLevel?: GradeLevel;
  studentId: string;
}

interface CanvasDetailRequestInput extends CanvasRequestInput {
  canvasId: string;
}

interface CreateCanvasInput extends CanvasRequestInput {
  assignmentId?: string;
  template: CanvasTemplate;
}

interface SaveCanvasInput extends CanvasRequestInput {
  document: CanvasDocument;
}

interface AttachCanvasInput extends CanvasDetailRequestInput {
  assignmentId: string;
}

async function saveCanvasDocument(input: SaveCanvasInput): Promise<CanvasDocument> {
  const result = await canvasSyncService.saveLocalFirst(input);

  return result.document;
}

export const canvasApi = {
  async attachCanvasToAssignment(input: AttachCanvasInput): Promise<CanvasDocument> {
    const result = await canvasSyncService.attachCanvasToAssignment(input);

    return result.document;
  },

  async createCanvas(input: CreateCanvasInput): Promise<CanvasDocument> {
    const scenario = readCanvasScenario();
    const document = createCanvasDocument({
      assignmentId: input.assignmentId,
      studentId: input.studentId,
      template: input.template,
    });
    const localDocument = await canvasPersistenceService.saveLocalDocument(document);

    if (scenario === "offline") {
      return localDocument;
    }

    void canvasSyncService
      .saveLocalFirst({
        document: localDocument,
        gradeLevel: input.gradeLevel,
        studentId: input.studentId,
      })
      .catch(() => undefined);

    return localDocument;
  },

  async getAttachedCanvasSummary(input: CanvasRequestInput & { assignmentId: string }): Promise<CanvasDocumentSummary | null> {
    const document = await canvasPersistenceService.getAttachedDocument(input.studentId, input.assignmentId);

    return document ? getCanvasDocumentSummary(document) : null;
  },

  async getCanvas(input: CanvasDetailRequestInput): Promise<CanvasDetailResponse> {
    const response = await canvasSyncService.getCanvas(input);

    return canvasDetailResponseSchema.parse(response);
  },

  async getCanvases(input: CanvasRequestInput): Promise<CanvasListResponse> {
    const response = await canvasSyncService.getCanvases(input);

    return canvasListResponseSchema.parse(response);
  },

  async saveCanvas(input: SaveCanvasInput): Promise<CanvasDocument> {
    return saveCanvasDocument(input);
  },
};
