import type { SubmissionStatus } from "./assignments.types";

export type StreakStatus = "continued" | "at_risk" | "missed" | "not_started";

export interface StudentProgressTotalsRecord {
  aiFeedbackApplied: number;
  assignmentsCompleted: number;
  bestStreakDays: number;
  currentStreakDays: number;
  handwritingMinutes: number;
  minutesThisWeek: number;
  practicedTodayOn: string | null;
  revisionsCompleted: number;
  rubricImprovement: number;
  streakStatus: StreakStatus;
  studentProfileId: string;
  weeklyMinutesGoal: number;
  wordsWritten: number;
}

export interface StudentSkillProgressRecord {
  currentScore: number;
  level: number;
  previousScore: number;
  skill: string;
  studentProfileId: string;
  updatedAt: string;
}

export interface StudentActivityDayRecord {
  activityDate: string;
  assignmentsCompleted: number;
  feedbackApplied: number;
  handwritingMinutes: number;
  minutesPracticed: number;
  practicedSkills: string[];
  revisionsCompleted: number;
  studentProfileId: string;
  wordsWritten: number;
}

export interface WeeklyReviewRecord {
  celebrationFallback: string;
  celebrationKey: string;
  focusForNextWeekFallback: string;
  focusForNextWeekKey: string;
  id: string;
  studentProfileId: string;
  weekEnd: string;
  weekStart: string;
}

export interface BadgeRecord {
  code: string;
  descriptionFallback: string;
  descriptionKey: string;
  iconName: string;
  id: string;
  nameFallback: string;
  nameKey: string;
}

export type StudentBadgeStatus = "locked" | "in_progress" | "unlocked";

export interface StudentBadgeRecord {
  badgeId: string;
  progressPercent: number;
  status: StudentBadgeStatus;
  studentProfileId: string;
  unlockedAt: string | null;
}

export interface SubmissionQueueRecord {
  assignmentId: string;
  assignmentTitleFallback: string;
  assignmentTitleKey: string;
  classId: string;
  hasCanvas: boolean;
  id: string;
  status: SubmissionStatus;
  studentAssignmentId: string;
  studentDisplayName: string;
  studentProfileId: string;
  submittedAt: string;
  wordCount: number;
}

export interface ActivityDateRange {
  /** Inclusive ISO date (YYYY-MM-DD). */
  fromDate: string;
  /** Inclusive ISO date (YYYY-MM-DD). */
  toDate: string;
}

export interface ListSubmissionQueueOptions {
  limit: number;
  statuses?: readonly SubmissionStatus[];
}

export interface Grade3WritingProgressRecord {
  completed: boolean;
  completedAt: string | null;
  day: number;
  draft: string;
  id: string;
  studentProfileId: string;
  updatedAt: string;
}

export interface CompleteGrade3DayInput {
  day: number;
  /** Practice minutes credited toward the streak; clamped server-side. */
  minutes: number;
  studentProfileId: string;
}

export interface Grade3DayCompletionResult {
  alreadyCompleted: boolean;
  completed: boolean;
  completedAt: string | null;
  day: number;
  id: string;
  studentProfileId: string;
  updatedAt: string;
}
