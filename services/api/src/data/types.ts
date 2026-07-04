export * from "./assignments.types";
export * from "./audit.types";
export * from "./canvas.types";
export * from "./entitlements.types";
export * from "./feedback.types";
export * from "./identity.types";
export * from "./notifications.types";
export * from "./progress.types";

import type {
  ApplyEntitlementProviderEventInput,
  ApplyEntitlementProviderEventResult,
  EntitlementRecord,
  UpsertEntitlementInput,
} from "./entitlements.types";
import type { RecordAiCoachInteractionInput } from "./audit.types";
import type {
  AssignmentRecord,
  CreateSubmissionInput,
  CreateSubmissionRevisionInput,
  DraftRecord,
  ListStudentAssignmentsOptions,
  RubricCriterionRecord,
  SaveDraftInput,
  StudentAssignmentStatus,
  StudentAssignmentUpdate,
  StudentAssignmentWithAssignment,
  SubmissionRecord,
  SubmissionRevisionRecord,
} from "./assignments.types";
import type {
  CanvasDocumentRecord,
  UpsertCanvasDocumentInput,
} from "./canvas.types";
import type {
  FeedbackWithDetails,
  PublishFeedbackInput,
  ReviewJobRecord,
  TransitionReviewJobInput,
} from "./feedback.types";
import type {
  ClassRecord,
  ClassRosterStudentRecord,
  ParentLinkedStudentRecord,
  StudentProfileRecord,
  TeacherProfileRecord,
} from "./identity.types";
import type {
  ActivityDateRange,
  BadgeRecord,
  CompleteGrade3DayInput,
  Grade3DayCompletionResult,
  Grade3WritingProgressRecord,
  ListSubmissionQueueOptions,
  StudentActivityDayRecord,
  StudentBadgeRecord,
  StudentProgressTotalsRecord,
  StudentSkillProgressRecord,
  SubmissionQueueRecord,
  WeeklyReviewRecord,
} from "./progress.types";

/**
 * Injectable persistence boundary for the core student writing loop.
 *
 * Mirrors the AuthVerifier pattern: production wires a Supabase
 * service-role implementation, tests inject an in-memory fake, and when no
 * implementation is configured the feature routes stay fail-closed behind
 * the placeholder registrations.
 */
export interface Database {
  applyEntitlementProviderEvent(
    input: ApplyEntitlementProviderEventInput,
  ): Promise<ApplyEntitlementProviderEventResult>;
  /** Counts published assignments created for the class. */
  countClassActiveAssignments(classId: string): Promise<number>;
  countClassStudentAssignments(
    classId: string,
    statuses?: readonly StudentAssignmentStatus[],
  ): Promise<number>;
  countStudentAssignments(
    studentProfileId: string,
    statuses?: readonly StudentAssignmentStatus[],
  ): Promise<number>;
  /**
   * Creates the submission row, persists the full typed contents, links the
   * referenced canvas documents, queues the review job, and advances the
   * student assignment to `submitted` with the new current submission.
   */
  createSubmission(input: CreateSubmissionInput): Promise<SubmissionRecord>;
  createSubmissionRevision(input: CreateSubmissionRevisionInput): Promise<SubmissionRevisionRecord>;
  deleteDraft(studentAssignmentId: string): Promise<void>;
  getCanvasDocumentById(canvasDocumentId: string): Promise<CanvasDocumentRecord | null>;
  listCanvasDocumentsByIds(canvasDocumentIds: readonly string[]): Promise<CanvasDocumentRecord[]>;
  listCanvasDocumentsForStudent(studentProfileId: string, limit: number): Promise<CanvasDocumentRecord[]>;
  upsertCanvasDocument(input: UpsertCanvasDocumentInput): Promise<CanvasDocumentRecord>;
  getClassById(classId: string): Promise<ClassRecord | null>;
  getLatestEntitlementForUser(ownerUserId: string): Promise<EntitlementRecord | null>;
  getLatestWeeklyReview(studentProfileId: string): Promise<WeeklyReviewRecord | null>;
  getTeacherProfileById(id: string): Promise<TeacherProfileRecord | null>;
  getTeacherProfileByUserId(userId: string): Promise<TeacherProfileRecord | null>;
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
  getFeedbackBySubmissionId(submissionId: string): Promise<FeedbackWithDetails | null>;
  getDraftByStudentAssignmentId(studentAssignmentId: string): Promise<DraftRecord | null>;
  getMaxSubmissionRevisionNumber(studentAssignmentId: string): Promise<number>;
  getReviewJobBySubmissionId(submissionId: string): Promise<ReviewJobRecord | null>;
  getStudentAssignmentById(id: string): Promise<StudentAssignmentWithAssignment | null>;
  getStudentProfileById(id: string): Promise<StudentProfileRecord | null>;
  getStudentProfileByUserId(userId: string): Promise<StudentProfileRecord | null>;
  getSubmissionById(id: string): Promise<SubmissionRecord | null>;
  getSubmissionContent(submissionId: string): Promise<string | null>;
  hasActiveParentLink(parentUserId: string, studentProfileId: string): Promise<boolean>;
  hasActiveTeacherLink(teacherUserId: string, studentProfileId: string): Promise<boolean>;
  /** Active badge catalog, bounded for badge-grid responses. */
  listActiveBadges(limit: number): Promise<BadgeRecord[]>;
  /**
   * Activity-day rows for the given students inside an inclusive date range.
   * Callers pass bounded ranges (a week) so result sizes stay small.
   */
  listActivityDaysForStudents(
    studentProfileIds: readonly string[],
    range: ActivityDateRange,
  ): Promise<StudentActivityDayRecord[]>;
  /**
   * Server-owned Grade 3 day completion: marks the day complete and updates
   * streak totals + activity days transactionally. Idempotent — completing
   * an already-completed day returns it without counting anything twice.
   */
  completeGrade3Day(input: CompleteGrade3DayInput): Promise<Grade3DayCompletionResult>;
  getGrade3Progress(
    studentProfileId: string,
    day: number,
  ): Promise<Grade3WritingProgressRecord | null>;
  /** Active class enrollments with student display names, bounded by limit. */
  listClassStudents(classId: string, limit: number): Promise<ClassRosterStudentRecord[]>;
  listParentLinkedStudentProfileIds(parentUserId: string): Promise<string[]>;
  /** Active parent links with student display names, bounded by limit. */
  listParentLinkedStudents(parentUserId: string, limit: number): Promise<ParentLinkedStudentRecord[]>;
  listProgressTotalsForStudents(
    studentProfileIds: readonly string[],
  ): Promise<StudentProgressTotalsRecord[]>;
  listRubricCriteria(rubricId: string): Promise<RubricCriterionRecord[]>;
  listSkillProgressForStudents(
    studentProfileIds: readonly string[],
  ): Promise<StudentSkillProgressRecord[]>;
  listStudentAssignments(
    studentProfileId: string,
    options: ListStudentAssignmentsOptions,
  ): Promise<StudentAssignmentWithAssignment[]>;
  listStudentBadges(studentProfileId: string): Promise<StudentBadgeRecord[]>;
  /**
   * Review queue across the given classes (newest submissions first), joined
   * with assignment titles and student display names. Only class-assigned
   * work appears; catalog/daily assignments have no class scope.
   */
  listSubmissionQueueForClasses(
    classIds: readonly string[],
    options: ListSubmissionQueueOptions,
  ): Promise<SubmissionQueueRecord[]>;
  listSubmissionRevisions(submissionId: string): Promise<SubmissionRevisionRecord[]>;
  /** Active (non-archived) classes owned by the teacher profile, bounded by limit. */
  listTeacherClasses(teacherProfileId: string, limit: number): Promise<ClassRecord[]>;
  listTeacherLinkedStudentProfileIds(teacherUserId: string): Promise<string[]>;
  publishFeedback(input: PublishFeedbackInput): Promise<FeedbackWithDetails>;
  recordAiCoachInteraction(input: RecordAiCoachInteractionInput): Promise<void>;
  saveDraft(input: SaveDraftInput): Promise<DraftRecord>;
  transitionReviewJob(input: TransitionReviewJobInput): Promise<ReviewJobRecord>;
  updateStudentAssignment(id: string, update: StudentAssignmentUpdate): Promise<void>;
  upsertEntitlement(input: UpsertEntitlementInput): Promise<EntitlementRecord>;
}
