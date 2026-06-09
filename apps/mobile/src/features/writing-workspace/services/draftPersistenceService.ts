import { localJsonStorage } from "@/services/storage/localJsonStorage";

import {
  MAX_DRAFT_TEXT_LENGTH,
  writingDraftSchema,
  type WritingCanvasAttachment,
  type WritingDraft,
} from "../types";

function getDraftKey(studentId: string, assignmentId: string): string {
  return `writing-draft.${studentId}.${assignmentId}`;
}

export function normalizeDraftText(text: string): string {
  return text.length > MAX_DRAFT_TEXT_LENGTH ? text.slice(0, MAX_DRAFT_TEXT_LENGTH) : text;
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
      return fallbackDraft;
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
