export type StudentAssignmentStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "reviewing"
  | "feedback_ready"
  | "revision_in_progress"
  | "completed";

export type SubmissionStatus =
  | "submitted"
  | "reviewing"
  | "feedback_ready"
  | "revision_in_progress"
  | "completed";

export type AssignmentDifficulty = "easy" | "moderate" | "challenging";

export interface AssignmentRecord {
  assignmentType: string;
  classId: string | null;
  difficulty: AssignmentDifficulty;
  dueAt: string | null;
  estimatedMinutes: number;
  gradeLevelMax: number;
  gradeLevelMin: number;
  id: string;
  instructions: unknown;
  promptFallback: string;
  promptKey: string;
  rubricId: string;
  skillFocus: string[];
  status: string;
  titleFallback: string;
  titleKey: string;
}

export interface StudentAssignmentRecord {
  assignmentId: string;
  classId: string | null;
  completedAt: string | null;
  createdAt: string;
  currentSubmissionId: string | null;
  dailySelectionMetadata: Record<string, unknown>;
  dueAt: string | null;
  id: string;
  startedAt: string | null;
  status: StudentAssignmentStatus;
  studentProfileId: string;
  submittedAt: string | null;
  teacherNoteFallback: string | null;
  teacherNoteKey: string | null;
  updatedAt: string;
}

export interface StudentAssignmentWithAssignment extends StudentAssignmentRecord {
  assignment: AssignmentRecord;
}

export interface RubricCriterionRecord {
  descriptionFallback: string;
  descriptionKey: string;
  id: string;
  labelFallback: string;
  labelKey: string;
  maxScore: number;
  rubricId: string;
  skill: string;
  sortOrder: number;
}

export interface DraftRecord {
  autosaveVersion: number;
  canvasDocumentIds: string[];
  createdAt: string;
  id: string;
  paragraphCount: number;
  revisionNumber: number;
  sentenceCount: number;
  studentAssignmentId: string;
  studentProfileId: string;
  textContent: string;
  textPreview: string;
  updatedAt: string;
  wordCount: number;
}

export interface SaveDraftInput {
  autosaveVersion: number;
  canvasDocumentIds: string[];
  paragraphCount: number;
  revisionNumber: number;
  sentenceCount: number;
  studentAssignmentId: string;
  studentProfileId: string;
  textContent: string;
  textPreview: string;
  wordCount: number;
}

export interface SubmissionRecord {
  canvasDocumentIds: string[];
  createdAt: string;
  id: string;
  idempotencyKey: string;
  paragraphCount: number;
  revisionNumber: number;
  sentenceCount: number;
  status: SubmissionStatus;
  studentAssignmentId: string;
  studentProfileId: string;
  submittedAt: string;
  typedTextExcerpt: string;
  wordCount: number;
}

export interface CreateSubmissionInput {
  canvasDocumentIds: string[];
  idempotencyKey: string;
  paragraphCount: number;
  revisionNumber: number;
  sentenceCount: number;
  studentAssignmentId: string;
  studentProfileId: string;
  typedText: string;
  typedTextExcerpt: string;
  wordCount: number;
}

export interface SubmissionRevisionRecord {
  createdAt: string;
  id: string;
  idempotencyKey: string;
  revisedExcerpt: string;
  revisionTaskId: string | null;
  studentProfileId: string;
  submissionId: string;
}

export interface CreateSubmissionRevisionInput {
  idempotencyKey: string;
  revisedExcerpt: string;
  revisionTaskId: string | null;
  studentProfileId: string;
  submissionId: string;
}

export interface ListStudentAssignmentsOptions {
  assignmentType?: string;
  limit: number;
  orderBy?: "createdAt" | "updatedAt";
  statuses?: readonly StudentAssignmentStatus[];
}

export interface StudentAssignmentUpdate {
  completedAt?: string | null;
  currentSubmissionId?: string | null;
  startedAt?: string | null;
  status?: StudentAssignmentStatus;
  submittedAt?: string | null;
}
