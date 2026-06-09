import { z } from "zod";

import type { GradeBand } from "@/design/tokens";
import { assignmentRecordSchema, type AssignmentRecord } from "@/features/assignments/types";

export const MAX_DRAFT_TEXT_LENGTH = 20_000;

export const writingAutosaveStatusSchema = z.enum(["idle", "restoring", "unsaved", "saving", "saved", "failed"]);
export type WritingAutosaveStatus = z.infer<typeof writingAutosaveStatusSchema>;

export const writingSubmitErrorSchema = z.enum(["empty_draft", "save_failed", "submit_failed"]);
export type WritingSubmitError = z.infer<typeof writingSubmitErrorSchema>;

export const writingCanvasAttachmentSchema = z.object({
  canvasId: z.string().min(1),
  pageCount: z.number().int().nonnegative(),
  title: z.string().min(1),
  updatedLabel: z.string().min(1),
});

export const writingDraftSchema = z.object({
  assignmentId: z.string().min(1),
  canvasAttachment: writingCanvasAttachmentSchema.nullable(),
  createdAt: z.string().datetime(),
  revisionNumber: z.number().int().nonnegative(),
  studentId: z.string().min(1),
  text: z.string().max(MAX_DRAFT_TEXT_LENGTH),
  updatedAt: z.string().datetime(),
});

export const writingWorkspaceResponseSchema = z.object({
  assignment: assignmentRecordSchema.nullable(),
  connectionStatus: z.enum(["online", "offline_cached"]),
  draft: writingDraftSchema.nullable(),
  generatedAt: z.string().datetime(),
  gradeLevel: z.number().int().min(1).max(12),
  studentId: z.string().min(1),
});

export const writingSubmissionResponseSchema = z.object({
  assignmentId: z.string().min(1),
  submittedAt: z.string().datetime(),
  submissionId: z.string().min(1),
});

export type WritingCanvasAttachment = z.infer<typeof writingCanvasAttachmentSchema>;
export type WritingDraft = z.infer<typeof writingDraftSchema>;
export type WritingWorkspaceResponse = z.infer<typeof writingWorkspaceResponseSchema> & {
  assignment: AssignmentRecord | null;
  draft: WritingDraft | null;
};
export type WritingSubmissionResponse = z.infer<typeof writingSubmissionResponseSchema>;

export interface WritingMetrics {
  paragraphCount: number;
  sentenceCount: number;
  wordCount: number;
}

export interface WritingValidationResult {
  canSubmit: boolean;
  error: WritingSubmitError | null;
  metrics: WritingMetrics;
}

export interface WritingWorkspaceGradeAdaptation {
  band: GradeBand;
  editorMinHeight: number;
  showDetailedRubric: boolean;
  showOutlineSupport: boolean;
  visibleCoachActionCount: number;
}

export interface WritingWorkspaceViewModel {
  assignment: AssignmentRecord | null;
  autosaveStatus: WritingAutosaveStatus;
  canSubmit: boolean;
  draft: WritingDraft | null;
  gradeAdaptation: WritingWorkspaceGradeAdaptation;
  isEmptyDraft: boolean;
  isMissing: boolean;
  isOffline: boolean;
  metrics: WritingMetrics;
  submitError: WritingSubmitError | null;
  text: string;
}
