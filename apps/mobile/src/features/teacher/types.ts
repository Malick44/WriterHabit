import type { AssignmentType, GradeLevel, WritingSkill } from "@writewise/shared";
import { z } from "zod";

import type { GradeBand } from "@/design/tokens";

const gradeLevelSchema = z.custom<GradeLevel>(
  (value) => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12,
);

export const teacherWritingSkillSchema = z.enum([
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

export const teacherScenarioSchema = z.enum(["success", "empty", "error", "offline"]);
export type TeacherScenario = z.infer<typeof teacherScenarioSchema>;

export const teacherClassSummarySchema = z.object({
  activeAssignmentCount: z.number().int().nonnegative(),
  averageCompletionPercent: z.number().int().min(0).max(100),
  averageSkillScore: z.number().int().min(0).max(100),
  gradeLevel: gradeLevelSchema,
  id: z.string().min(1),
  name: z.string().min(1),
  studentCount: z.number().int().nonnegative(),
  submissionsNeedingReview: z.number().int().nonnegative(),
  trendLabel: z.string().min(1),
  weeklyWritingMinutes: z.number().int().nonnegative(),
});

export const teacherRubricCriterionSchema = z.object({
  description: z.string().min(1),
  id: z.string().min(1),
  label: z.string().min(1),
  maxScore: z.number().int().positive(),
});

export const teacherAssignmentSummarySchema = z.object({
  allowCanvas: z.boolean(),
  assignmentType: assignmentTypeSchema,
  classId: z.string().min(1),
  className: z.string().min(1),
  completionPercent: z.number().int().min(0).max(100),
  createdAt: z.string().datetime(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueLabel: z.string().min(1),
  gradeLevel: gradeLevelSchema,
  id: z.string().min(1),
  prompt: z.string().min(1),
  rubric: z.array(teacherRubricCriterionSchema).min(1),
  skillFocus: z.array(teacherWritingSkillSchema).min(1),
  status: z.enum(["draft", "active", "closed"]),
  submissionsCount: z.number().int().nonnegative(),
  title: z.string().min(1),
});

export const teacherSubmissionSummarySchema = z.object({
  assignmentId: z.string().min(1),
  assignmentTitle: z.string().min(1),
  classId: z.string().min(1),
  className: z.string().min(1),
  gradeLevel: gradeLevelSchema,
  hasCanvas: z.boolean(),
  id: z.string().min(1),
  priority: z.enum(["normal", "high"]),
  scorePercent: z.number().int().min(0).max(100).nullable(),
  status: z.enum(["awaiting_review", "reviewed", "revision_requested", "completed"]),
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  submittedLabel: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
});

export const teacherDashboardApiResponseSchema = z.object({
  assignments: z.array(teacherAssignmentSummarySchema),
  classes: z.array(teacherClassSummarySchema),
  connectionStatus: z.enum(["online", "offline_cached"]),
  generatedAt: z.string().datetime(),
  safetyNote: z.string().min(1),
  submissions: z.array(teacherSubmissionSummarySchema),
  teacherId: z.string().min(1),
});

export const teacherAssignmentsApiResponseSchema = z.object({
  assignments: z.array(teacherAssignmentSummarySchema),
  classes: z.array(teacherClassSummarySchema),
  connectionStatus: z.enum(["online", "offline_cached"]),
  generatedAt: z.string().datetime(),
  teacherId: z.string().min(1),
});

export const teacherSubmissionsApiResponseSchema = z.object({
  connectionStatus: z.enum(["online", "offline_cached"]),
  generatedAt: z.string().datetime(),
  submissions: z.array(teacherSubmissionSummarySchema),
  teacherId: z.string().min(1),
});

export const teacherStudentProgressSchema = z.object({
  assignmentCompletionPercent: z.number().int().min(0).max(100),
  averageRubricScore: z.number().int().min(0).max(100),
  displayName: z.string().min(1),
  focusSkill: teacherWritingSkillSchema,
  gradeLevel: gradeLevelSchema,
  id: z.string().min(1),
  lastSubmissionLabel: z.string().min(1),
  needsSupport: z.boolean(),
  revisionRatePercent: z.number().int().min(0).max(100),
});

export const teacherSkillTrendSchema = z.object({
  averageScore: z.number().int().min(0).max(100),
  changeLabel: z.string().min(1),
  label: z.string().min(1),
  skill: teacherWritingSkillSchema,
  studentCount: z.number().int().nonnegative(),
});

export const teacherInstructionalGroupSchema = z.object({
  action: z.string().min(1),
  description: z.string().min(1),
  id: z.string().min(1),
  skill: teacherWritingSkillSchema,
  studentNames: z.array(z.string().min(1)),
  title: z.string().min(1),
});

export const teacherClassProgressApiResponseSchema = z.object({
  classSummary: teacherClassSummarySchema.nullable(),
  connectionStatus: z.enum(["online", "offline_cached"]),
  generatedAt: z.string().datetime(),
  instructionalGroups: z.array(teacherInstructionalGroupSchema),
  skillTrends: z.array(teacherSkillTrendSchema),
  students: z.array(teacherStudentProgressSchema),
});

export const teacherCanvasPreviewSchema = z.object({
  pageCount: z.number().int().nonnegative(),
  title: z.string().min(1),
});

export const teacherSubmissionRubricRowSchema = z.object({
  coachingNote: z.string().min(1),
  criterionId: z.string().min(1),
  label: z.string().min(1),
  maxScore: z.number().int().positive(),
  score: z.number().int().nonnegative(),
});

export const teacherSubmissionReviewSchema = z.object({
  assignmentPrompt: z.string().min(1),
  assignmentTitle: z.string().min(1),
  canvasPreview: teacherCanvasPreviewSchema.nullable(),
  className: z.string().min(1),
  gradeLevel: gradeLevelSchema,
  id: z.string().min(1),
  revisionTask: z.string().min(1),
  rubric: z.array(teacherSubmissionRubricRowSchema).min(1),
  safetyNote: z.string().min(1),
  studentName: z.string().min(1),
  submittedLabel: z.string().min(1),
  teacherComment: z.string(),
  writingPreview: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
});

export const teacherSubmissionReviewApiResponseSchema = z.object({
  connectionStatus: z.enum(["online", "offline_cached"]),
  generatedAt: z.string().datetime(),
  review: teacherSubmissionReviewSchema.nullable(),
});

export interface CreateTeacherAssignmentFormValues {
  allowCanvas: boolean;
  classId: string;
  dueDate: string;
  gradeLevel: string;
  prompt: string;
  rubricText: string;
  skillFocus: WritingSkill[];
  title: string;
}

export function parseTeacherRubricText(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export const createTeacherAssignmentFormSchema = z
  .object({
    allowCanvas: z.boolean(),
    classId: z.string().min(1, "teacher.create.errors.classRequired"),
    dueDate: z
      .string()
      .min(1, "teacher.create.errors.dueDateRequired")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "teacher.create.errors.dueDateInvalid"),
    gradeLevel: z
      .string()
      .min(1, "teacher.create.errors.gradeRequired")
      .refine((value) => {
        const grade = Number(value);

        return Number.isInteger(grade) && grade >= 1 && grade <= 12;
      }, "teacher.create.errors.gradeInvalid"),
    prompt: z
      .string()
      .trim()
      .min(20, "teacher.create.errors.promptTooShort")
      .max(1200, "teacher.create.errors.promptTooLong"),
    rubricText: z.string().trim().min(10, "teacher.create.errors.rubricRequired"),
    skillFocus: z
      .array(teacherWritingSkillSchema)
      .min(1, "teacher.create.errors.skillRequired")
      .max(3, "teacher.create.errors.skillTooMany"),
    title: z
      .string()
      .trim()
      .min(3, "teacher.create.errors.titleRequired")
      .max(80, "teacher.create.errors.titleTooLong"),
  })
  .superRefine((values, context) => {
    if (parseTeacherRubricText(values.rubricText).length < 2) {
      context.addIssue({
        code: "custom",
        message: "teacher.create.errors.rubricTooShort",
        path: ["rubricText"],
      });
    }
  });

export type CreateTeacherAssignmentInput = {
  allowCanvas: boolean;
  assignmentType: AssignmentType;
  classId: string;
  dueDate: string;
  gradeLevel: GradeLevel;
  prompt: string;
  rubric: string[];
  skillFocus: WritingSkill[];
  title: string;
};

export function normalizeCreateTeacherAssignmentForm(
  values: CreateTeacherAssignmentFormValues,
): CreateTeacherAssignmentInput {
  const gradeLevel = Number(values.gradeLevel) as GradeLevel;
  const assignmentType: AssignmentType =
    gradeLevel <= 5 ? "sentence_practice" : gradeLevel <= 8 ? "paragraph_writing" : "essay_writing";

  return {
    allowCanvas: values.allowCanvas,
    assignmentType,
    classId: values.classId,
    dueDate: values.dueDate,
    gradeLevel,
    prompt: values.prompt.trim(),
    rubric: parseTeacherRubricText(values.rubricText),
    skillFocus: values.skillFocus,
    title: values.title.trim(),
  };
}

export type TeacherClassSummary = z.infer<typeof teacherClassSummarySchema> & {
  gradeLevel: GradeLevel;
};

export type TeacherRubricCriterion = z.infer<typeof teacherRubricCriterionSchema>;

export type TeacherAssignmentSummary = z.infer<typeof teacherAssignmentSummarySchema> & {
  assignmentType: AssignmentType;
  gradeLevel: GradeLevel;
  skillFocus: WritingSkill[];
};

export type TeacherSubmissionSummary = z.infer<typeof teacherSubmissionSummarySchema> & {
  gradeLevel: GradeLevel;
};

export type TeacherDashboardApiResponse = z.infer<typeof teacherDashboardApiResponseSchema> & {
  assignments: TeacherAssignmentSummary[];
  classes: TeacherClassSummary[];
  submissions: TeacherSubmissionSummary[];
};

export type TeacherAssignmentsApiResponse = z.infer<typeof teacherAssignmentsApiResponseSchema> & {
  assignments: TeacherAssignmentSummary[];
  classes: TeacherClassSummary[];
};

export type TeacherSubmissionsApiResponse = z.infer<typeof teacherSubmissionsApiResponseSchema> & {
  submissions: TeacherSubmissionSummary[];
};

export type TeacherStudentProgress = z.infer<typeof teacherStudentProgressSchema> & {
  focusSkill: WritingSkill;
  gradeLevel: GradeLevel;
};

export type TeacherSkillTrend = z.infer<typeof teacherSkillTrendSchema> & {
  skill: WritingSkill;
};

export type TeacherInstructionalGroup = z.infer<typeof teacherInstructionalGroupSchema> & {
  skill: WritingSkill;
};

export type TeacherClassProgressApiResponse = z.infer<typeof teacherClassProgressApiResponseSchema> & {
  classSummary: TeacherClassSummary | null;
  instructionalGroups: TeacherInstructionalGroup[];
  skillTrends: TeacherSkillTrend[];
  students: TeacherStudentProgress[];
};

export type TeacherCanvasPreview = z.infer<typeof teacherCanvasPreviewSchema>;
export type TeacherSubmissionRubricRow = z.infer<typeof teacherSubmissionRubricRowSchema>;

export type TeacherSubmissionReview = z.infer<typeof teacherSubmissionReviewSchema> & {
  gradeLevel: GradeLevel;
};

export type TeacherSubmissionReviewApiResponse = z.infer<
  typeof teacherSubmissionReviewApiResponseSchema
> & {
  review: TeacherSubmissionReview | null;
};

export interface TeacherGradeAdaptation {
  band: GradeBand;
  showDetailedRubric: boolean;
  visibleAssignmentCount: number;
  visibleClassCount: number;
  visibleRubricRows: number;
  visibleSkillCount: number;
  visibleStudentCount: number;
  visibleSubmissionCount: number;
}

export interface TeacherDashboardViewModel {
  assignments: TeacherAssignmentSummary[];
  classes: TeacherClassSummary[];
  gradeAdaptation: TeacherGradeAdaptation;
  isEmpty: boolean;
  isOffline: boolean;
  metrics: {
    activeAssignments: number;
    averageCompletionPercent: number;
    reviewQueue: number;
    totalStudents: number;
  };
  safetyNote: string;
  submissions: TeacherSubmissionSummary[];
}

export interface TeacherAssignmentsViewModel {
  assignments: TeacherAssignmentSummary[];
  classes: TeacherClassSummary[];
  gradeAdaptation: TeacherGradeAdaptation;
  isEmpty: boolean;
  isOffline: boolean;
}

export interface TeacherSubmissionsViewModel {
  awaitingReview: TeacherSubmissionSummary[];
  gradeAdaptation: TeacherGradeAdaptation;
  isEmpty: boolean;
  isOffline: boolean;
  reviewed: TeacherSubmissionSummary[];
  submissions: TeacherSubmissionSummary[];
}

export interface TeacherClassProgressViewModel {
  classSummary: TeacherClassSummary;
  gradeAdaptation: TeacherGradeAdaptation;
  instructionalGroups: TeacherInstructionalGroup[];
  isEmpty: boolean;
  isOffline: boolean;
  skillTrends: TeacherSkillTrend[];
  students: TeacherStudentProgress[];
  supportStudents: TeacherStudentProgress[];
}

export interface TeacherSubmissionReviewViewModel {
  gradeAdaptation: TeacherGradeAdaptation;
  isOffline: boolean;
  review: TeacherSubmissionReview;
  rubricEarned: number;
  rubricMax: number;
  rubricScoreValue: number;
  visibleRubric: TeacherSubmissionRubricRow[];
}
