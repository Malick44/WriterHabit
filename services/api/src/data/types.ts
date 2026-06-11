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

export interface StudentProfileRecord {
  gradeLevel: number;
  id: string;
  userId: string;
}

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

export interface ReviewJobRecord {
  id: string;
  idempotencyKey: string;
  status: "queued" | "processing" | "completed" | "failed" | "safety_blocked";
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

/**
 * Injectable persistence boundary for the core student writing loop.
 *
 * Mirrors the AuthVerifier pattern: production wires a Supabase
 * service-role implementation, tests inject an in-memory fake, and when no
 * implementation is configured the feature routes stay fail-closed behind
 * the placeholder registrations.
 */
export interface Database {
  /**
   * Creates the submission row, persists the full typed contents, links the
   * referenced canvas documents, queues the review job, and advances the
   * student assignment to `submitted` with the new current submission.
   */
  createSubmission(input: CreateSubmissionInput): Promise<SubmissionRecord>;
  createSubmissionRevision(input: CreateSubmissionRevisionInput): Promise<SubmissionRevisionRecord>;
  deleteDraft(studentAssignmentId: string): Promise<void>;
  findStudentAssignmentForStudents(
    assignmentId: string,
    studentProfileIds: readonly string[],
  ): Promise<StudentAssignmentWithAssignment | null>;
  findSubmissionByIdempotencyKey(
    studentAssignmentId: string,
    idempotencyKey: string,
  ): Promise<SubmissionRecord | null>;
  findSubmissionRevisionByIdempotencyKey(
    submissionId: string,
    idempotencyKey: string,
  ): Promise<SubmissionRevisionRecord | null>;
  getDraftByStudentAssignmentId(studentAssignmentId: string): Promise<DraftRecord | null>;
  getMaxSubmissionRevisionNumber(studentAssignmentId: string): Promise<number>;
  getStudentAssignmentById(id: string): Promise<StudentAssignmentWithAssignment | null>;
  getStudentProfileById(id: string): Promise<StudentProfileRecord | null>;
  getStudentProfileByUserId(userId: string): Promise<StudentProfileRecord | null>;
  getSubmissionById(id: string): Promise<SubmissionRecord | null>;
  getSubmissionContent(submissionId: string): Promise<string | null>;
  hasActiveParentLink(parentUserId: string, studentProfileId: string): Promise<boolean>;
  hasActiveTeacherLink(teacherUserId: string, studentProfileId: string): Promise<boolean>;
  listParentLinkedStudentProfileIds(parentUserId: string): Promise<string[]>;
  listRubricCriteria(rubricId: string): Promise<RubricCriterionRecord[]>;
  listStudentAssignments(
    studentProfileId: string,
    options: ListStudentAssignmentsOptions,
  ): Promise<StudentAssignmentWithAssignment[]>;
  listSubmissionRevisions(submissionId: string): Promise<SubmissionRevisionRecord[]>;
  listTeacherLinkedStudentProfileIds(teacherUserId: string): Promise<string[]>;
  saveDraft(input: SaveDraftInput): Promise<DraftRecord>;
  updateStudentAssignment(id: string, update: StudentAssignmentUpdate): Promise<void>;
}
