import { localJsonStorage } from "@/services/storage/localJsonStorage";

import {
  MAX_FEEDBACK_REVISION_TEXT_LENGTH,
  feedbackRevisionDraftSchema,
  type FeedbackRevisionDraft,
} from "../types";

function getRevisionDraftKey(studentId: string, submissionId: string): string {
  return `feedback-revision.${studentId}.${submissionId}`;
}

function clampRevisionText(text: string): string {
  return text.length > MAX_FEEDBACK_REVISION_TEXT_LENGTH
    ? text.slice(0, MAX_FEEDBACK_REVISION_TEXT_LENGTH)
    : text;
}

export const revisionPersistenceService = {
  async getRevisionDraft(input: {
    studentId: string;
    submissionId: string;
  }): Promise<FeedbackRevisionDraft | null> {
    const storedDraft = await localJsonStorage.getItem<unknown>(
      getRevisionDraftKey(input.studentId, input.submissionId),
      null,
    );
    const parsed = feedbackRevisionDraftSchema.safeParse(storedDraft);

    return parsed.success ? parsed.data : null;
  },

  async removeRevisionDraft(input: {
    studentId: string;
    submissionId: string;
  }): Promise<void> {
    await localJsonStorage.removeItem(getRevisionDraftKey(input.studentId, input.submissionId));
  },

  async saveRevisionDraft(input: {
    revisedText: string;
    studentId: string;
    submissionId: string;
  }): Promise<FeedbackRevisionDraft> {
    const nextDraft = feedbackRevisionDraftSchema.parse({
      revisedText: clampRevisionText(input.revisedText),
      studentId: input.studentId,
      submissionId: input.submissionId,
      updatedAt: new Date().toISOString(),
    });

    await localJsonStorage.setItem(getRevisionDraftKey(input.studentId, input.submissionId), nextDraft);

    return nextDraft;
  },
};
