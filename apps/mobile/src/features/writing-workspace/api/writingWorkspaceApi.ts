import type { GradeLevel } from "@writewise/shared";

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

function getAssignmentCanvasAttachment(assignment: AssignmentRecord): WritingCanvasAttachment | null {
  if (assignment.draft?.canvasPageCount && assignment.draft.canvasPageCount > 0) {
    return {
      canvasId: `canvas-${assignment.id}`,
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
    const assignmentCanvasAttachment = getAssignmentCanvasAttachment(detail.assignment);
    const fallbackDraft = createWritingDraft({
      assignmentId: detail.assignment.id,
      canvasAttachment: localCanvasAttachment ?? assignmentCanvasAttachment,
      revisionNumber: detail.assignment.draft?.revisionNumber ?? 0,
      seedText: getSeedText(detail.assignment),
      studentId: input.studentId,
      timestamp: new Date("2026-06-08T09:00:00.000Z").toISOString(),
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
    return draftPersistenceService.saveDraft(input.draft);
  },

  async submitDraft(input: SubmitDraftInput): Promise<WritingSubmissionResponse> {
    const validation = getWritingValidation(input.draft.text);

    if (!validation.canSubmit) {
      throw new Error("Draft is empty");
    }

    await draftPersistenceService.saveDraft(input.draft);

    return writingSubmissionResponseSchema.parse({
      assignmentId: input.assignmentId,
      submittedAt: new Date().toISOString(),
      submissionId: `review-${input.assignmentId}`,
    });
  },
};
