import { z } from "zod";

import {
  defaultNotificationPreferences,
  notificationWeekdays,
  type NotificationPreferences,
  type NotificationTypePreference,
  type WeeklyReportNotificationPreference,
} from "@/core/notifications/notificationService";
import { supabase } from "@/core/supabase/supabaseClient";
import { preferencesStorage } from "@/services/storage/preferencesStorage";

const NOTIFICATION_PREFERENCES_KEY_PREFIX = "profile-settings.notifications";
const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const remoteNotificationPreferencesRowSchema = z.object({
  daily_assignment_enabled: z.boolean(),
  daily_assignment_time: z.string(),
  enabled: z.boolean(),
  incomplete_assignment_enabled: z.boolean(),
  incomplete_assignment_time: z.string(),
  streak_enabled: z.boolean(),
  streak_time: z.string(),
  timezone: z.string(),
  weekly_report_enabled: z.boolean(),
  weekly_report_time: z.string(),
  weekly_report_weekday: z.enum(notificationWeekdays),
});

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

function mapRemoteNotificationPreferences(value: unknown): NotificationPreferences | null {
  const parsed = remoteNotificationPreferencesRowSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  return parseNotificationPreferences({
    dailyAssignment: {
      enabled: parsed.data.daily_assignment_enabled,
      timeOfDay: parsed.data.daily_assignment_time,
    },
    enabled: parsed.data.enabled,
    incompleteAssignment: {
      enabled: parsed.data.incomplete_assignment_enabled,
      timeOfDay: parsed.data.incomplete_assignment_time,
    },
    streak: {
      enabled: parsed.data.streak_enabled,
      timeOfDay: parsed.data.streak_time,
    },
    timezone: parsed.data.timezone,
    weeklyReport: {
      enabled: parsed.data.weekly_report_enabled,
      timeOfDay: parsed.data.weekly_report_time,
      weekday: parsed.data.weekly_report_weekday,
    },
  });
}

async function getRemoteNotificationPreferences(): Promise<NotificationPreferences | null> {
  const { data: authData } = await supabase.auth.getSession();

  if (!authData.session) {
    return null;
  }

  const { data, error } = await supabase
    .rpc("get_own_notification_preferences")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRemoteNotificationPreferences(data);
}

async function updateRemoteNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences | null> {
  const { data: authData } = await supabase.auth.getSession();

  if (!authData.session) {
    return null;
  }

  const { data, error } = await supabase
    .rpc("upsert_own_notification_preferences", {
      p_daily_assignment_enabled: preferences.dailyAssignment.enabled,
      p_daily_assignment_time: preferences.dailyAssignment.timeOfDay,
      p_enabled: preferences.enabled,
      p_incomplete_assignment_enabled: preferences.incompleteAssignment.enabled,
      p_incomplete_assignment_time: preferences.incompleteAssignment.timeOfDay,
      p_streak_enabled: preferences.streak.enabled,
      p_streak_time: preferences.streak.timeOfDay,
      p_timezone: preferences.timezone,
      p_weekly_report_enabled: preferences.weeklyReport.enabled,
      p_weekly_report_time: preferences.weeklyReport.timeOfDay,
      p_weekly_report_weekday: preferences.weeklyReport.weekday,
    })
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRemoteNotificationPreferences(data);
}

export const notificationPreferencesService = {
  async getPreferences(studentId: string): Promise<NotificationPreferences> {
    const storedPreferences = await preferencesStorage.getPreference<unknown>(
      getNotificationPreferencesKey(studentId),
      defaultNotificationPreferences,
    );
    const localPreferences = parseNotificationPreferences(storedPreferences);
    const remotePreferences = await getRemoteNotificationPreferences();

    if (remotePreferences) {
      await preferencesStorage.setPreference(getNotificationPreferencesKey(studentId), remotePreferences);
      return remotePreferences;
    }

    return localPreferences;
  },

  async updatePreferences(
    studentId: string,
    patch: NotificationPreferencesPatch,
  ): Promise<NotificationPreferences> {
    const currentPreferences = await this.getPreferences(studentId);
    const nextPreferences = mergeNotificationPreferences(currentPreferences, patch);

    await preferencesStorage.setPreference(getNotificationPreferencesKey(studentId), nextPreferences);

    const remotePreferences = await updateRemoteNotificationPreferences(nextPreferences);

    if (remotePreferences) {
      await preferencesStorage.setPreference(getNotificationPreferencesKey(studentId), remotePreferences);
      return remotePreferences;
    }

    return nextPreferences;
  },

  async resetPreferences(studentId: string): Promise<NotificationPreferences> {
    await preferencesStorage.removePreference(getNotificationPreferencesKey(studentId));

    return defaultNotificationPreferences;
  },
};
