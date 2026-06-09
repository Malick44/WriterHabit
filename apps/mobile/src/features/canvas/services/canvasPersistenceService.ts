import { localJsonStorage } from "@/services/storage/localJsonStorage";

import {
  MAX_CANVAS_DOCUMENTS,
  canvasDocumentSchema,
  canvasDocumentSummarySchema,
  type CanvasDocument,
  type CanvasDocumentSummary,
} from "../types";
import { getCanvasDocumentSummary, normalizeCanvasDocument } from "./canvasDocumentService";

function getCanvasIndexKey(studentId: string) {
  return `canvas-index.${studentId}`;
}

function getCanvasDocumentKey(studentId: string, canvasId: string) {
  return `canvas-doc.${studentId}.${canvasId}`;
}

async function readIndex(studentId: string): Promise<CanvasDocumentSummary[]> {
  const storedIndex = await localJsonStorage.getItem<unknown[]>(getCanvasIndexKey(studentId), []);
  const parsed = canvasDocumentSummarySchema.array().safeParse(storedIndex);

  if (!parsed.success) {
    return [];
  }

  return parsed.data;
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

    return parsed.success ? parsed.data : null;
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

  async saveDocument(document: CanvasDocument): Promise<CanvasDocument> {
    const nextDocument = normalizeCanvasDocument({
      ...document,
      updatedAt: new Date().toISOString(),
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
