import type {
  AssignmentDifficulty,
  DraftRecord,
  StudentAssignmentWithAssignment,
  SubmissionRecord,
  SubmissionRevisionRecord,
} from "../data/types";
import { localizedCopy, type LocalizedCopy } from "../routes/writing-shared";

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
    rubricChecks: draft.rubricChecks ?? {},
    text: draft.textContent,
  };
}

export function mapSubmissionResponse(submission: SubmissionRecord) {
  return {
    canvasDocumentIds: submission.canvasDocumentIds,
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

export function mapRevisionListApiResponse(revisions: readonly SubmissionRevisionRecord[]) {
  return {
    items: revisions.map((revision) => mapRevisionResponse(revision)),
    nextCursor: null,
  };
}

const difficulties: readonly AssignmentDifficulty[] = ["easy", "moderate", "challenging"];

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
