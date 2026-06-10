import * as Notifications from "expo-notifications";

import { routes } from "@/core/navigation/routeNames";

import {
  buildScheduledNotificationRequests,
  WRITEWISE_NOTIFICATION_CHANNEL_ID,
} from "./notificationDeliveryService";
import { defaultNotificationPreferences } from "./notificationService";

describe("notificationDeliveryService", () => {
  it("builds recurring notification requests for enabled preferences", () => {
    const requests = buildScheduledNotificationRequests("student-1", defaultNotificationPreferences);

    expect(requests).toHaveLength(4);
    expect(requests.map((request) => request.identifier)).toEqual([
      "writewise.student-1.daily_assignment",
      "writewise.student-1.incomplete_assignment",
      "writewise.student-1.streak",
      "writewise.student-1.weekly_report",
    ]);
    expect(requests[0]?.trigger).toEqual({
      channelId: WRITEWISE_NOTIFICATION_CHANNEL_ID,
      hour: 16,
      minute: 0,
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
    });
    expect(requests[3]?.trigger).toEqual({
      channelId: WRITEWISE_NOTIFICATION_CHANNEL_ID,
      hour: 17,
      minute: 0,
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
    });
    expect(requests[0]?.content.data).toMatchObject({
      source: "writewise",
      studentId: "student-1",
      targetRoute: String(routes.studentAssignmentsHistory),
    });
  });

  it("returns no requests when notifications are globally disabled", () => {
    expect(
      buildScheduledNotificationRequests("student-1", {
        ...defaultNotificationPreferences,
        enabled: false,
      }),
    ).toEqual([]);
  });

  it("omits disabled notification types", () => {
    const requests = buildScheduledNotificationRequests("student-1", {
      ...defaultNotificationPreferences,
      dailyAssignment: {
        ...defaultNotificationPreferences.dailyAssignment,
        enabled: false,
      },
      weeklyReport: {
        ...defaultNotificationPreferences.weeklyReport,
        enabled: false,
      },
    });

    expect(requests.map((request) => request.type)).toEqual(["incomplete_assignment", "streak"]);
  });
});
