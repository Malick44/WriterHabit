import type { AssignmentType, GradeLevel, WritingSkill } from "@writewise/shared";
import { z } from "zod";

export const MAX_AI_COACH_DRAFT_EXCERPT_LENGTH = 1_200;
export const MAX_AI_COACH_CANVAS_EXCERPT_LENGTH = 600;
export const MAX_AI_COACH_STUDENT_REQUEST_LENGTH = 360;

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

export const aiCoachActionSchema = z.enum([
  "hint",
  "brainstorm",
  "sentence_check",
  "explain_mistake",
  "revision_help",
  "stronger_word",
  "ask_question",
]);
export type AiCoachAction = z.infer<typeof aiCoachActionSchema>;

export const aiCoachScenarioSchema = z.enum(["success", "empty", "error", "offline", "safety_blocked"]);
export type AiCoachScenario = z.infer<typeof aiCoachScenarioSchema>;

export const aiCoachWritingLevelSchema = z.enum(["early_elementary", "upper_elementary", "middle", "high"]);
export type AiCoachWritingLevel = z.infer<typeof aiCoachWritingLevelSchema>;

export const aiCoachConnectionStatusSchema = z.enum(["online", "offline_cached"]);
export type AiCoachConnectionStatus = z.infer<typeof aiCoachConnectionStatusSchema>;

export const aiCoachRequestStatusSchema = z.enum([
  "idle",
  "loading",
  "empty",
  "error",
  "offline",
  "safety_blocked",
  "success",
]);
export type AiCoachRequestStatus = z.infer<typeof aiCoachRequestStatusSchema>;

export const aiCoachSafetyFlagSchema = z.enum([
  "answer_request",
  "assignment_completion_request",
  "empty_context",
  "full_rewrite_request",
  "unsafe_output",
  "unsupported_action",
]);
export type AiCoachSafetyFlag = z.infer<typeof aiCoachSafetyFlagSchema>;

export const aiCoachDraftMetricsSchema = z.object({
  paragraphCount: z.number().int().nonnegative(),
  sentenceCount: z.number().int().nonnegative(),
  wordCount: z.number().int().nonnegative(),
});
export type AiCoachDraftMetrics = z.infer<typeof aiCoachDraftMetricsSchema>;

export const aiCoachCanvasContextSchema = z.object({
  canvasId: z.string().min(1),
  pageCount: z.number().int().nonnegative(),
  recognizedTextExcerpt: z.string().max(MAX_AI_COACH_CANVAS_EXCERPT_LENGTH).optional(),
  title: z.string().min(1),
  updatedLabel: z.string().min(1).optional(),
});
export type AiCoachCanvasContext = z.infer<typeof aiCoachCanvasContextSchema>;

export const aiCoachRubricCriterionSchema = z.object({
  description: z.string().min(1),
  id: z.string().min(1),
  label: z.string().min(1),
});
export type AiCoachRubricCriterion = z.infer<typeof aiCoachRubricCriterionSchema>;

export const aiCoachContextSchema = z.object({
  assignmentId: z.string().min(1),
  assignmentPrompt: z.string().min(1),
  assignmentTitle: z.string().min(1),
  assignmentType: assignmentTypeSchema,
  canvasContext: aiCoachCanvasContextSchema.nullable(),
  connectionStatus: aiCoachConnectionStatusSchema,
  draftExcerpt: z.string().max(MAX_AI_COACH_DRAFT_EXCERPT_LENGTH),
  gradeLevel: gradeLevelSchema,
  metrics: aiCoachDraftMetricsSchema,
  requestedAction: aiCoachActionSchema,
  rubric: z.array(aiCoachRubricCriterionSchema).max(8),
  skillFocus: z.array(writingSkillSchema).min(1).max(8),
  studentId: z.string().min(1),
  studentRequest: z.string().max(MAX_AI_COACH_STUDENT_REQUEST_LENGTH).optional(),
  writingLevel: aiCoachWritingLevelSchema,
});
export type AiCoachContext = z.infer<typeof aiCoachContextSchema> & {
  assignmentType: AssignmentType;
  gradeLevel: GradeLevel;
  skillFocus: WritingSkill[];
};

export const aiCoachPromptSchema = z.object({
  action: aiCoachActionSchema,
  contextSummary: z.string().min(1),
  rules: z.array(z.string().min(1)).min(1),
  system: z.string().min(1),
  user: z.string().min(1),
});
export type AiCoachPrompt = z.infer<typeof aiCoachPromptSchema>;

export const aiCoachResponseSchema = z.object({
  action: aiCoachActionSchema,
  generatedAt: z.string().datetime(),
  guidingQuestion: z.string().min(1).optional(),
  improvement: z.string().min(1).optional(),
  learningMode: z.literal(true),
  nextStep: z.string().min(1).optional(),
  safetyFlags: z.array(aiCoachSafetyFlagSchema),
  state: z.enum(["success", "empty", "safety_blocked"]),
  strength: z.string().min(1).optional(),
});
export type AiCoachResponse = z.infer<typeof aiCoachResponseSchema>;

export interface AiCoachState {
  error: string | null;
  lastAction: AiCoachAction | null;
  response: AiCoachResponse | null;
  status: AiCoachRequestStatus;
}

export interface AiCoachRequestInput {
  context: AiCoachContext;
}

export interface AiCoachContextBuilderInput {
  assignment: {
    assignmentType: AssignmentType;
    id: string;
    prompt: string;
    rubric: AiCoachRubricCriterion[];
    skillFocus: WritingSkill[];
    title: string;
  };
  canvasContext?: AiCoachCanvasContext | null;
  connectionStatus?: AiCoachConnectionStatus;
  draftText: string;
  gradeLevel: GradeLevel;
  metrics: AiCoachDraftMetrics;
  requestedAction: AiCoachAction;
  studentId: string;
  studentRequest?: string;
}
