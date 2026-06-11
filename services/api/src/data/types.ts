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

export type ReviewJobStatus = "queued" | "processing" | "completed" | "failed" | "safety_blocked";

export type ReviewJobTransition = "start_review" | "fail_review" | "safety_block_review";

export interface ReviewJobRecord {
  createdAt?: string;
  completedAt?: string | null;
  failureCode?: string | null;
  failedAt?: string | null;
  id: string;
  idempotencyKey: string;
  queuedAt?: string;
  safetyFlags?: string[];
  startedAt?: string | null;
  status: ReviewJobStatus;
  studentProfileId: string;
  submissionId: string;
}

export interface TransitionReviewJobInput {
  failureCode?: string | null;
  idempotencyKey: string;
  safetyFlags?: string[];
  studentProfileId: string;
  submissionId: string;
  transition: ReviewJobTransition;
}

export interface FeedbackRecord {
  createdAt: string;
  gradeLevel: number;
  id: string;
  improvementFallback: string;
  improvementKey: string;
  nextRevisionTaskFallback: string;
  nextRevisionTaskKey: string;
  progressMinutes: number;
  progressPoints: number;
  progressSkill: string;
  strengthFallback: string;
  strengthKey: string;
  studentProfileId: string;
  submissionId: string;
  submittedTextExcerpt: string;
  updatedAt: string;
}

export interface RevisionTaskRecord {
  createdAt: string;
  feedbackId: string;
  guidingQuestionFallback: string;
  guidingQuestionKey: string;
  id: string;
  instructionFallback: string;
  instructionKey: string;
  originalExcerpt: string;
  targetSkill: string;
  updatedAt: string;
}

export interface FeedbackRubricScoreRecord {
  coachingNoteFallback: string;
  coachingNoteKey: string;
  criterionDescriptionFallback: string;
  criterionDescriptionKey: string;
  criterionId: string;
  criterionLabelFallback: string;
  criterionLabelKey: string;
  feedbackId: string;
  id: string;
  level: "starting" | "building" | "meeting" | "strong";
  maxScore: 4;
  score: 1 | 2 | 3 | 4;
}

export interface GrammarSuggestionRecord {
  explanationFallback: string;
  explanationKey: string;
  feedbackId: string;
  id: string;
  originalExcerpt: string;
  studentActionFallback: string;
  studentActionKey: string;
  titleFallback: string;
  titleKey: string;
}

export interface FeedbackWithDetails {
  assignment: AssignmentRecord;
  feedback: FeedbackRecord;
  grammarSuggestions: GrammarSuggestionRecord[];
  revisionTask: RevisionTaskRecord | null;
  rubricScores: FeedbackRubricScoreRecord[];
  studentAssignment: StudentAssignmentRecord;
  submission: SubmissionRecord;
}

export interface PublishFeedbackInput {
  feedback: {
    gradeLevel: number;
    improvementFallback: string;
    improvementKey: string;
    nextRevisionTaskFallback: string;
    nextRevisionTaskKey: string;
    progressMinutes: number;
    progressPoints: number;
    progressSkill: string;
    strengthFallback: string;
    strengthKey: string;
    submittedTextExcerpt: string;
  };
  grammarSuggestions: Array<{
    explanationFallback: string;
    explanationKey: string;
    idempotencyId: string;
    originalExcerpt: string;
    studentActionFallback: string;
    studentActionKey: string;
    titleFallback: string;
    titleKey: string;
  }>;
  idempotencyKey: string;
  revisionTask: {
    guidingQuestionFallback: string;
    guidingQuestionKey: string;
    idempotencyId: string;
    instructionFallback: string;
    instructionKey: string;
    originalExcerpt: string;
    targetSkill: string;
  };
  rubricScores: Array<{
    coachingNoteFallback: string;
    coachingNoteKey: string;
    criterionId: string;
    level: "starting" | "building" | "meeting" | "strong";
    maxScore: 4;
    score: 1 | 2 | 3 | 4;
  }>;
  safetyFlags: string[];
  studentProfileId: string;
  submissionId: string;
}

export interface TeacherProfileRecord {
  displayName: string;
  id: string;
  userId: string;
}

export interface ClassRecord {
  gradeLevel: number;
  id: string;
  name: string;
  status: "active" | "archived";
  teacherProfileId: string;
}

export interface ClassRosterStudentRecord {
  displayName: string;
  gradeLevel: number;
  studentProfileId: string;
}

export interface ParentLinkedStudentRecord {
  displayName: string;
  gradeLevel: number;
  relationshipLabel: string;
  studentProfileId: string;
}

export type StreakStatus = "continued" | "at_risk" | "missed" | "not_started";

export interface StudentProgressTotalsRecord {
  aiFeedbackApplied: number;
  assignmentsCompleted: number;
  bestStreakDays: number;
  currentStreakDays: number;
  handwritingMinutes: number;
  minutesThisWeek: number;
  practicedTodayOn: string | null;
  revisionsCompleted: number;
  rubricImprovement: number;
  streakStatus: StreakStatus;
  studentProfileId: string;
  weeklyMinutesGoal: number;
  wordsWritten: number;
}

export interface StudentSkillProgressRecord {
  currentScore: number;
  level: number;
  previousScore: number;
  skill: string;
  studentProfileId: string;
  updatedAt: string;
}

export interface StudentActivityDayRecord {
  activityDate: string;
  assignmentsCompleted: number;
  feedbackApplied: number;
  handwritingMinutes: number;
  minutesPracticed: number;
  practicedSkills: string[];
  revisionsCompleted: number;
  studentProfileId: string;
  wordsWritten: number;
}

export interface WeeklyReviewRecord {
  celebrationFallback: string;
  celebrationKey: string;
  focusForNextWeekFallback: string;
  focusForNextWeekKey: string;
  id: string;
  studentProfileId: string;
  weekEnd: string;
  weekStart: string;
}

export interface BadgeRecord {
  code: string;
  descriptionFallback: string;
  descriptionKey: string;
  iconName: string;
  id: string;
  nameFallback: string;
  nameKey: string;
}

export type StudentBadgeStatus = "locked" | "in_progress" | "unlocked";

export interface StudentBadgeRecord {
  badgeId: string;
  progressPercent: number;
  status: StudentBadgeStatus;
  studentProfileId: string;
  unlockedAt: string | null;
}

/**
 * Teacher review-queue row: a submission joined with the assignment title and
 * the owning student's display name, strictly scoped to class-assigned work
 * (`student_assignments.class_id`).
 */
export interface SubmissionQueueRecord {
  assignmentId: string;
  assignmentTitleFallback: string;
  assignmentTitleKey: string;
  classId: string;
  hasCanvas: boolean;
  id: string;
  status: SubmissionStatus;
  studentAssignmentId: string;
  studentDisplayName: string;
  studentProfileId: string;
  submittedAt: string;
  wordCount: number;
}

export interface ActivityDateRange {
  /** Inclusive ISO date (YYYY-MM-DD). */
  fromDate: string;
  /** Inclusive ISO date (YYYY-MM-DD). */
  toDate: string;
}

export interface ListSubmissionQueueOptions {
  limit: number;
  statuses?: readonly SubmissionStatus[];
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
  getClassById(classId: string): Promise<ClassRecord | null>;
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
  saveDraft(input: SaveDraftInput): Promise<DraftRecord>;
  transitionReviewJob(input: TransitionReviewJobInput): Promise<ReviewJobRecord>;
  updateStudentAssignment(id: string, update: StudentAssignmentUpdate): Promise<void>;
}
