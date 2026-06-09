import type { AssignmentType, WritingSkill } from "@writewise/shared";

import type { TranslationKey, TranslationParams } from "@/i18n";

import { deepLinkRoutes } from "../navigation/deepLinks";
import { routes } from "../navigation/routeNames";

export const notificationTypes = [
  "daily_assignment",
  "streak",
  "incomplete_assignment",
  "weekly_report",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export const notificationWeekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type NotificationWeekday = (typeof notificationWeekdays)[number];

export interface NotificationTypePreference {
  enabled: boolean;
  timeOfDay: string;
}

export interface WeeklyReportNotificationPreference extends NotificationTypePreference {
  weekday: NotificationWeekday;
}

export interface NotificationPreferences {
  dailyAssignment: NotificationTypePreference;
  enabled: boolean;
  incompleteAssignment: NotificationTypePreference;
  streak: NotificationTypePreference;
  timezone: string;
  weeklyReport: WeeklyReportNotificationPreference;
}

export interface PreparedNotification {
  accessibilityLabelKey: TranslationKey;
  data: {
    notificationType: NotificationType;
    targetParams: Record<string, string>;
    targetRoute: string;
  };
  id: string;
  params: TranslationParams;
  scheduledForLocal: string;
  studentId: string;
  titleKey: TranslationKey;
  type: NotificationType;
  bodyKey: TranslationKey;
}

export interface NotificationAssignmentContext {
  assignmentType?: AssignmentType;
  estimatedMinutes: number;
  id: string;
  skillFocus?: WritingSkill[];
  status?: "feedback_ready" | "in_progress" | "not_started" | "revision_in_progress";
  title: string;
}

export interface NotificationStreakContext {
  canContinueToday: boolean;
  currentDays: number;
  nextMilestoneDays: number;
  shouldSendReminder: boolean;
  status: "at_risk" | "continued" | "missed" | "not_started";
}

export interface NotificationWeeklyReportContext {
  assignmentsCompleted: number;
  focusSkillLabel?: string;
  minutesCompleted: number;
  weekLabel: string;
}

export interface PrepareNotificationBatchInput {
  dailyAssignment: NotificationAssignmentContext | null;
  incompleteAssignment?: NotificationAssignmentContext | null;
  preferences: NotificationPreferences;
  referenceDate: string;
  streak: NotificationStreakContext;
  studentId: string;
  weeklyReport?: NotificationWeeklyReportContext | null;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  dailyAssignment: {
    enabled: true,
    timeOfDay: "16:00",
  },
  enabled: true,
  incompleteAssignment: {
    enabled: true,
    timeOfDay: "19:00",
  },
  streak: {
    enabled: true,
    timeOfDay: "17:00",
  },
  timezone: "local",
  weeklyReport: {
    enabled: true,
    timeOfDay: "17:00",
    weekday: "sunday",
  },
};

const notificationCopy = {
  daily_assignment: {
    accessibilityLabelKey: "notifications.dailyAssignment.accessibility",
    bodyKey: "notifications.dailyAssignment.body",
    titleKey: "notifications.dailyAssignment.title",
  },
  incomplete_assignment: {
    accessibilityLabelKey: "notifications.incompleteAssignment.accessibility",
    bodyKey: "notifications.incompleteAssignment.body",
    titleKey: "notifications.incompleteAssignment.title",
  },
  streak: {
    accessibilityLabelKey: "notifications.streak.accessibility",
    bodyKey: "notifications.streak.body",
    titleKey: "notifications.streak.title",
  },
  weekly_report: {
    accessibilityLabelKey: "notifications.weeklyReport.accessibility",
    bodyKey: "notifications.weeklyReport.body",
    titleKey: "notifications.weeklyReport.title",
  },
} satisfies Record<
  NotificationType,
  {
    accessibilityLabelKey: TranslationKey;
    bodyKey: TranslationKey;
    titleKey: TranslationKey;
  }
>;

function getPreferenceForType(
  preferences: NotificationPreferences,
  type: NotificationType,
): NotificationTypePreference | WeeklyReportNotificationPreference {
  switch (type) {
    case "daily_assignment":
      return preferences.dailyAssignment;
    case "incomplete_assignment":
      return preferences.incompleteAssignment;
    case "streak":
      return preferences.streak;
    case "weekly_report":
      return preferences.weeklyReport;
  }
}

function isNotificationEnabled(preferences: NotificationPreferences, type: NotificationType): boolean {
  return preferences.enabled && getPreferenceForType(preferences, type).enabled;
}

function buildLocalDateTime(date: string, timeOfDay: string): string {
  return `${date.slice(0, 10)}T${timeOfDay}:00`;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getNextWeekdayDate(referenceDate: string, weekday: NotificationWeekday): string {
  const reference = parseDate(referenceDate);
  const targetWeekday = notificationWeekdays.indexOf(weekday);
  const daysAhead = (targetWeekday - reference.getUTCDay() + 7) % 7;
  const scheduled = new Date(reference.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return formatDate(scheduled);
}

function createPreparedNotification(input: {
  idSuffix: string;
  params: TranslationParams;
  scheduledForLocal: string;
  studentId: string;
  targetParams: Record<string, string>;
  targetRoute: string;
  type: NotificationType;
}): PreparedNotification {
  const copy = notificationCopy[input.type];

  return {
    accessibilityLabelKey: copy.accessibilityLabelKey,
    bodyKey: copy.bodyKey,
    data: {
      notificationType: input.type,
      targetParams: input.targetParams,
      targetRoute: input.targetRoute,
    },
    id: `${input.studentId}:${input.type}:${input.idSuffix}`,
    params: input.params,
    scheduledForLocal: input.scheduledForLocal,
    studentId: input.studentId,
    titleKey: copy.titleKey,
    type: input.type,
  };
}

export function prepareDailyAssignmentNotification(input: {
  assignment: NotificationAssignmentContext | null;
  preferences: NotificationPreferences;
  referenceDate: string;
  studentId: string;
}): PreparedNotification | null {
  if (!input.assignment || !isNotificationEnabled(input.preferences, "daily_assignment")) {
    return null;
  }

  return createPreparedNotification({
    idSuffix: input.assignment.id,
    params: {
      minutes: input.assignment.estimatedMinutes,
      title: input.assignment.title,
    },
    scheduledForLocal: buildLocalDateTime(input.referenceDate, input.preferences.dailyAssignment.timeOfDay),
    studentId: input.studentId,
    targetParams: { assignmentId: input.assignment.id },
    targetRoute: deepLinkRoutes.assignmentDetail,
    type: "daily_assignment",
  });
}

export function prepareStreakNotification(input: {
  preferences: NotificationPreferences;
  referenceDate: string;
  streak: NotificationStreakContext;
  studentId: string;
}): PreparedNotification | null {
  if (
    !isNotificationEnabled(input.preferences, "streak") ||
    !input.streak.canContinueToday ||
    !input.streak.shouldSendReminder
  ) {
    return null;
  }

  return createPreparedNotification({
    idSuffix: input.referenceDate,
    params: {
      count: input.streak.currentDays,
      milestone: input.streak.nextMilestoneDays,
    },
    scheduledForLocal: buildLocalDateTime(input.referenceDate, input.preferences.streak.timeOfDay),
    studentId: input.studentId,
    targetParams: {},
    targetRoute: routes.studentHome.toString(),
    type: "streak",
  });
}

export function prepareIncompleteAssignmentNotification(input: {
  assignment: NotificationAssignmentContext | null;
  preferences: NotificationPreferences;
  referenceDate: string;
  studentId: string;
}): PreparedNotification | null {
  const status = input.assignment?.status;

  if (
    !input.assignment ||
    !isNotificationEnabled(input.preferences, "incomplete_assignment") ||
    (status !== "in_progress" && status !== "revision_in_progress")
  ) {
    return null;
  }

  return createPreparedNotification({
    idSuffix: input.assignment.id,
    params: {
      minutes: input.assignment.estimatedMinutes,
      title: input.assignment.title,
    },
    scheduledForLocal: buildLocalDateTime(input.referenceDate, input.preferences.incompleteAssignment.timeOfDay),
    studentId: input.studentId,
    targetParams: { assignmentId: input.assignment.id },
    targetRoute: deepLinkRoutes.assignmentDetail,
    type: "incomplete_assignment",
  });
}

export function prepareWeeklyReportNotification(input: {
  preferences: NotificationPreferences;
  referenceDate: string;
  report: NotificationWeeklyReportContext | null;
  studentId: string;
}): PreparedNotification | null {
  if (!input.report || !isNotificationEnabled(input.preferences, "weekly_report")) {
    return null;
  }

  const scheduledDate = getNextWeekdayDate(input.referenceDate, input.preferences.weeklyReport.weekday);

  return createPreparedNotification({
    idSuffix: input.report.weekLabel,
    params: {
      assignments: input.report.assignmentsCompleted,
      focusSkill: input.report.focusSkillLabel ?? "writing",
      minutes: input.report.minutesCompleted,
      weekLabel: input.report.weekLabel,
    },
    scheduledForLocal: buildLocalDateTime(scheduledDate, input.preferences.weeklyReport.timeOfDay),
    studentId: input.studentId,
    targetParams: {},
    targetRoute: deepLinkRoutes.studentProgressWeeklyReview,
    type: "weekly_report",
  });
}

export function prepareNotificationBatch(input: PrepareNotificationBatchInput): PreparedNotification[] {
  const notifications = [
    prepareDailyAssignmentNotification({
      assignment: input.dailyAssignment,
      preferences: input.preferences,
      referenceDate: input.referenceDate,
      studentId: input.studentId,
    }),
    prepareStreakNotification({
      preferences: input.preferences,
      referenceDate: input.referenceDate,
      streak: input.streak,
      studentId: input.studentId,
    }),
    prepareIncompleteAssignmentNotification({
      assignment: input.incompleteAssignment ?? input.dailyAssignment,
      preferences: input.preferences,
      referenceDate: input.referenceDate,
      studentId: input.studentId,
    }),
    prepareWeeklyReportNotification({
      preferences: input.preferences,
      referenceDate: input.referenceDate,
      report: input.weeklyReport ?? null,
      studentId: input.studentId,
    }),
  ];

  return notifications.filter((notification): notification is PreparedNotification => notification !== null);
}
