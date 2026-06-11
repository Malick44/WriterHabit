import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { profilesettingsApi } from "@/features/profile-settings/api/profilesettingsApi";
import { translate, type TranslationKey, type TranslationParams } from "@/i18n";

import { routes } from "../navigation/routeNames";
import {
  notificationWeekdays,
  type NotificationPreferences,
  type NotificationType,
  type NotificationWeekday,
} from "./notificationService";

export const WriterHabit_NOTIFICATION_CHANNEL_ID = "WriterHabit-reminders";

type ScheduleTrigger =
  | Notifications.DailyTriggerInput
  | Notifications.WeeklyTriggerInput;

export interface ScheduledWriterHabitNotificationRequest {
  content: Notifications.NotificationContentInput;
  identifier: string;
  trigger: ScheduleTrigger;
  type: NotificationType;
}

export interface NotificationDeliverySyncResult {
  permissionStatus: "denied" | "granted" | "unavailable";
  pushRegistrationStatus: "registered" | "registration_failed" | "skipped" | "token_unavailable";
  scheduledCount: number;
}

interface NotificationCopyInput {
  bodyKey: TranslationKey;
  params: TranslationParams;
  route: string;
  studentId: string;
  titleKey: TranslationKey;
  type: NotificationType;
}

interface ExpoProjectIdConfig {
  easConfig?: { projectId?: unknown } | null;
  expoConfig?: { extra?: { eas?: { projectId?: unknown } } } | null;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function parseTimeOfDay(value: string): { hour: number; minute: number } {
  const [hourValue, minuteValue] = value.split(":").map(Number);
  const hour = Number.isInteger(hourValue) ? hourValue : 9;
  const minute = Number.isInteger(minuteValue) ? minuteValue : 0;

  return {
    hour: Math.min(Math.max(hour, 0), 23),
    minute: Math.min(Math.max(minute, 0), 59),
  };
}

function getNotificationIdentifier(studentId: string, type: NotificationType): string {
  return `WriterHabit.${studentId}.${type}`;
}

function getWeekdayNumber(weekday: NotificationWeekday): number {
  return notificationWeekdays.indexOf(weekday) + 1;
}

function getDefaultNotificationParams(type: NotificationType): TranslationParams {
  switch (type) {
    case "daily_assignment":
      return {
        minutes: Number(translate("en", "notifications.defaults.assignmentMinutes")),
        title: translate("en", "notifications.defaults.assignmentTitle"),
      };
    case "incomplete_assignment":
      return {
        minutes: Number(translate("en", "notifications.defaults.incompleteMinutes")),
        title: translate("en", "notifications.defaults.assignmentTitle"),
      };
    case "streak":
      return {
        count: Number(translate("en", "notifications.defaults.streakCount")),
        milestone: Number(translate("en", "notifications.defaults.streakMilestone")),
      };
    case "weekly_report":
      return {
        assignments: Number(translate("en", "notifications.defaults.weeklyAssignments")),
        focusSkill: translate("en", "notifications.defaults.focusSkill"),
        minutes: Number(translate("en", "notifications.defaults.weeklyMinutes")),
        weekLabel: translate("en", "notifications.defaults.weekLabel"),
      };
  }
}

function createContent({
  bodyKey,
  params,
  route,
  studentId,
  titleKey,
  type,
}: NotificationCopyInput): Notifications.NotificationContentInput {
  return {
    body: translate("en", bodyKey, params),
    data: {
      notificationType: type,
      source: "WriterHabit",
      studentId,
      targetRoute: route,
    },
    sound: "default",
    title: translate("en", titleKey, params),
  };
}

function createDailyNotificationRequest(input: {
  bodyKey: TranslationKey;
  preferencesTimeOfDay: string;
  route: string;
  studentId: string;
  titleKey: TranslationKey;
  type: NotificationType;
}): ScheduledWriterHabitNotificationRequest {
  const time = parseTimeOfDay(input.preferencesTimeOfDay);

  return {
    content: createContent({
      bodyKey: input.bodyKey,
      params: getDefaultNotificationParams(input.type),
      route: input.route,
      studentId: input.studentId,
      titleKey: input.titleKey,
      type: input.type,
    }),
    identifier: getNotificationIdentifier(input.studentId, input.type),
    trigger: {
      channelId: WriterHabit_NOTIFICATION_CHANNEL_ID,
      hour: time.hour,
      minute: time.minute,
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
    },
    type: input.type,
  };
}

function createWeeklyNotificationRequest(input: {
  bodyKey: TranslationKey;
  preferencesTimeOfDay: string;
  route: string;
  studentId: string;
  titleKey: TranslationKey;
  type: NotificationType;
  weekday: NotificationWeekday;
}): ScheduledWriterHabitNotificationRequest {
  const time = parseTimeOfDay(input.preferencesTimeOfDay);

  return {
    content: createContent({
      bodyKey: input.bodyKey,
      params: getDefaultNotificationParams(input.type),
      route: input.route,
      studentId: input.studentId,
      titleKey: input.titleKey,
      type: input.type,
    }),
    identifier: getNotificationIdentifier(input.studentId, input.type),
    trigger: {
      channelId: WriterHabit_NOTIFICATION_CHANNEL_ID,
      hour: time.hour,
      minute: time.minute,
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: getWeekdayNumber(input.weekday),
    },
    type: input.type,
  };
}

export function buildScheduledNotificationRequests(
  studentId: string,
  preferences: NotificationPreferences,
): ScheduledWriterHabitNotificationRequest[] {
  if (!preferences.enabled) {
    return [];
  }

  const requests: ScheduledWriterHabitNotificationRequest[] = [];

  if (preferences.dailyAssignment.enabled) {
    requests.push(
      createDailyNotificationRequest({
        bodyKey: "notifications.dailyAssignment.body",
        preferencesTimeOfDay: preferences.dailyAssignment.timeOfDay,
        route: String(routes.studentAssignmentsHistory),
        studentId,
        titleKey: "notifications.dailyAssignment.title",
        type: "daily_assignment",
      }),
    );
  }

  if (preferences.incompleteAssignment.enabled) {
    requests.push(
      createDailyNotificationRequest({
        bodyKey: "notifications.incompleteAssignment.body",
        preferencesTimeOfDay: preferences.incompleteAssignment.timeOfDay,
        route: String(routes.studentAssignmentsHistory),
        studentId,
        titleKey: "notifications.incompleteAssignment.title",
        type: "incomplete_assignment",
      }),
    );
  }

  if (preferences.streak.enabled) {
    requests.push(
      createDailyNotificationRequest({
        bodyKey: "notifications.streak.body",
        preferencesTimeOfDay: preferences.streak.timeOfDay,
        route: String(routes.studentProgress),
        studentId,
        titleKey: "notifications.streak.title",
        type: "streak",
      }),
    );
  }

  if (preferences.weeklyReport.enabled) {
    requests.push(
      createWeeklyNotificationRequest({
        bodyKey: "notifications.weeklyReport.body",
        preferencesTimeOfDay: preferences.weeklyReport.timeOfDay,
        route: String(routes.studentProgressWeeklyReview),
        studentId,
        titleKey: "notifications.weeklyReport.title",
        type: "weekly_report",
        weekday: preferences.weeklyReport.weekday,
      }),
    );
  }

  return requests;
}

async function ensureNotificationPermission(): Promise<"denied" | "granted" | "unavailable"> {
  try {
    const currentStatus = await Notifications.getPermissionsAsync();

    if (currentStatus.granted) {
      return "granted";
    }

    if (!currentStatus.canAskAgain) {
      return "denied";
    }

    const requestedStatus = await Notifications.requestPermissionsAsync();

    return requestedStatus.granted ? "granted" : "denied";
  } catch {
    return "unavailable";
  }
}

async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(WriterHabit_NOTIFICATION_CHANNEL_ID, {
    importance: Notifications.AndroidImportance.DEFAULT,
    name: translate("en", "notifications.channel.name"),
  });
}

export async function cancelWriterHabitScheduledNotifications(studentId: string): Promise<void> {
  await Promise.all(
    (["daily_assignment", "incomplete_assignment", "streak", "weekly_report"] as const).map((type) =>
      Notifications.cancelScheduledNotificationAsync(getNotificationIdentifier(studentId, type)).catch(() => undefined),
    ),
  );
}

export function resolveExpoProjectId(config: ExpoProjectIdConfig): string | null {
  const projectId = config.easConfig?.projectId ?? config.expoConfig?.extra?.eas?.projectId;
  const isRealProjectId =
    typeof projectId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

  return isRealProjectId ? projectId : null;
}

export function getExpoProjectId(): string | null {
  return resolveExpoProjectId(Constants);
}

async function registerPushToken(studentId: string): Promise<NotificationDeliverySyncResult["pushRegistrationStatus"]> {
  const projectId = getExpoProjectId();

  if (!projectId || Platform.OS === "web") {
    return "skipped";
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    const registration = await profilesettingsApi.registerNotificationDevice({
      expoPushToken: token.data,
      idempotencyKey: getNotificationIdentifier(studentId, "daily_assignment"),
      studentId,
    });

    return registration.status === "registered" ? "registered" : "skipped";
  } catch {
    return "registration_failed";
  }
}

export const notificationDeliveryService = {
  async syncNotificationDelivery({
    preferences,
    studentId,
  }: {
    preferences: NotificationPreferences;
    studentId: string;
  }): Promise<NotificationDeliverySyncResult> {
    const permissionStatus = await ensureNotificationPermission();

    await cancelWriterHabitScheduledNotifications(studentId);

    if (permissionStatus !== "granted") {
      return {
        permissionStatus,
        pushRegistrationStatus: "skipped",
        scheduledCount: 0,
      };
    }

    await configureAndroidChannel();

    const requests = buildScheduledNotificationRequests(studentId, preferences);

    await Promise.all(
      requests.map((request) =>
        Notifications.scheduleNotificationAsync({
          content: request.content,
          identifier: request.identifier,
          trigger: request.trigger,
        }),
      ),
    );

    const pushRegistrationStatus = await registerPushToken(studentId);

    return {
      permissionStatus,
      pushRegistrationStatus,
      scheduledCount: requests.length,
    };
  },
};
