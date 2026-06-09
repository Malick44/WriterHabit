import {
  defaultNotificationPreferences,
  prepareDailyAssignmentNotification,
  prepareNotificationBatch,
  prepareStreakNotification,
} from "./notificationService";

const assignment = {
  estimatedMinutes: 15,
  id: "daily-paragraph-evidence",
  status: "in_progress" as const,
  title: "Support a paragraph idea",
};

describe("notificationService", () => {
  it("prepares localization-keyed daily assignment notifications", () => {
    const notification = prepareDailyAssignmentNotification({
      assignment,
      preferences: defaultNotificationPreferences,
      referenceDate: "2026-06-09",
      studentId: "student-1",
    });

    expect(notification).toMatchObject({
      bodyKey: "notifications.dailyAssignment.body",
      id: "student-1:daily_assignment:daily-paragraph-evidence",
      params: {
        minutes: 15,
        title: "Support a paragraph idea",
      },
      scheduledForLocal: "2026-06-09T16:00:00",
      titleKey: "notifications.dailyAssignment.title",
      type: "daily_assignment",
    });
  });

  it("does not prepare streak notifications unless the streak can be saved today", () => {
    const continued = prepareStreakNotification({
      preferences: defaultNotificationPreferences,
      referenceDate: "2026-06-09",
      streak: {
        canContinueToday: false,
        currentDays: 4,
        nextMilestoneDays: 5,
        shouldSendReminder: false,
        status: "continued",
      },
      studentId: "student-1",
    });

    const atRisk = prepareStreakNotification({
      preferences: defaultNotificationPreferences,
      referenceDate: "2026-06-09",
      streak: {
        canContinueToday: true,
        currentDays: 4,
        nextMilestoneDays: 5,
        shouldSendReminder: true,
        status: "at_risk",
      },
      studentId: "student-1",
    });

    expect(continued).toBeNull();
    expect(atRisk?.type).toBe("streak");
  });

  it("respects disabled notification preferences in a batch", () => {
    const notifications = prepareNotificationBatch({
      dailyAssignment: assignment,
      preferences: {
        ...defaultNotificationPreferences,
        dailyAssignment: {
          ...defaultNotificationPreferences.dailyAssignment,
          enabled: false,
        },
      },
      referenceDate: "2026-06-09",
      streak: {
        canContinueToday: true,
        currentDays: 2,
        nextMilestoneDays: 3,
        shouldSendReminder: true,
        status: "at_risk",
      },
      studentId: "student-1",
      weeklyReport: {
        assignmentsCompleted: 3,
        minutesCompleted: 45,
        weekLabel: "Jun 3 - Jun 9",
      },
    });

    expect(notifications.map((notification) => notification.type)).toEqual([
      "streak",
      "incomplete_assignment",
      "weekly_report",
    ]);
  });
});
