import { defaultNotificationPreferences } from "@/core/notifications/notificationService";

import {
  mergeNotificationPreferences,
  parseNotificationPreferences,
} from "./notificationPreferencesService";

describe("notificationPreferencesService", () => {
  it("parses stored preferences with safe defaults", () => {
    const preferences = parseNotificationPreferences({
      dailyAssignment: {
        enabled: false,
        timeOfDay: "not-a-time",
      },
      timezone: "",
      weeklyReport: {
        weekday: "monday",
      },
    });

    expect(preferences.dailyAssignment).toEqual({
      enabled: false,
      timeOfDay: defaultNotificationPreferences.dailyAssignment.timeOfDay,
    });
    expect(preferences.timezone).toBe(defaultNotificationPreferences.timezone);
    expect(preferences.weeklyReport.weekday).toBe("monday");
  });

  it("merges nested preference patches without dropping defaults", () => {
    const preferences = mergeNotificationPreferences(defaultNotificationPreferences, {
      enabled: false,
      streak: {
        timeOfDay: "18:30",
      },
      weeklyReport: {
        enabled: false,
      },
    });

    expect(preferences.enabled).toBe(false);
    expect(preferences.streak).toEqual({
      enabled: defaultNotificationPreferences.streak.enabled,
      timeOfDay: "18:30",
    });
    expect(preferences.weeklyReport).toEqual({
      ...defaultNotificationPreferences.weeklyReport,
      enabled: false,
    });
  });
});
