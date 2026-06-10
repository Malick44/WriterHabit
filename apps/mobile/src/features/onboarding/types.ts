import type { GradeLevel, WritingGoal } from "@writewise/shared";
import { z } from "zod";

import { routes, type AppRoute } from "@/core/navigation/routeNames";
import type { GradeBand } from "@/design/tokens";
import type { TranslationKey } from "@/i18n";

export type OnboardingRole = "student" | "parent" | "teacher";
export type WritingConfidenceLevel = "getting_started" | "building" | "steady" | "confident";
export type DailyPracticeMinutes = 5 | 10 | 15 | 20 | 30;
export type OnboardingStep =
  | "role"
  | "grade"
  | "goals"
  | "confidence"
  | "dailyPractice"
  | "planSummary";
export type OnboardingStatus = "idle" | "loading" | "success" | "error";
export type OnboardingErrorCode =
  | "read_failed"
  | "write_failed"
  | "validation_failed"
  | "plan_failed"
  | "completion_failed";

export type OnboardingValidationError =
  | "role_required"
  | "grade_required"
  | "goals_required"
  | "confidence_required"
  | "daily_practice_required";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "role",
  "grade",
  "goals",
  "confidence",
  "dailyPractice",
  "planSummary",
];

export const ONBOARDING_ROLE_OPTIONS = ["student", "parent", "teacher"] as const satisfies readonly OnboardingRole[];

export const GRADE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const satisfies readonly GradeLevel[];

export const GRADE_GROUPS = [
  {
    band: "elementary",
    grades: [1, 2, 3, 4, 5],
    titleKey: "onboarding.gradeSelection.elementaryTitle",
    descriptionKey: "onboarding.gradeSelection.elementaryDescription",
  },
  {
    band: "middle",
    grades: [6, 7, 8],
    titleKey: "onboarding.gradeSelection.middleTitle",
    descriptionKey: "onboarding.gradeSelection.middleDescription",
  },
  {
    band: "high",
    grades: [9, 10, 11, 12],
    titleKey: "onboarding.gradeSelection.highTitle",
    descriptionKey: "onboarding.gradeSelection.highDescription",
  },
] as const satisfies readonly {
  band: GradeBand;
  grades: readonly GradeLevel[];
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}[];

export const WRITING_GOAL_OPTIONS = [
  "improve_spelling",
  "write_better_sentences",
  "write_paragraphs",
  "write_essays",
  "creative_writing",
  "test_prep",
  "improve_grammar",
  "school_assignments",
  "improve_handwriting",
] as const satisfies readonly WritingGoal[];

export const MAX_WRITING_GOALS = 4;

export const CONFIDENCE_OPTIONS = [
  "getting_started",
  "building",
  "steady",
  "confident",
] as const satisfies readonly WritingConfidenceLevel[];

export const DAILY_PRACTICE_OPTIONS = [5, 10, 15, 20, 30] as const satisfies readonly DailyPracticeMinutes[];

const gradeLevelSchema = z.custom<GradeLevel>(
  (value) => GRADE_LEVELS.includes(value as GradeLevel),
  "onboarding.errors.gradeRequired",
);

const writingGoalSchema = z.enum(WRITING_GOAL_OPTIONS);
const confidenceSchema = z.enum(CONFIDENCE_OPTIONS);
const dailyPracticeSchema = z.custom<DailyPracticeMinutes>(
  (value) => DAILY_PRACTICE_OPTIONS.includes(value as DailyPracticeMinutes),
  "onboarding.errors.dailyPracticeRequired",
);

export const onboardingProgressSchema = z.object({
  role: z.enum(ONBOARDING_ROLE_OPTIONS).optional(),
  gradeLevel: gradeLevelSchema.optional(),
  writingGoals: z.array(writingGoalSchema).max(MAX_WRITING_GOALS).catch([]),
  confidenceLevel: confidenceSchema.optional(),
  dailyPracticeMinutes: dailyPracticeSchema.optional(),
  updatedAt: z.string().datetime().optional(),
});

export const completedOnboardingProfileSchema = z.object({
  role: z.literal("student", { message: "onboarding.errors.roleRequired" }),
  gradeLevel: gradeLevelSchema,
  writingGoals: z.array(writingGoalSchema).min(1).max(MAX_WRITING_GOALS),
  confidenceLevel: confidenceSchema,
  dailyPracticeMinutes: dailyPracticeSchema,
});

export const personalizedPlanSchema = z.object({
  assignmentFocus: z.enum(["sentence_practice", "paragraph_practice", "essay_practice"]),
  confidenceLevel: confidenceSchema,
  dailyPracticeMinutes: dailyPracticeSchema,
  firstWeekGoals: z.array(writingGoalSchema).min(1),
  gradeBand: z.enum(["elementary", "middle", "high"]),
  gradeLevel: gradeLevelSchema,
  weeklyPracticeMinutes: z.number().int().positive(),
});

export type OnboardingProgress = z.infer<typeof onboardingProgressSchema>;
export type CompletedOnboardingProfile = z.infer<typeof completedOnboardingProfileSchema>;
export type PersonalizedPlan = z.infer<typeof personalizedPlanSchema>;

export const defaultOnboardingProgress: OnboardingProgress = {
  writingGoals: [],
};

export const onboardingStepRoutes: Record<OnboardingStep, AppRoute> = {
  confidence: routes.onboardingWritingConfidence,
  dailyPractice: routes.onboardingDailyPracticeGoal,
  goals: routes.onboardingWritingGoals,
  grade: routes.onboardingGradeSelection,
  planSummary: routes.onboardingPlanSummary,
  role: routes.onboardingRoleSelection,
};

export const onboardingValidationMessageKeys: Record<OnboardingValidationError, TranslationKey> = {
  confidence_required: "onboarding.errors.confidenceRequired",
  daily_practice_required: "onboarding.errors.dailyPracticeRequired",
  goals_required: "onboarding.errors.goalsRequired",
  grade_required: "onboarding.errors.gradeRequired",
  role_required: "onboarding.errors.roleRequired",
};

export const onboardingErrorMessageKeys: Record<OnboardingErrorCode, TranslationKey> = {
  completion_failed: "onboarding.errors.completionFailed",
  plan_failed: "onboarding.errors.planFailed",
  read_failed: "onboarding.errors.readFailed",
  validation_failed: "onboarding.errors.validationFailed",
  write_failed: "onboarding.errors.writeFailed",
};

export function getStepProgress(step: OnboardingStep): number {
  const index = ONBOARDING_STEPS.indexOf(step);
  return index < 0 ? 0 : (index + 1) / ONBOARDING_STEPS.length;
}

export function getOnboardingValidationError(progress: OnboardingProgress): OnboardingValidationError | null {
  if (!progress.role) {
    return "role_required";
  }

  if (!progress.gradeLevel) {
    return "grade_required";
  }

  if (progress.writingGoals.length === 0) {
    return "goals_required";
  }

  if (!progress.confidenceLevel) {
    return "confidence_required";
  }

  if (!progress.dailyPracticeMinutes) {
    return "daily_practice_required";
  }

  return null;
}

export function getFirstIncompleteOnboardingStep(progress: OnboardingProgress): OnboardingStep | null {
  const error = getOnboardingValidationError(progress);

  switch (error) {
    case "role_required":
      return "role";
    case "grade_required":
      return "grade";
    case "goals_required":
      return "goals";
    case "confidence_required":
      return "confidence";
    case "daily_practice_required":
      return "dailyPractice";
    case null:
      return null;
  }
}

export function getCompletedOnboardingProfile(progress: OnboardingProgress) {
  return completedOnboardingProfileSchema.safeParse(progress);
}
