import type { GradeLevel } from "@WriterHabit/shared";

import { assignmentsApi, type AssignmentRecord } from "@/features/assignments";
import { canvasApi } from "@/features/canvas";

import {
  writingSubmissionResponseSchema,
  writingWorkspaceResponseSchema,
  type WritingCanvasAttachment,
  type WritingDraft,
  type WritingSubmissionResponse,
  type WritingWorkspaceResponse,
} from "../types";
import { createWritingDraft, draftPersistenceService } from "../services/draftPersistenceService";
import { getWritingValidation } from "../services/writingMetricsService";

interface WorkspaceRequestInput {
  assignmentId: string;
  gradeLevel?: GradeLevel;
  studentId: string;
}

interface SaveDraftInput extends WorkspaceRequestInput {
  draft: WritingDraft;
}

interface SubmitDraftInput extends WorkspaceRequestInput {
  draft: WritingDraft;
}

function getAssignmentCanvasAttachment(assignment: AssignmentRecord, canvasDocumentIds: string[] = []): WritingCanvasAttachment | null {
  const [canvasId] = canvasDocumentIds;

  if (canvasId && assignment.draft?.canvasPageCount && assignment.draft.canvasPageCount > 0) {
    return {
      canvasId,
      pageCount: assignment.draft.canvasPageCount,
      title: "Attached canvas work",
      updatedLabel: assignment.draft.lastEditedLabel,
    };
  }

  return null;
}

async function getLocalCanvasAttachment(input: WorkspaceRequestInput): Promise<WritingCanvasAttachment | null> {
  const summary = await canvasApi.getAttachedCanvasSummary(input);

  if (!summary) {
    return null;
  }

  return {
    canvasId: summary.id,
    pageCount: 1,
    title: summary.title,
    updatedLabel: summary.updatedLabel,
  };
}

function getSeedText(assignment: AssignmentRecord): string {
  if (!assignment.draft) {
    return "";
  }

  return assignment.draft.preview.endsWith("...") ? assignment.draft.preview.slice(0, -3) : assignment.draft.preview;
}

export const writingWorkspaceApi = {
  async getWorkspace(input: WorkspaceRequestInput): Promise<WritingWorkspaceResponse> {
    const detail = await assignmentsApi.getAssignmentDetail(input);

    if (!detail.assignment) {
      return writingWorkspaceResponseSchema.parse({
        assignment: null,
        connectionStatus: detail.connectionStatus,
        draft: null,
        generatedAt: new Date("2026-06-08T09:00:00.000Z").toISOString(),
        gradeLevel: detail.gradeLevel,
        studentId: input.studentId,
      });
    }

    const localCanvasAttachment = await getLocalCanvasAttachment({
      assignmentId: detail.assignment.id,
      gradeLevel: input.gradeLevel,
      studentId: input.studentId,
    });
    const backendDraft = await assignmentsApi.getBackendDraft(input);
    const assignmentCanvasAttachment = getAssignmentCanvasAttachment(
      detail.assignment,
      backendDraft?.canvasDocumentIds ?? [],
    );
    const fallbackDraft = createWritingDraft({
      assignmentId: detail.assignment.id,
      canvasAttachment: localCanvasAttachment ?? assignmentCanvasAttachment,
      revisionNumber: detail.assignment.draft?.revisionNumber ?? 0,
      seedText: backendDraft?.text ?? getSeedText(detail.assignment),
      studentId: input.studentId,
      timestamp: backendDraft?.updatedAt ?? new Date("2026-06-08T09:00:00.000Z").toISOString(),
    });
    const draft = await draftPersistenceService.getDraft(fallbackDraft);

    return writingWorkspaceResponseSchema.parse({
      assignment: detail.assignment,
      connectionStatus: detail.connectionStatus,
      draft: {
        ...draft,
        canvasAttachment: localCanvasAttachment ?? draft.canvasAttachment ?? fallbackDraft.canvasAttachment,
      },
      generatedAt: new Date("2026-06-08T09:00:00.000Z").toISOString(),
      gradeLevel: detail.gradeLevel,
      studentId: input.studentId,
    });
  },

  async saveDraft(input: SaveDraftInput): Promise<WritingDraft> {
    const savedDraft = await draftPersistenceService.saveDraft(input.draft);
    await assignmentsApi.saveBackendDraft({
      assignmentId: input.assignmentId,
      autosaveVersion: Date.now(),
      canvasDocumentIds: savedDraft.canvasAttachment ? [savedDraft.canvasAttachment.canvasId] : [],
      gradeLevel: input.gradeLevel,
      studentId: input.studentId,
      text: savedDraft.text,
    });

    return savedDraft;
  },

  async submitDraft(input: SubmitDraftInput): Promise<WritingSubmissionResponse> {
    const validation = getWritingValidation(input.draft.text);

    if (!validation.canSubmit) {
      throw new Error("Draft is empty");
    }

    await draftPersistenceService.saveDraft(input.draft);

    // Submit through the assignments workflow so success is only reported
    // with the submission id the backend acknowledged. Backend failures
    // throw, which keeps the draft on screen instead of faking a review.
    const submission = await assignmentsApi.submitAssignment({
      assignmentId: input.assignmentId,
      canvasDocumentIds: input.draft.canvasAttachment ? [input.draft.canvasAttachment.canvasId] : [],
      clientDraftVersion: Math.max(1, input.draft.revisionNumber + 1),
      gradeLevel: input.gradeLevel,
      studentId: input.studentId,
      typedText: input.draft.text,
    });

    return writingSubmissionResponseSchema.parse({
      assignmentId: input.assignmentId,
      submittedAt: new Date().toISOString(),
      submissionId: submission.submissionId,
    });
  },
};
