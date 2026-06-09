import type { AssignmentType, GradeLevel, WritingSkill } from "@writewise/shared";
import { z } from "zod";

import type { GradeBand } from "@/design/tokens";

export const MAX_FEEDBACK_REVIEW_EXCERPT_LENGTH = 900;
export const MAX_FEEDBACK_REVISION_TEXT_LENGTH = 2_400;

const gradeLevelSchema = z.custom<GradeLevel>(
  (value) => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12,
);

const assignmentTypeSchema = z.enum([
  "sentence_practice",
  "paragraph_writing",
  "essay_writing",
  "creative_writing",
  "reading_response",
  "grammar_practice",
  "vocabulary_practice",
  "test_prep",
  "journal",
  "handwriting_practice",
]);

const writingSkillSchema = z.enum([
  "spelling",
  "grammar",
  "punctuation",
  "sentence_structure",
  "vocabulary",
  "organization",
  "creativity",
  "clarity",
  "evidence_usage",
  "argument_strength",
  "revision_quality",
  "handwriting",
  "reading_response",
]);

export const feedbackReviewScenarioSchema = z.enum(["success", "processing", "empty", "error", "offline"]);
export type FeedbackReviewScenario = z.infer<typeof feedbackReviewScenarioSchema>;

export const feedbackReviewStatusSchema = z.enum(["processing", "completed", "missing"]);
export type FeedbackReviewStatus = z.infer<typeof feedbackReviewStatusSchema>;

export const feedbackReviewConnectionStatusSchema = z.enum(["online", "offline_cached"]);
export type FeedbackReviewConnectionStatus = z.infer<typeof feedbackReviewConnectionStatusSchema>;

export const feedbackRevisionErrorSchema = z.enum([
  "empty_revision",
  "too_long",
  "unchanged_revision",
  "submit_failed",
]);
export type FeedbackRevisionError = z.infer<typeof feedbackRevisionErrorSchema>;

export const feedbackRubricLevelSchema = z.enum(["starting", "building", "meeting", "strong"]);
export type FeedbackRubricLevel = z.infer<typeof feedbackRubricLevelSchema>;

export const feedbackReviewProgressSchema = z.object({
  minutes: z.number().int().nonnegative(),
  points: z.number().int().nonnegative(),
  skill: writingSkillSchema,
});
export type FeedbackReviewProgress = z.infer<typeof feedbackReviewProgressSchema> & {
  skill: WritingSkill;
};

export const feedbackRevisionTaskSchema = z.object({
  focusLabel: z.string().min(1),
  guidingQuestion: z.string().min(1),
  id: z.string().min(1),
  instruction: z.string().min(1),
  originalExcerpt: z.string().min(1).max(MAX_FEEDBACK_REVIEW_EXCERPT_LENGTH),
  targetSkill: writingSkillSchema,
});
export type FeedbackRevisionTask = z.infer<typeof feedbackRevisionTaskSchema> & {
  targetSkill: WritingSkill;
};

export const feedbackSummarySchema = z.object({
  improvement: z.string().min(1),
  nextRevisionTask: z.string().min(1),
  strength: z.string().min(1),
});
export type FeedbackSummary = z.infer<typeof feedbackSummarySchema>;

export const feedbackRubricScoreSchema = z.object({
  coachingNote: z.string().min(1),
  criterionId: z.string().min(1),
  description: z.string().min(1),
  label: z.string().min(1),
  level: feedbackRubricLevelSchema,
  maxScore: z.literal(4),
  score: z.number().int().min(1).max(4),
});
export type FeedbackRubricScore = z.infer<typeof feedbackRubricScoreSchema>;

export const grammarSuggestionSchema = z.object({
  explanation: z.string().min(1),
  id: z.string().min(1),
  originalExcerpt: z.string().min(1).max(MAX_FEEDBACK_REVIEW_EXCERPT_LENGTH),
  studentAction: z.string().min(1),
  title: z.string().min(1),
});
export type GrammarSuggestion = z.infer<typeof grammarSuggestionSchema>;

export const feedbackReviewSchema = z.object({
  assignmentId: z.string().min(1),
  assignmentPrompt: z.string().min(1),
  assignmentTitle: z.string().min(1),
  assignmentType: assignmentTypeSchema,
  connectionStatus: feedbackReviewConnectionStatusSchema,
  createdAt: z.string().datetime(),
  gradeLevel: gradeLevelSchema,
  id: z.string().min(1),
  progressEarned: feedbackReviewProgressSchema,
  rubricScores: z.array(feedbackRubricScoreSchema).min(1).max(8),
  grammarSuggestions: z.array(grammarSuggestionSchema).max(4),
  revisionTask: feedbackRevisionTaskSchema,
  status: z.literal("completed"),
  studentId: z.string().min(1),
  submissionId: z.string().min(1),
  submittedTextExcerpt: z.string().min(1).max(MAX_FEEDBACK_REVIEW_EXCERPT_LENGTH),
  summary: feedbackSummarySchema,
});
export type FeedbackReview = z.infer<typeof feedbackReviewSchema> & {
  assignmentType: AssignmentType;
  gradeLevel: GradeLevel;
  progressEarned: FeedbackReviewProgress;
  revisionTask: FeedbackRevisionTask;
};

export const feedbackReviewResponseSchema = z.object({
  connectionStatus: feedbackReviewConnectionStatusSchema,
  generatedAt: z.string().datetime(),
  gradeLevel: gradeLevelSchema,
  review: feedbackReviewSchema.nullable(),
  status: feedbackReviewStatusSchema,
  studentId: z.string().min(1),
});
export type FeedbackReviewResponse = z.infer<typeof feedbackReviewResponseSchema> & {
  gradeLevel: GradeLevel;
  review: FeedbackReview | null;
};

export const feedbackRevisionCompletionSchema = z.object({
  completedAt: z.string().datetime(),
  progressEarned: feedbackReviewProgressSchema,
  revisionId: z.string().min(1),
  revisionTextExcerpt: z.string().min(1).max(MAX_FEEDBACK_REVIEW_EXCERPT_LENGTH),
  status: z.literal("completed"),
  submissionId: z.string().min(1),
});
export type FeedbackRevisionCompletion = z.infer<typeof feedbackRevisionCompletionSchema> & {
  progressEarned: FeedbackReviewProgress;
};

export const feedbackRevisionDraftSchema = z.object({
  revisedText: z.string().max(MAX_FEEDBACK_REVISION_TEXT_LENGTH),
  studentId: z.string().min(1),
  submissionId: z.string().min(1),
  updatedAt: z.string().datetime(),
});
export type FeedbackRevisionDraft = z.infer<typeof feedbackRevisionDraftSchema>;

export interface FeedbackReviewGradeAdaptation {
  band: GradeBand;
  revisionInputMinHeight: number;
  showDetailedRubric: boolean;
  showGrammarDetail: boolean;
  visibleRubricScoreCount: number;
}

export interface FeedbackReviewViewModel {
  gradeAdaptation: FeedbackReviewGradeAdaptation;
  isOffline: boolean;
  progressValue: number;
  review: FeedbackReview;
  visibleGrammarSuggestions: GrammarSuggestion[];
  visibleRubricScores: FeedbackRubricScore[];
}

export interface FeedbackRevisionValidation {
  canSubmit: boolean;
  error: FeedbackRevisionError | null;
}
