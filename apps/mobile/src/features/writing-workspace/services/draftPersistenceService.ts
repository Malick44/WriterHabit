import { localJsonStorage } from "@/services/storage/localJsonStorage";

import {
  MAX_DRAFT_TEXT_LENGTH,
  writingCanvasAttachmentSchema,
  writingDraftSchema,
  type WritingCanvasAttachment,
  type WritingDraft,
} from "../types";

function getDraftKey(studentId: string, assignmentId: string): string {
  return `writing-draft.${studentId}.${assignmentId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function normalizeDraftText(text: string): string {
  return text.length > MAX_DRAFT_TEXT_LENGTH ? text.slice(0, MAX_DRAFT_TEXT_LENGTH) : text;
}

function recoverStoredDraft(storedDraft: unknown, fallbackDraft: WritingDraft): WritingDraft | null {
  if (!isRecord(storedDraft)) {
    return null;
  }

  if (storedDraft.assignmentId !== fallbackDraft.assignmentId || storedDraft.studentId !== fallbackDraft.studentId) {
    return null;
  }

  const parsedAttachment = writingCanvasAttachmentSchema.nullable().safeParse(storedDraft.canvasAttachment);
  const recovered = writingDraftSchema.safeParse({
    ...fallbackDraft,
    canvasAttachment: parsedAttachment.success ? parsedAttachment.data : fallbackDraft.canvasAttachment,
    createdAt: isIsoTimestamp(storedDraft.createdAt) ? storedDraft.createdAt : fallbackDraft.createdAt,
    revisionNumber:
      typeof storedDraft.revisionNumber === "number" && Number.isInteger(storedDraft.revisionNumber)
        ? Math.max(0, storedDraft.revisionNumber)
        : fallbackDraft.revisionNumber,
    text: normalizeDraftText(typeof storedDraft.text === "string" ? storedDraft.text : fallbackDraft.text),
    updatedAt: isIsoTimestamp(storedDraft.updatedAt) ? storedDraft.updatedAt : fallbackDraft.updatedAt,
  });

  return recovered.success ? recovered.data : null;
}

export function createWritingDraft(input: {
  assignmentId: string;
  canvasAttachment: WritingCanvasAttachment | null;
  revisionNumber?: number;
  seedText?: string;
  studentId: string;
  timestamp?: string;
}): WritingDraft {
  const timestamp = input.timestamp ?? new Date().toISOString();

  return writingDraftSchema.parse({
    assignmentId: input.assignmentId,
    canvasAttachment: input.canvasAttachment,
    createdAt: timestamp,
    revisionNumber: input.revisionNumber ?? 0,
    studentId: input.studentId,
    text: normalizeDraftText(input.seedText ?? ""),
    updatedAt: timestamp,
  });
}

export const draftPersistenceService = {
  async getDraft(fallbackDraft: WritingDraft): Promise<WritingDraft> {
    const storedDraft = await localJsonStorage.getItem<unknown>(
      getDraftKey(fallbackDraft.studentId, fallbackDraft.assignmentId),
      null,
    );
    const parsed = writingDraftSchema.safeParse(storedDraft);

    if (!parsed.success) {
      return recoverStoredDraft(storedDraft, fallbackDraft) ?? fallbackDraft;
    }

    return parsed.data;
  },

  async saveDraft(draft: WritingDraft): Promise<WritingDraft> {
    const nextDraft = writingDraftSchema.parse({
      ...draft,
      text: normalizeDraftText(draft.text),
      updatedAt: new Date().toISOString(),
    });

    await localJsonStorage.setItem(getDraftKey(nextDraft.studentId, nextDraft.assignmentId), nextDraft);

    return nextDraft;
  },

  async removeDraft(studentId: string, assignmentId: string): Promise<void> {
    await localJsonStorage.removeItem(getDraftKey(studentId, assignmentId));
  },
};
