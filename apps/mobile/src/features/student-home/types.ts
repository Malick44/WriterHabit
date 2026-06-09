import type { AssignmentType, GradeLevel, WritingSkill } from "@writewise/shared";
import { z } from "zod";

import type { GradeBand } from "@/design/tokens";
import type { TranslationKey } from "@/i18n";

export const studentHomeScenarioSchema = z.enum([
  "success",
  "empty",
  "error",
  "offline",
  "practice_complete",
]);

export type StudentHomeScenario = z.infer<typeof studentHomeScenarioSchema>;

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

export const studentHomeAssignmentSchema = z.object({
  assignmentType: assignmentTypeSchema,
  coachSuggestion: z.string().min(1).optional(),
  dueLabel: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  gradeLevelMax: gradeLevelSchema,
  gradeLevelMin: gradeLevelSchema,
  id: z.string().min(1),
  prompt: z.string().min(1),
  rubricFocus: z.array(z.string().min(1)).default([]),
  skillFocus: z.array(writingSkillSchema).min(1),
  status: z.enum(["not_started", "in_progress", "submitted", "feedback_ready", "revision_in_progress"]),
  title: z.string().min(1),
});

export const studentHomeDraftSchema = z.object({
  assignmentId: z.string().min(1),
  lastEditedLabel: z.string().min(1),
  preview: z.string().min(1),
  revisionNumber: z.number().int().nonnegative(),
  title: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
});

export const studentHomeFeedbackSchema = z.object({
  createdLabel: z.string().min(1),
  improvement: z.string().min(1),
  revisionTask: z.string().min(1),
  skill: writingSkillSchema,
  strength: z.string().min(1),
  submissionId: z.string().min(1),
  title: z.string().min(1),
});

export const studentHomeSkillProgressSchema = z.object({
  currentScore: z.number().int().min(0).max(100),
  label: z.string().min(1),
  previousScore: z.number().int().min(0).max(100),
  skill: writingSkillSchema,
});

export const studentHomeApiResponseSchema = z.object({
  connectionStatus: z.enum(["online", "offline_cached"]),
  continueDraft: studentHomeDraftSchema.nullable(),
  dailyPractice: z.object({
    completedToday: z.boolean(),
    minutesGoal: z.number().int().positive(),
    nextPromptLabel: z.string().min(1),
  }),
  generatedAt: z.string().datetime(),
  gradeLevel: gradeLevelSchema,
  recentFeedback: z.array(studentHomeFeedbackSchema),
  revisionNudges: z.array(z.string().min(1)),
  skillProgress: z.array(studentHomeSkillProgressSchema),
  streak: z.object({
    bestDays: z.number().int().nonnegative(),
    currentDays: z.number().int().nonnegative(),
    nextMilestoneDays: z.number().int().positive(),
    practicedToday: z.boolean(),
  }),
  studentId: z.string().min(1),
  todayAssignment: studentHomeAssignmentSchema.nullable(),
  weeklyWriting: z.object({
    minutesCompleted: z.number().int().nonnegative(),
    minutesGoal: z.number().int().positive(),
    sessionsCompleted: z.number().int().nonnegative(),
  }),
});

export type StudentHomeAssignment = z.infer<typeof studentHomeAssignmentSchema> & {
  assignmentType: AssignmentType;
  skillFocus: WritingSkill[];
};
export type StudentHomeDraft = z.infer<typeof studentHomeDraftSchema>;
export type StudentHomeFeedback = z.infer<typeof studentHomeFeedbackSchema> & {
  skill: WritingSkill;
};
export type StudentHomeSkillProgress = z.infer<typeof studentHomeSkillProgressSchema> & {
  skill: WritingSkill;
};
export type StudentHomeApiResponse = z.infer<typeof studentHomeApiResponseSchema> & {
  gradeLevel: GradeLevel;
  skillProgress: StudentHomeSkillProgress[];
  todayAssignment: StudentHomeAssignment | null;
  recentFeedback: StudentHomeFeedback[];
};

export type StudentHomeNavigationTarget =
  | { kind: "assignmentDetail"; assignmentId: string }
  | { kind: "assignmentHistory" }
  | { kind: "canvasTemplates" }
  | { kind: "progress" }
  | { kind: "review"; submissionId: string }
  | { kind: "write"; assignmentId: string };

export type StudentHomeCoachActionId = "hint" | "brainstorm" | "sentence_check" | "revision_help";

export interface StudentHomeCoachAction {
  id: StudentHomeCoachActionId;
  labelKey: TranslationKey;
  accessibilityLabelKey: TranslationKey;
  target: StudentHomeNavigationTarget;
}

export interface StudentHomeGradeAdaptation {
  band: GradeBand;
  visibleSkillCount: number;
  showRubricFocus: boolean;
  showDetailedFeedback: boolean;
  showWeeklySessionCount: boolean;
}

export interface StudentHomeViewModel {
  coachActions: StudentHomeCoachAction[];
  continueDraft: StudentHomeDraft | null;
  dailyPractice: StudentHomeApiResponse["dailyPractice"];
  gradeAdaptation: StudentHomeGradeAdaptation;
  gradeLevel: GradeLevel;
  isEmpty: boolean;
  isOffline: boolean;
  recentFeedback: StudentHomeFeedback[];
  revisionNudges: string[];
  skillProgress: StudentHomeSkillProgress[];
  streak: StudentHomeApiResponse["streak"];
  studentFirstName: string;
  todayAssignment: StudentHomeAssignment | null;
  weeklyProgressValue: number;
  weeklyWriting: StudentHomeApiResponse["weeklyWriting"];
}
