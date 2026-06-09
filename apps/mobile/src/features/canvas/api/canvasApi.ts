import type { GradeLevel } from "@writewise/shared";

import {
  canvasDetailResponseSchema,
  canvasListResponseSchema,
  canvasScenarioSchema,
  type CanvasDetailResponse,
  type CanvasDocument,
  type CanvasDocumentSummary,
  type CanvasListResponse,
  type CanvasScenario,
  type CanvasTemplate,
} from "../types";
import {
  attachCanvasToAssignment,
  createCanvasDocument,
  getCanvasDocumentSummary,
} from "../services/canvasDocumentService";
import { canvasPersistenceService } from "../services/canvasPersistenceService";

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

function readScenario(): CanvasScenario {
  const parsed = canvasScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WRITEWISE_CANVAS_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

function getConnectionStatus(scenario: CanvasScenario) {
  return scenario === "offline" ? "offline_cached" : "online";
}

function getNextSyncStatus(scenario: CanvasScenario) {
  if (scenario === "sync_failed") {
    return "sync_failed" as const;
  }

  if (scenario === "offline") {
    return "local_only" as const;
  }

  return "saved" as const;
}

async function saveCanvasDocument(input: SaveCanvasInput): Promise<CanvasDocument> {
  const scenario = readScenario();

  return canvasPersistenceService.saveDocument({
    ...input.document,
    syncStatus: getNextSyncStatus(scenario),
  });
}

export const canvasApi = {
  async attachCanvasToAssignment(input: AttachCanvasInput): Promise<CanvasDocument> {
    const document = await canvasPersistenceService.getDocument(input.studentId, input.canvasId);

    if (!document) {
      throw new Error("Canvas document not found");
    }

    return saveCanvasDocument({
      ...input,
      document: attachCanvasToAssignment(document, input.assignmentId),
    });
  },

  async createCanvas(input: CreateCanvasInput): Promise<CanvasDocument> {
    const scenario = readScenario();
    const document = createCanvasDocument({
      assignmentId: input.assignmentId,
      studentId: input.studentId,
      template: input.template,
    });

    return canvasPersistenceService.saveDocument({
      ...document,
      syncStatus: getNextSyncStatus(scenario),
    });
  },

  async getAttachedCanvasSummary(input: CanvasRequestInput & { assignmentId: string }): Promise<CanvasDocumentSummary | null> {
    const document = await canvasPersistenceService.getAttachedDocument(input.studentId, input.assignmentId);

    return document ? getCanvasDocumentSummary(document) : null;
  },

  async getCanvas(input: CanvasDetailRequestInput): Promise<CanvasDetailResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Canvas detail mock error");
    }

    const document = await canvasPersistenceService.getDocument(input.studentId, input.canvasId);

    return canvasDetailResponseSchema.parse({
      connectionStatus: getConnectionStatus(scenario),
      document,
      generatedAt: new Date().toISOString(),
      studentId: input.studentId,
    });
  },

  async getCanvases(input: CanvasRequestInput): Promise<CanvasListResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Canvas list mock error");
    }

    const documents = scenario === "empty" ? [] : await canvasPersistenceService.getDocuments(input.studentId);

    return canvasListResponseSchema.parse({
      connectionStatus: getConnectionStatus(scenario),
      documents,
      generatedAt: new Date().toISOString(),
      studentId: input.studentId,
    });
  },

  async saveCanvas(input: SaveCanvasInput): Promise<CanvasDocument> {
    return saveCanvasDocument(input);
  },
};
