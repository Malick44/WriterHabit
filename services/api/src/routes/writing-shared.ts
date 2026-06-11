import { z } from "zod";

import type {
  AssignmentDifficulty,
  DraftRecord,
  StudentAssignmentWithAssignment,
  SubmissionRecord,
  SubmissionRevisionRecord,
} from "../data/types";

/**
 * Writing-loop endpoints implemented by registerAssignmentRoutes and
 * registerSubmissionRoutes. When a Database is configured, these are removed
 * from the fail-closed placeholder registrations; without a Database they
 * stay placeholders and keep returning 501 feature.disabled.
 */
export const writingLoopImplementedEndpoints: ReadonlySet<string> = new Set([
  "GET /api/v1/students/:studentId/assignments",
  "GET /api/v1/students/:studentId/daily-assignment",
  "GET /api/v1/assignments/:assignmentId",
  "GET /api/v1/student-assignments/:studentAssignmentId/draft",
  "PUT /api/v1/student-assignments/:studentAssignmentId/draft",
  "DELETE /api/v1/student-assignments/:studentAssignmentId/draft",
  "POST /api/v1/student-assignments/:studentAssignmentId/submissions",
  "GET /api/v1/submissions/:submissionId",
  "POST /api/v1/submissions/:submissionId/revisions",
  "GET /api/v1/submissions/:submissionId/revisions",
]);

export const studentAssignmentStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "submitted",
  "reviewing",
  "feedback_ready",
  "revision_in_progress",
  "completed",
]);

export interface LocalizedCopy {
  fallback: string;
  key: string;
}

export interface TextStats {
  paragraphCount: number;
  preview: string;
  sentenceCount: number;
  wordCount: number;
}

const previewMaxLength = 500;
const excerptMaxLength = 1000;

export function computeTextStats(text: string): TextStats {
  const trimmed = text.trim();

  if (!trimmed) {
    return { paragraphCount: 0, preview: "", sentenceCount: 0, wordCount: 0 };
  }

  const wordCount = trimmed.split(/\s+/).length;
  const sentenceCount = trimmed.match(/[.!?]+(?=\s|$)/g)?.length ?? 1;
  const paragraphCount = trimmed
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim().length > 0).length;

  return {
    paragraphCount,
    preview: trimmed.slice(0, previewMaxLength),
    sentenceCount,
    wordCount,
  };
}

export function toExcerpt(text: string): string {
  return text.trim().slice(0, excerptMaxLength);
}

export function localizedCopy(key: string, fallback: string): LocalizedCopy {
  return { fallback, key };
}

export function mapStudentAssignmentSummary(record: StudentAssignmentWithAssignment) {
  const assignment = record.assignment;

  return {
    assignmentId: assignment.id,
    assignmentType: assignment.assignmentType,
    currentSubmissionId: record.currentSubmissionId,
    difficulty: assignment.difficulty,
    dueAt: record.dueAt ?? assignment.dueAt,
    estimatedMinutes: assignment.estimatedMinutes,
    gradeLevelMax: assignment.gradeLevelMax,
    gradeLevelMin: assignment.gradeLevelMin,
    prompt: localizedCopy(assignment.promptKey, assignment.promptFallback),
    skillFocus: assignment.skillFocus,
    status: record.status,
    studentAssignmentId: record.id,
    title: localizedCopy(assignment.titleKey, assignment.titleFallback),
  };
}

export function mapDraftSummary(draft: DraftRecord) {
  return {
    canvasPageCount: draft.canvasDocumentIds.length,
    preview: draft.textPreview,
    revisionNumber: draft.revisionNumber,
    studentAssignmentId: draft.studentAssignmentId,
    updatedAt: draft.updatedAt,
    wordCount: draft.wordCount,
  };
}

export function mapDraftResponse(draft: DraftRecord) {
  return {
    ...mapDraftSummary(draft),
    autosaveVersion: draft.autosaveVersion,
    canvasDocumentIds: draft.canvasDocumentIds,
    text: draft.textContent,
  };
}

export function mapSubmissionResponse(submission: SubmissionRecord) {
  return {
    canvasDocumentIds: submission.canvasDocumentIds,
    // Feedback persistence is a separate workstream; the review job is queued
    // at submission time and feedback stays null until it completes.
    feedbackId: null,
    id: submission.id,
    paragraphCount: submission.paragraphCount,
    revisionNumber: submission.revisionNumber,
    sentenceCount: submission.sentenceCount,
    status: submission.status,
    studentAssignmentId: submission.studentAssignmentId,
    studentId: submission.studentProfileId,
    submittedAt: submission.submittedAt,
    typedTextExcerpt: submission.typedTextExcerpt,
    wordCount: submission.wordCount,
  };
}

export function mapRevisionResponse(revision: SubmissionRevisionRecord) {
  return {
    createdAt: revision.createdAt,
    id: revision.id,
    revisedExcerpt: revision.revisedExcerpt,
    revisionTaskId: revision.revisionTaskId,
    studentId: revision.studentProfileId,
    submissionId: revision.submissionId,
  };
}

const difficulties: readonly AssignmentDifficulty[] = ["easy", "moderate", "challenging"];

/**
 * Maps `student_assignments.daily_selection_metadata` to the contract's
 * selection block. When no server-side selection metadata exists yet, the
 * daily pick is the most recent active student assignment and the response
 * says so via the `most_recent_active_assignment` reason code.
 */
export function mapDailySelection(
  metadata: Record<string, unknown>,
  fallbackDifficulty: AssignmentDifficulty,
): { reasonCodes: string[]; targetDifficulty: AssignmentDifficulty } {
  const rawReasonCodes = metadata.reason_codes ?? metadata.reasonCodes;
  const reasonCodes = Array.isArray(rawReasonCodes)
    ? rawReasonCodes.filter((code): code is string => typeof code === "string")
    : [];
  const rawDifficulty = metadata.target_difficulty ?? metadata.targetDifficulty;
  const targetDifficulty = difficulties.includes(rawDifficulty as AssignmentDifficulty)
    ? (rawDifficulty as AssignmentDifficulty)
    : fallbackDifficulty;

  return {
    reasonCodes: reasonCodes.length > 0 ? reasonCodes : ["most_recent_active_assignment"],
    targetDifficulty,
  };
}

/**
 * Assignment instructions are stored as a jsonb array of localized copy
 * objects; ignore entries that do not match the expected shape.
 */
export function mapInstructions(instructions: unknown): LocalizedCopy[] {
  if (!Array.isArray(instructions)) {
    return [];
  }

  return instructions.flatMap((entry) => {
    if (
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as { key?: unknown }).key === "string" &&
      typeof (entry as { fallback?: unknown }).fallback === "string"
    ) {
      const copy = entry as { fallback: string; key: string };
      return [localizedCopy(copy.key, copy.fallback)];
    }

    return [];
  });
}
