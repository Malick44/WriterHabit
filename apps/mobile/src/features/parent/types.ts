import type { AssignmentType, GradeLevel, WritingSkill } from "@WriterHabit/shared";
import { z } from "zod";

import type { GradeBand } from "@/design/tokens";

const gradeLevelSchema = z.custom<GradeLevel>(
  (value) => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12,
);

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

export const parentScenarioSchema = z.enum(["success", "empty", "error", "offline"]);
export type ParentScenario = z.infer<typeof parentScenarioSchema>;

export const parentStudentSummarySchema = z.object({
  avatarInitials: z.string().min(1).max(3),
  displayName: z.string().min(1),
  gradeLevel: gradeLevelSchema,
  id: z.string().min(1),
  relationshipLabel: z.string().min(1),
  schoolLabel: z.string().min(1),
});

export const parentWeeklyProgressSchema = z.object({
  areaToPractice: writingSkillSchema,
  areaToPracticeDescription: z.string().min(1),
  areaToPracticeLabel: z.string().min(1),
  assignedAssignments: z.number().int().nonnegative(),
  celebration: z.string().min(1),
  completedAssignments: z.number().int().nonnegative(),
  minutesCompleted: z.number().int().nonnegative(),
  minutesGoal: z.number().int().positive(),
  sessionsCompleted: z.number().int().nonnegative(),
  skillImprovementPercent: z.number().int().min(-100).max(100),
  streakDays: z.number().int().nonnegative(),
  weekLabel: z.string().min(1),
});

export const parentSkillProgressSchema = z.object({
  currentScore: z.number().int().min(0).max(100),
  label: z.string().min(1),
  nextPractice: z.string().min(1),
  previousScore: z.number().int().min(0).max(100),
  skill: writingSkillSchema,
  trendDescription: z.string().min(1),
});

export const parentAssignmentSummarySchema = z.object({
  assignmentType: assignmentTypeSchema,
  feedbackSummary: z.string().min(1),
  hasCanvas: z.boolean(),
  scorePercent: z.number().int().min(0).max(100),
  skillFocus: z.array(writingSkillSchema).min(1),
  status: z.enum(["feedback_ready", "revision_in_progress", "completed"]),
  studentId: z.string().min(1),
  submissionId: z.string().min(1),
  submittedLabel: z.string().min(1),
  title: z.string().min(1),
});

export const parentSettingsSchema = z.object({
  aiCoachAccess: z.enum(["hints_and_revision", "restricted"]),
  assignmentAlertsEnabled: z.boolean(),
  digestFrequency: z.enum(["weekly", "twice_weekly"]),
  practiceReminderEnabled: z.boolean(),
  quietHoursLabel: z.string().min(1),
  shareWeeklySummaryWithTeacher: z.boolean(),
  weeklyReportEmailEnabled: z.boolean(),
});

export const parentDashboardApiResponseSchema = z.object({
  assignments: z.array(parentAssignmentSummarySchema),
  connectionStatus: z.enum(["online", "offline_cached"]),
  generatedAt: z.string().datetime(),
  parentId: z.string().min(1),
  selectedStudentId: z.string().min(1).nullable(),
  settingsSummary: parentSettingsSchema,
  skillProgress: z.array(parentSkillProgressSchema),
  students: z.array(parentStudentSummarySchema),
  weeklyProgress: parentWeeklyProgressSchema.nullable(),
});

export const parentStudentReportApiResponseSchema = z.object({
  assignments: z.array(parentAssignmentSummarySchema),
  connectionStatus: z.enum(["online", "offline_cached"]),
  familyNote: z.string().min(1).nullable(),
  generatedAt: z.string().datetime(),
  nextSteps: z.array(z.string().min(1)),
  practiceFocus: z.array(z.string().min(1)),
  skillProgress: z.array(parentSkillProgressSchema),
  strengths: z.array(z.string().min(1)),
  student: parentStudentSummarySchema.nullable(),
  weeklyProgress: parentWeeklyProgressSchema.nullable(),
});

export const parentCanvasPreviewSchema = z.object({
  canvasId: z.string().min(1),
  strokeCount: z.number().int().nonnegative(),
  templateLabel: z.string().min(1),
  title: z.string().min(1),
});

export const parentAiFeedbackSchema = z.object({
  improvement: z.string().min(1),
  revisionTask: z.string().min(1),
  strength: z.string().min(1),
});

export const parentRubricRowSchema = z.object({
  description: z.string().min(1),
  id: z.string().min(1),
  label: z.string().min(1),
  maxScore: z.number().int().positive(),
  score: z.number().int().nonnegative(),
});

export const parentAssignmentReviewSchema = z.object({
  aiFeedback: parentAiFeedbackSchema,
  assignmentPrompt: z.string().min(1),
  assignmentTitle: z.string().min(1),
  canvasPreview: parentCanvasPreviewSchema.nullable(),
  gradeLevel: gradeLevelSchema,
  parentGuidance: z.array(z.string().min(1)),
  rubric: z.array(parentRubricRowSchema).min(1),
  safetyNote: z.string().min(1),
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  submittedLabel: z.string().min(1),
  submissionId: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
  writingPreview: z.string().min(1),
});

export const parentAssignmentReviewApiResponseSchema = z.object({
  connectionStatus: z.enum(["online", "offline_cached"]),
  generatedAt: z.string().datetime(),
  review: parentAssignmentReviewSchema.nullable(),
});

export const parentSettingsApiResponseSchema = z.object({
  connectionStatus: z.enum(["online", "offline_cached"]),
  generatedAt: z.string().datetime(),
  linkedStudents: z.array(parentStudentSummarySchema),
  parentId: z.string().min(1),
  settings: parentSettingsSchema,
});

export type ParentStudentSummary = z.infer<typeof parentStudentSummarySchema> & {
  gradeLevel: GradeLevel;
};

export type ParentWeeklyProgress = z.infer<typeof parentWeeklyProgressSchema> & {
  areaToPractice: WritingSkill;
};

export type ParentSkillProgress = z.infer<typeof parentSkillProgressSchema> & {
  skill: WritingSkill;
};

export type ParentAssignmentSummary = z.infer<typeof parentAssignmentSummarySchema> & {
  assignmentType: AssignmentType;
  skillFocus: WritingSkill[];
};

export type ParentSettings = z.infer<typeof parentSettingsSchema>;

export type ParentDashboardApiResponse = z.infer<typeof parentDashboardApiResponseSchema> & {
  assignments: ParentAssignmentSummary[];
  selectedStudentId: string | null;
  skillProgress: ParentSkillProgress[];
  students: ParentStudentSummary[];
  weeklyProgress: ParentWeeklyProgress | null;
};

export type ParentStudentReportApiResponse = z.infer<typeof parentStudentReportApiResponseSchema> & {
  assignments: ParentAssignmentSummary[];
  skillProgress: ParentSkillProgress[];
  student: ParentStudentSummary | null;
  weeklyProgress: ParentWeeklyProgress | null;
};

export type ParentCanvasPreview = z.infer<typeof parentCanvasPreviewSchema>;
export type ParentAiFeedback = z.infer<typeof parentAiFeedbackSchema>;
export type ParentRubricRow = z.infer<typeof parentRubricRowSchema>;

export type ParentAssignmentReview = z.infer<typeof parentAssignmentReviewSchema> & {
  gradeLevel: GradeLevel;
};

export type ParentAssignmentReviewApiResponse = z.infer<typeof parentAssignmentReviewApiResponseSchema> & {
  review: ParentAssignmentReview | null;
};

export type ParentSettingsApiResponse = z.infer<typeof parentSettingsApiResponseSchema> & {
  linkedStudents: ParentStudentSummary[];
};

export interface ParentGradeAdaptation {
  band: GradeBand;
  showCanvasDetail: boolean;
  showDetailedRubric: boolean;
  visibleAssignmentCount: number;
  visibleMetricCount: number;
  visibleSkillCount: number;
}

export interface ParentDashboardViewModel {
  assignments: ParentAssignmentSummary[];
  assignmentCompletionValue: number;
  coachInsight: string;
  confidenceGrowthPercent: number;
  encouragementSummary: string;
  gradeAdaptation: ParentGradeAdaptation;
  isEmpty: boolean;
  isOffline: boolean;
  milestones: ParentDashboardMilestone[];
  recentRankPercent: number;
  selectedStudent: ParentStudentSummary | null;
  settingsSummary: ParentSettings;
  skillProgress: ParentSkillProgress[];
  students: ParentStudentSummary[];
  upcomingItems: ParentDashboardUpcomingItem[];
  writingLevel: ParentDashboardWritingLevel;
  weeklyProgress: ParentWeeklyProgress | null;
  weeklyProgressValue: number;
}

export type ParentDashboardWritingLevel = "advanced" | "developing" | "intermediate";

export type ParentDashboardMilestoneKind = "assignment" | "skill" | "streak";

export interface ParentDashboardMilestone {
  description: string;
  id: string;
  kind: ParentDashboardMilestoneKind;
  scorePercent?: number;
  skillLabel?: string;
  streakDays?: number;
  title?: string;
}

export interface ParentDashboardUpcomingItem {
  context: string;
  id: string;
  progressPercent: number;
  status: ParentAssignmentSummary["status"];
  submissionId: string;
  title: string;
}

export interface ParentStudentReportViewModel {
  assignments: ParentAssignmentSummary[];
  gradeAdaptation: ParentGradeAdaptation;
  isEmpty: boolean;
  isOffline: boolean;
  nextSteps: string[];
  practiceFocus: string[];
  skillProgress: ParentSkillProgress[];
  strengths: string[];
  student: ParentStudentSummary | null;
  weeklyProgress: ParentWeeklyProgress | null;
  weeklyProgressValue: number;
}

export interface ParentAssignmentReviewViewModel {
  gradeAdaptation: ParentGradeAdaptation;
  isOffline: boolean;
  review: ParentAssignmentReview;
  rubricEarned: number;
  rubricMax: number;
  rubricScoreValue: number;
}
