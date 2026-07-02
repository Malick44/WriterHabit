import type {
  AssignmentRecord,
  StudentAssignmentRecord,
  SubmissionRecord,
} from "./assignments.types";

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
