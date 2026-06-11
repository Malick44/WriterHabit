import type { AssignmentType, GradeLevel, WritingSkill } from "@WriterHabit/shared";
import { z } from "zod";

import type { GradeBand } from "@/design/tokens";

export const assignmentScenarioSchema = z.enum(["success", "empty", "error", "offline", "submitted"]);
export type AssignmentScenario = z.infer<typeof assignmentScenarioSchema>;

export const assignmentStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "submitted",
  "reviewing",
  "feedback_ready",
  "revision_in_progress",
  "completed",
]);

export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;

export const assignmentHistoryTabSchema = z.enum(["all", "drafts", "submitted", "reviewed"]);
export type AssignmentHistoryTab = z.infer<typeof assignmentHistoryTabSchema>;

export const assignmentDifficultySchema = z.enum(["easy", "moderate", "challenging"]);
export type AssignmentDifficulty = z.infer<typeof assignmentDifficultySchema>;

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

const gradeLevelSchema = z.custom<GradeLevel>(
  (value) => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12,
);

export const assignmentRubricCriterionSchema = z.object({
  description: z.string().min(1),
  id: z.string().min(1),
  label: z.string().min(1),
});

export const assignmentDraftSummarySchema = z.object({
  canvasPageCount: z.number().int().nonnegative(),
  lastEditedLabel: z.string().min(1),
  preview: z.string().min(1),
  revisionNumber: z.number().int().nonnegative(),
  wordCount: z.number().int().nonnegative(),
});

export const assignmentRecordSchema = z.object({
  assignedLabel: z.string().min(1),
  assignmentType: assignmentTypeSchema,
  currentSubmissionId: z.string().min(1).optional(),
  difficulty: assignmentDifficultySchema,
  draft: assignmentDraftSummarySchema.nullable(),
  dueLabel: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  gradeLevelMax: gradeLevelSchema,
  gradeLevelMin: gradeLevelSchema,
  id: z.string().min(1),
  instructions: z.array(z.string().min(1)).min(1),
  prompt: z.string().min(1),
  rubric: z.array(assignmentRubricCriterionSchema).min(1),
  rubricId: z.string().min(1),
  skillFocus: z.array(writingSkillSchema).min(1),
  status: assignmentStatusSchema,
  submittedLabel: z.string().min(1).optional(),
  teacherNote: z.string().min(1).optional(),
  title: z.string().min(1),
});

export const assignmentHistoryResponseSchema = z.object({
  assignments: z.array(assignmentRecordSchema),
  connectionStatus: z.enum(["online", "offline_cached"]),
  generatedAt: z.string().datetime(),
  gradeLevel: gradeLevelSchema,
  studentId: z.string().min(1),
});

export const assignmentDetailResponseSchema = z.object({
  assignment: assignmentRecordSchema.nullable(),
  connectionStatus: z.enum(["online", "offline_cached"]),
  generatedAt: z.string().datetime(),
  gradeLevel: gradeLevelSchema,
  studentId: z.string().min(1),
});

export const assignmentSubmissionResponseSchema = z.object({
  assignmentId: z.string().min(1),
  status: z.literal("submitted"),
  submittedLabel: z.string().min(1),
  submissionId: z.string().min(1),
});

export type AssignmentRubricCriterion = z.infer<typeof assignmentRubricCriterionSchema>;
export type AssignmentDraftSummary = z.infer<typeof assignmentDraftSummarySchema>;
export type AssignmentRecord = z.infer<typeof assignmentRecordSchema> & {
  assignmentType: AssignmentType;
  gradeLevelMax: GradeLevel;
  gradeLevelMin: GradeLevel;
  skillFocus: WritingSkill[];
};
export type AssignmentHistoryResponse = z.infer<typeof assignmentHistoryResponseSchema> & {
  assignments: AssignmentRecord[];
  gradeLevel: GradeLevel;
};
export type AssignmentDetailResponse = z.infer<typeof assignmentDetailResponseSchema> & {
  assignment: AssignmentRecord | null;
  gradeLevel: GradeLevel;
};
export type AssignmentSubmissionResponse = z.infer<typeof assignmentSubmissionResponseSchema>;

export interface AssignmentGradeAdaptation {
  band: GradeBand;
  showDetailedRubric: boolean;
  showDifficulty: boolean;
  visibleInstructionCount: number;
}

export interface AssignmentHistoryViewModel {
  assignments: AssignmentRecord[];
  counts: Record<AssignmentHistoryTab, number>;
  gradeAdaptation: AssignmentGradeAdaptation;
  isEmpty: boolean;
  isOffline: boolean;
  selectedTab: AssignmentHistoryTab;
}

export interface AssignmentDetailViewModel {
  assignment: AssignmentRecord | null;
  canStartCanvas: boolean;
  canStartWriting: boolean;
  canSubmit: boolean;
  gradeAdaptation: AssignmentGradeAdaptation;
  isMissing: boolean;
  isOffline: boolean;
  nextStatusOnStart: AssignmentStatus | null;
}
