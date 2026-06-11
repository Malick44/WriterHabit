import type { GradeLevel, WritingSkill } from "@WriterHabit/shared";
import { z } from "zod";

import type { GradeBand } from "@/design/tokens";
import type { TranslationKey } from "@/i18n";

export const progressScenarioSchema = z.enum(["success", "empty", "error", "offline"]);
export type ProgressScenario = z.infer<typeof progressScenarioSchema>;

export const progressConnectionStatusSchema = z.enum(["online", "offline_cached"]);
export type ProgressConnectionStatus = z.infer<typeof progressConnectionStatusSchema>;

const gradeLevelSchema = z.custom<GradeLevel>(
  (value) => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12,
);

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

export const progressMetricIdSchema = z.enum([
  "assignments_completed",
  "current_streak",
  "weekly_minutes",
  "words_written",
  "revisions_completed",
  "rubric_improvement",
  "ai_feedback_applied",
  "handwriting_time",
  "badges_unlocked",
]);
export type ProgressMetricId = z.infer<typeof progressMetricIdSchema>;

export const progressBadgeIdSchema = z.enum([
  "first_assignment",
  "three_day_streak",
  "weekly_goal",
  "revision_builder",
  "feedback_applier",
  "word_builder",
  "handwriting_helper",
  "rubric_riser",
]);
export type ProgressBadgeId = z.infer<typeof progressBadgeIdSchema>;

export const progressBadgeStatusSchema = z.enum(["locked", "unlocked", "new"]);
export type ProgressBadgeStatus = z.infer<typeof progressBadgeStatusSchema>;

export const progressDailyActivitySchema = z.object({
  aiFeedbackApplied: z.number().int().nonnegative(),
  assignmentsCompleted: z.number().int().nonnegative(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  handwritingMinutes: z.number().int().nonnegative(),
  minutes: z.number().int().nonnegative(),
  revisionsCompleted: z.number().int().nonnegative(),
  rubricImprovement: z.number().int().nonnegative(),
  skillsPracticed: z.array(writingSkillSchema),
  words: z.number().int().nonnegative(),
});
export type ProgressDailyActivity = z.infer<typeof progressDailyActivitySchema> & {
  skillsPracticed: WritingSkill[];
};

export const progressSkillTrendPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  score: z.number().int().min(0).max(100),
});
export type ProgressSkillTrendPoint = z.infer<typeof progressSkillTrendPointSchema>;

export const progressSkillSchema = z.object({
  aiFeedbackApplied: z.number().int().nonnegative(),
  currentScore: z.number().int().min(0).max(100),
  handwritingMinutes: z.number().int().nonnegative(),
  minutesPracticed: z.number().int().nonnegative(),
  practiceCount: z.number().int().nonnegative(),
  previousScore: z.number().int().min(0).max(100),
  recentTrend: z.array(progressSkillTrendPointSchema).min(1).max(8),
  revisionsCompleted: z.number().int().nonnegative(),
  rubricImprovement: z.number().int().nonnegative(),
  skill: writingSkillSchema,
  wordsWritten: z.number().int().nonnegative(),
});
export type ProgressSkill = z.infer<typeof progressSkillSchema> & {
  skill: WritingSkill;
};

export const progressTotalsSchema = z.object({
  aiFeedbackApplied: z.number().int().nonnegative(),
  assignmentsCompleted: z.number().int().nonnegative(),
  handwritingMinutes: z.number().int().nonnegative(),
  minutesThisWeek: z.number().int().nonnegative(),
  revisionsCompleted: z.number().int().nonnegative(),
  rubricImprovement: z.number().int().nonnegative(),
  weeklyMinutesGoal: z.number().int().positive(),
  wordsWritten: z.number().int().nonnegative(),
});
export type ProgressTotals = z.infer<typeof progressTotalsSchema>;

export const progressWeeklyReviewSchema = z.object({
  highlights: z.array(z.string().min(1)).max(4),
  nextFocusSkill: writingSkillSchema.nullable(),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekLabel: z.string().min(1),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type ProgressWeeklyReview = z.infer<typeof progressWeeklyReviewSchema> & {
  nextFocusSkill: WritingSkill | null;
};

export const progressApiResponseSchema = z.object({
  connectionStatus: progressConnectionStatusSchema,
  dailyActivity: z.array(progressDailyActivitySchema).max(14),
  generatedAt: z.string().datetime(),
  gradeLevel: gradeLevelSchema,
  newBadgeIds: z.array(progressBadgeIdSchema),
  skills: z.array(progressSkillSchema),
  studentId: z.string().min(1),
  totals: progressTotalsSchema,
  weeklyReview: progressWeeklyReviewSchema,
});
export type ProgressApiResponse = z.infer<typeof progressApiResponseSchema> & {
  gradeLevel: GradeLevel;
  skills: ProgressSkill[];
  dailyActivity: ProgressDailyActivity[];
  weeklyReview: ProgressWeeklyReview;
};

export interface ProgressGradeAdaptation {
  band: GradeBand;
  badgePreviewCount: number;
  showDetailedSkillDeltas: boolean;
  showHandwritingMetric: boolean;
  showRubricTrend: boolean;
  showProductivityMetrics: boolean;
  visibleMetricIds: ProgressMetricId[];
  visibleSkillCount: number;
}

export interface ProgressStreakSummary {
  bestDays: number;
  currentDays: number;
  daysUntilNextMilestone: number;
  lastPracticeDate: string | null;
  nextMilestoneDays: number;
  practicedToday: boolean;
  progressValue: number;
  referenceDate: string;
  requiresPracticeToday: boolean;
}

export interface ProgressBadgeDefinition {
  descriptionKey: TranslationKey;
  id: ProgressBadgeId;
  requirementKey: TranslationKey;
  target: number;
  titleKey: TranslationKey;
  tokenLabel: string;
}

export interface ProgressBadgeViewModel extends ProgressBadgeDefinition {
  progressValue: number;
  status: ProgressBadgeStatus;
  unlocked: boolean;
}

export interface ProgressMetricViewModel {
  accessibilityLabelKey: TranslationKey;
  descriptionKey: TranslationKey;
  id: ProgressMetricId;
  progressValue?: number;
  titleKey: TranslationKey;
  valueKey: TranslationKey;
  valueParams: Record<string, number | string>;
}

export interface ProgressSkillViewModel {
  aiFeedbackApplied: number;
  currentScore: number;
  handwritingMinutes: number;
  labelKey: TranslationKey;
  minutesPracticed: number;
  nextStepKey: TranslationKey;
  practiceCount: number;
  previousScore: number;
  progressValue: number;
  recentTrend: ProgressSkillTrendPoint[];
  revisionsCompleted: number;
  rubricImprovement: number;
  skill: WritingSkill;
  weeklyDelta: number;
  wordsWritten: number;
}

export interface ProgressWeeklyReviewViewModel {
  highlights: string[];
  isEmpty: boolean;
  metrics: ProgressMetricViewModel[];
  nextFocusSkill: ProgressSkillViewModel | null;
  weekLabel: string;
}

export interface ProgressDashboardViewModel {
  badgePreview: ProgressBadgeViewModel[];
  badges: ProgressBadgeViewModel[];
  dailyActivity: ProgressDailyActivity[];
  gradeAdaptation: ProgressGradeAdaptation;
  gradeLevel: GradeLevel;
  isEmpty: boolean;
  isOffline: boolean;
  metrics: ProgressMetricViewModel[];
  skills: ProgressSkillViewModel[];
  streak: ProgressStreakSummary;
  studentFirstName: string;
  totals: ProgressTotals;
  visibleMetrics: ProgressMetricViewModel[];
  visibleSkills: ProgressSkillViewModel[];
  weeklyReview: ProgressWeeklyReviewViewModel;
}
