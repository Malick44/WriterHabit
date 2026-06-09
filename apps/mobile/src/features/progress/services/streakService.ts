import type { ProgressDailyActivity, ProgressStreakSummary } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_MILESTONES = [3, 5, 7, 14, 30, 60, 100] as const;
const DEFAULT_STREAK_REMINDER_HOUR = 17;

export type StreakContinuationStatus = "at_risk" | "continued" | "missed" | "not_started";

export interface StreakContinuationSummary {
  canContinueToday: boolean;
  currentDays: number;
  lastPracticeDate: string | null;
  nextMilestoneDays: number;
  shouldSendReminder: boolean;
  status: StreakContinuationStatus;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  return formatDate(new Date(parseDate(value).getTime() + days * DAY_MS));
}

function didPractice(activity: ProgressDailyActivity): boolean {
  return (
    activity.aiFeedbackApplied > 0 ||
    activity.assignmentsCompleted > 0 ||
    activity.handwritingMinutes > 0 ||
    activity.minutes > 0 ||
    activity.revisionsCompleted > 0 ||
    activity.rubricImprovement > 0 ||
    activity.words > 0
  );
}

function getPracticeDateSet(activity: ProgressDailyActivity[]): Set<string> {
  return new Set(activity.filter(didPractice).map((day) => day.date));
}

function countBackwards(practiceDates: Set<string>, startDate: string): number {
  let count = 0;
  let cursor = startDate;

  while (practiceDates.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }

  return count;
}

function getBestStreak(practiceDates: Set<string>): number {
  const sortedDates = [...practiceDates].sort();
  let bestDays = 0;
  let currentDays = 0;
  let previousDate: string | null = null;

  sortedDates.forEach((date) => {
    currentDays = previousDate && addDays(previousDate, 1) === date ? currentDays + 1 : 1;
    bestDays = Math.max(bestDays, currentDays);
    previousDate = date;
  });

  return bestDays;
}

function getNextMilestone(currentDays: number): number {
  return STREAK_MILESTONES.find((milestone) => milestone > currentDays) ?? currentDays + 30;
}

export function calculateWritingStreak(input: {
  activity: ProgressDailyActivity[];
  referenceDate: string;
}): ProgressStreakSummary {
  const practiceDates = getPracticeDateSet(input.activity);
  const practicedToday = practiceDates.has(input.referenceDate);
  const yesterday = addDays(input.referenceDate, -1);
  const startDate = practicedToday ? input.referenceDate : practiceDates.has(yesterday) ? yesterday : input.referenceDate;
  const currentDays = practicedToday || practiceDates.has(yesterday) ? countBackwards(practiceDates, startDate) : 0;
  const nextMilestoneDays = getNextMilestone(currentDays);
  const lastPracticeDate = [...practiceDates].sort().at(-1) ?? null;

  return {
    bestDays: getBestStreak(practiceDates),
    currentDays,
    daysUntilNextMilestone: Math.max(0, nextMilestoneDays - currentDays),
    lastPracticeDate,
    nextMilestoneDays,
    practicedToday,
    progressValue: nextMilestoneDays > 0 ? Math.min(1, currentDays / nextMilestoneDays) : 0,
    referenceDate: input.referenceDate,
    requiresPracticeToday: !practicedToday && currentDays > 0,
  };
}

export function getStreakContinuationSummary(input: {
  activity: ProgressDailyActivity[];
  currentHour?: number;
  referenceDate: string;
  reminderHour?: number;
}): StreakContinuationSummary {
  const streak = calculateWritingStreak({
    activity: input.activity,
    referenceDate: input.referenceDate,
  });
  const currentHour = input.currentHour ?? 12;
  const reminderHour = input.reminderHour ?? DEFAULT_STREAK_REMINDER_HOUR;

  if (streak.practicedToday) {
    return {
      canContinueToday: false,
      currentDays: streak.currentDays,
      lastPracticeDate: streak.lastPracticeDate,
      nextMilestoneDays: streak.nextMilestoneDays,
      shouldSendReminder: false,
      status: "continued",
    };
  }

  if (streak.requiresPracticeToday) {
    return {
      canContinueToday: true,
      currentDays: streak.currentDays,
      lastPracticeDate: streak.lastPracticeDate,
      nextMilestoneDays: streak.nextMilestoneDays,
      shouldSendReminder: currentHour >= reminderHour,
      status: "at_risk",
    };
  }

  if (streak.lastPracticeDate) {
    return {
      canContinueToday: false,
      currentDays: 0,
      lastPracticeDate: streak.lastPracticeDate,
      nextMilestoneDays: streak.nextMilestoneDays,
      shouldSendReminder: false,
      status: "missed",
    };
  }

  return {
    canContinueToday: false,
    currentDays: 0,
    lastPracticeDate: null,
    nextMilestoneDays: streak.nextMilestoneDays,
    shouldSendReminder: false,
    status: "not_started",
  };
}
