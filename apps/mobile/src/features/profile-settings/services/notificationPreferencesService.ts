import { z } from "zod";

import {
  defaultNotificationPreferences,
  notificationWeekdays,
  type NotificationPreferences,
  type NotificationTypePreference,
  type WeeklyReportNotificationPreference,
} from "@/core/notifications/notificationService";
import { preferencesStorage } from "@/services/storage/preferencesStorage";

const NOTIFICATION_PREFERENCES_KEY_PREFIX = "profile-settings.notifications";
const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export type NotificationPreferencesPatch = Partial<Pick<NotificationPreferences, "enabled" | "timezone">> & {
  dailyAssignment?: Partial<NotificationTypePreference>;
  incompleteAssignment?: Partial<NotificationTypePreference>;
  streak?: Partial<NotificationTypePreference>;
  weeklyReport?: Partial<WeeklyReportNotificationPreference>;
};

function notificationTypePreferenceSchema(defaults: NotificationTypePreference) {
  return z.object({
    enabled: z.boolean().catch(defaults.enabled),
    timeOfDay: timeOfDaySchema.catch(defaults.timeOfDay),
  });
}

const weeklyReportPreferenceSchema = z.object({
  enabled: z.boolean().catch(defaultNotificationPreferences.weeklyReport.enabled),
  timeOfDay: timeOfDaySchema.catch(defaultNotificationPreferences.weeklyReport.timeOfDay),
  weekday: z.enum(notificationWeekdays).catch(defaultNotificationPreferences.weeklyReport.weekday),
});

export const notificationPreferencesSchema = z.object({
  dailyAssignment: notificationTypePreferenceSchema(defaultNotificationPreferences.dailyAssignment).catch(
    defaultNotificationPreferences.dailyAssignment,
  ),
  enabled: z.boolean().catch(defaultNotificationPreferences.enabled),
  incompleteAssignment: notificationTypePreferenceSchema(defaultNotificationPreferences.incompleteAssignment).catch(
    defaultNotificationPreferences.incompleteAssignment,
  ),
  streak: notificationTypePreferenceSchema(defaultNotificationPreferences.streak).catch(
    defaultNotificationPreferences.streak,
  ),
  timezone: z.string().min(1).catch(defaultNotificationPreferences.timezone),
  weeklyReport: weeklyReportPreferenceSchema.catch(defaultNotificationPreferences.weeklyReport),
});

function getNotificationPreferencesKey(studentId: string): string {
  return `${NOTIFICATION_PREFERENCES_KEY_PREFIX}.${studentId}`;
}

export function parseNotificationPreferences(value: unknown): NotificationPreferences {
  const parsed = notificationPreferencesSchema.safeParse(value);

  if (!parsed.success) {
    return defaultNotificationPreferences;
  }

  return {
    dailyAssignment: {
      ...defaultNotificationPreferences.dailyAssignment,
      ...parsed.data.dailyAssignment,
    },
    enabled: parsed.data.enabled,
    incompleteAssignment: {
      ...defaultNotificationPreferences.incompleteAssignment,
      ...parsed.data.incompleteAssignment,
    },
    streak: {
      ...defaultNotificationPreferences.streak,
      ...parsed.data.streak,
    },
    timezone: parsed.data.timezone,
    weeklyReport: {
      ...defaultNotificationPreferences.weeklyReport,
      ...parsed.data.weeklyReport,
    },
  };
}

export function mergeNotificationPreferences(
  current: NotificationPreferences,
  patch: NotificationPreferencesPatch,
): NotificationPreferences {
  return parseNotificationPreferences({
    ...current,
    ...patch,
    dailyAssignment: {
      ...current.dailyAssignment,
      ...patch.dailyAssignment,
    },
    incompleteAssignment: {
      ...current.incompleteAssignment,
      ...patch.incompleteAssignment,
    },
    streak: {
      ...current.streak,
      ...patch.streak,
    },
    weeklyReport: {
      ...current.weeklyReport,
      ...patch.weeklyReport,
    },
  });
}

export const notificationPreferencesService = {
  async getPreferences(studentId: string): Promise<NotificationPreferences> {
    const storedPreferences = await preferencesStorage.getPreference<unknown>(
      getNotificationPreferencesKey(studentId),
      defaultNotificationPreferences,
    );

    return parseNotificationPreferences(storedPreferences);
  },

  async updatePreferences(
    studentId: string,
    patch: NotificationPreferencesPatch,
  ): Promise<NotificationPreferences> {
    const currentPreferences = await this.getPreferences(studentId);
    const nextPreferences = mergeNotificationPreferences(currentPreferences, patch);

    await preferencesStorage.setPreference(getNotificationPreferencesKey(studentId), nextPreferences);

    return nextPreferences;
  },

  async resetPreferences(studentId: string): Promise<NotificationPreferences> {
    await preferencesStorage.removePreference(getNotificationPreferencesKey(studentId));

    return defaultNotificationPreferences;
  },
};
