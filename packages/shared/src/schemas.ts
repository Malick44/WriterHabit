import { z } from "zod";

export const userRoleSchema = z.enum(["student", "parent", "teacher", "admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const gradeLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const gradeLevelSchema = z.custom<(typeof gradeLevels)[number]>(
  (value) =>
    typeof value === "number" &&
    Number.isInteger(value) &&
    gradeLevels.includes(value as (typeof gradeLevels)[number]),
);
export type GradeLevel = z.infer<typeof gradeLevelSchema>;

export const writingGoalSchema = z.enum([
  "improve_spelling",
  "write_better_sentences",
  "write_paragraphs",
  "write_essays",
  "creative_writing",
  "test_prep",
  "improve_grammar",
  "school_assignments",
  "improve_handwriting",
]);
export type WritingGoal = z.infer<typeof writingGoalSchema>;

export const writingSkillSchema = z.enum([
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
export type WritingSkill = z.infer<typeof writingSkillSchema>;

export const assignmentTypeSchema = z.enum([
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
export type AssignmentType = z.infer<typeof assignmentTypeSchema>;

export const studentAssignmentStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "submitted",
  "reviewing",
  "feedback_ready",
  "revision_in_progress",
  "completed",
]);
export type StudentAssignmentStatus = z.infer<typeof studentAssignmentStatusSchema>;

export const subscriptionStatusSchema = z.enum([
  "free",
  "trial",
  "active",
  "past_due",
  "canceled",
  "expired",
  "refunded",
  "grace_period",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const subscriptionPlanIdSchema = z.enum(["WriterHabit_plus_monthly", "WriterHabit_plus_yearly"]);
export type SubscriptionPlanId = z.infer<typeof subscriptionPlanIdSchema>;

export const isoDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export type IsoDateString = z.infer<typeof isoDateStringSchema>;

export const isoDateTimeStringSchema = z.string().datetime();
export type IsoDateTimeString = z.infer<typeof isoDateTimeStringSchema>;
