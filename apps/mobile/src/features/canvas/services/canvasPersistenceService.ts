import { z } from "zod";

import { localJsonStorage } from "@/services/storage/localJsonStorage";

import {
  MAX_CANVAS_DOCUMENTS,
  canvasDocumentSchema,
  canvasDocumentSummarySchema,
  canvasPointSchema,
  canvasStrokeSchema,
  type CanvasDocument,
  type CanvasDocumentSummary,
} from "../types";
import { getCanvasDocumentSummary, normalizeCanvasDocument } from "./canvasDocumentService";

const recoverableCanvasStrokeSchema = canvasStrokeSchema.extend({
  points: z.array(canvasPointSchema),
});

const recoverableCanvasDocumentSchema = canvasDocumentSchema.extend({
  strokes: z.array(recoverableCanvasStrokeSchema),
});

function getCanvasIndexKey(studentId: string) {
  return `canvas-index.${studentId}`;
}

function getCanvasDocumentKey(studentId: string, canvasId: string) {
  return `canvas-doc.${studentId}.${canvasId}`;
}

async function readIndex(studentId: string): Promise<CanvasDocumentSummary[]> {
  const storedIndex = await localJsonStorage.getItem<unknown>(getCanvasIndexKey(studentId), []);

  if (!Array.isArray(storedIndex)) {
    return [];
  }

  return storedIndex.flatMap((summary) => {
    const parsedSummary = canvasDocumentSummarySchema.safeParse(summary);

    return parsedSummary.success ? [parsedSummary.data] : [];
  });
}

async function writeIndex(studentId: string, summaries: CanvasDocumentSummary[]) {
  const sorted = [...summaries].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const nextIndex = sorted.slice(0, MAX_CANVAS_DOCUMENTS);
  const pruned = sorted.slice(MAX_CANVAS_DOCUMENTS);

  await localJsonStorage.setItem(getCanvasIndexKey(studentId), nextIndex);

  await Promise.all(pruned.map((summary) => localJsonStorage.removeItem(getCanvasDocumentKey(studentId, summary.id))));
}

export const canvasPersistenceService = {
  async getDocument(studentId: string, canvasId: string): Promise<CanvasDocument | null> {
    const storedDocument = await localJsonStorage.getItem<unknown>(getCanvasDocumentKey(studentId, canvasId), null);
    const parsed = canvasDocumentSchema.safeParse(storedDocument);

    if (parsed.success) {
      return parsed.data;
    }

    const recoverable = recoverableCanvasDocumentSchema.safeParse(storedDocument);

    if (!recoverable.success || recoverable.data.studentId !== studentId || recoverable.data.id !== canvasId) {
      return null;
    }

    return normalizeCanvasDocument(recoverable.data);
  },

  async getDocuments(studentId: string): Promise<CanvasDocumentSummary[]> {
    return readIndex(studentId);
  },

  async getAttachedDocument(studentId: string, assignmentId: string): Promise<CanvasDocument | null> {
    const summaries = await readIndex(studentId);
    const attachedSummary = summaries.find((summary) => summary.assignmentId === assignmentId);

    if (!attachedSummary) {
      return null;
    }

    return this.getDocument(studentId, attachedSummary.id);
  },

  async removeDocument(studentId: string, canvasId: string): Promise<void> {
    const summaries = await readIndex(studentId);

    await localJsonStorage.removeItem(getCanvasDocumentKey(studentId, canvasId));
    await writeIndex(
      studentId,
      summaries.filter((summary) => summary.id !== canvasId),
    );
  },

  async saveDocument(
    document: CanvasDocument,
    options: { touchUpdatedAt?: boolean } = {},
  ): Promise<CanvasDocument> {
    const nextDocument = normalizeCanvasDocument({
      ...document,
      updatedAt: options.touchUpdatedAt === false ? document.updatedAt : new Date().toISOString(),
    });
    const summaries = await readIndex(nextDocument.studentId);
    const nextSummary = getCanvasDocumentSummary(nextDocument);

    await localJsonStorage.setItem(getCanvasDocumentKey(nextDocument.studentId, nextDocument.id), nextDocument);
    await writeIndex(nextDocument.studentId, [
      nextSummary,
      ...summaries.filter((summary) => summary.id !== nextDocument.id),
    ]);

    return nextDocument;
  },
};
