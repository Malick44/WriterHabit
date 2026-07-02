import type {
  BadgeRecord,
  StudentActivityDayRecord,
  StudentBadgeRecord,
  StudentProgressTotalsRecord,
  StudentSkillProgressRecord,
  WeeklyReviewRecord,
} from "../data/types";
import { localizedCopy, type LocalizedCopy } from "../routes/writing-shared";

export type GradeBand = "elementary" | "middle" | "high";

export function gradeBandFor(gradeLevel: number): GradeBand {
  if (gradeLevel <= 5) {
    return "elementary";
  }

  if (gradeLevel <= 8) {
    return "middle";
  }

  return "high";
}

export function skillLabel(skill: string): LocalizedCopy {
  const fallback = skill.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
  return localizedCopy(`skills.${skill}.label`, fallback);
}

export interface IsoDateRange {
  fromDate: string;
  toDate: string;
}

export function emptyProgressTotals(studentProfileId: string): StudentProgressTotalsRecord {
  return {
    aiFeedbackApplied: 0,
    assignmentsCompleted: 0,
    bestStreakDays: 0,
    currentStreakDays: 0,
    handwritingMinutes: 0,
    minutesThisWeek: 0,
    practicedTodayOn: null,
    revisionsCompleted: 0,
    rubricImprovement: 0,
    streakStatus: "not_started",
    studentProfileId,
    weeklyMinutesGoal: 0,
    wordsWritten: 0,
  };
}

export function mapProgressTotals(totals: StudentProgressTotalsRecord) {
  return {
    aiFeedbackApplied: totals.aiFeedbackApplied,
    assignmentsCompleted: totals.assignmentsCompleted,
    handwritingMinutes: totals.handwritingMinutes,
    minutesThisWeek: totals.minutesThisWeek,
    revisionsCompleted: totals.revisionsCompleted,
    rubricImprovement: totals.rubricImprovement,
    weeklyMinutesGoal: totals.weeklyMinutesGoal,
    wordsWritten: totals.wordsWritten,
  };
}

export function mapStreak(totals: StudentProgressTotalsRecord, todayIsoDate: string) {
  return {
    bestDays: totals.bestStreakDays,
    currentDays: totals.currentStreakDays,
    practicedToday: totals.practicedTodayOn === todayIsoDate,
    status: totals.streakStatus,
  };
}

export function mapSkillProgress(record: StudentSkillProgressRecord) {
  return {
    currentScore: record.currentScore,
    label: skillLabel(record.skill),
    level: record.level,
    previousScore: record.previousScore,
    skill: record.skill,
  };
}

export function mapBadgeProgress(badges: BadgeRecord[], studentBadges: StudentBadgeRecord[]) {
  const byBadgeId = new Map(studentBadges.map((record) => [record.badgeId, record]));

  return badges.map((badge) => {
    const studentBadge = byBadgeId.get(badge.id);

    return {
      badgeId: badge.id,
      description: localizedCopy(badge.descriptionKey, badge.descriptionFallback),
      name: localizedCopy(badge.nameKey, badge.nameFallback),
      progressPercent: studentBadge?.progressPercent ?? 0,
      status: studentBadge?.status ?? "locked",
      unlockedAt: studentBadge?.unlockedAt ?? null,
    };
  });
}

export function mapWeeklyReviewSummary(record: WeeklyReviewRecord) {
  return {
    celebration: localizedCopy(record.celebrationKey, record.celebrationFallback),
    focusForNextWeek: localizedCopy(record.focusForNextWeekKey, record.focusForNextWeekFallback),
    weekEnd: record.weekEnd,
    weekStart: record.weekStart,
  };
}

export interface WeeklyProgressInputs {
  activityDays: StudentActivityDayRecord[];
  assignedAssignments: number;
  skills: StudentSkillProgressRecord[];
  totals: StudentProgressTotalsRecord;
  week: IsoDateRange;
}

export function computeWeeklyProgress(inputs: WeeklyProgressInputs) {
  const minutesCompleted = inputs.activityDays.reduce((sum, day) => sum + day.minutesPracticed, 0);
  const sessionsCompleted = inputs.activityDays.filter((day) => day.minutesPracticed > 0).length;
  const completedAssignments = inputs.activityDays.reduce((sum, day) => sum + day.assignmentsCompleted, 0);
  const improvements = inputs.skills.map((skill) =>
    skill.previousScore > 0 ? ((skill.currentScore - skill.previousScore) / skill.previousScore) * 100 : 0,
  );
  const skillImprovementPercent =
    improvements.length > 0 ? Math.round(improvements.reduce((sum, value) => sum + value, 0) / improvements.length) : 0;
  const weakestSkill = inputs.skills.reduce<StudentSkillProgressRecord | null>(
    (weakest, skill) => (!weakest || skill.currentScore < weakest.currentScore ? skill : weakest),
    null,
  );

  return {
    areaToPractice: weakestSkill?.skill ?? "organization",
    assignedAssignments: inputs.assignedAssignments,
    celebration:
      completedAssignments > 0
        ? localizedCopy("parents.weeklyProgress.celebration.completedWork", "Completed writing practice this week!")
        : localizedCopy("parents.weeklyProgress.celebration.gettingStarted", "Ready to start writing this week."),
    completedAssignments,
    minutesCompleted,
    minutesGoal: inputs.totals.weeklyMinutesGoal,
    sessionsCompleted,
    skillImprovementPercent,
    streakDays: inputs.totals.currentStreakDays,
    weekLabel: `${inputs.week.fromDate} - ${inputs.week.toDate}`,
  };
}
