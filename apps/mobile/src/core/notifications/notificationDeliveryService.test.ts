import * as Notifications from "expo-notifications";

import { routes } from "@/core/navigation/routeNames";

import {
  buildScheduledNotificationRequests,
  resolveExpoProjectId,
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

  it("ignores placeholder EAS project ids for push token registration", () => {
    expect(
      resolveExpoProjectId({
        easConfig: null,
        expoConfig: {
          extra: {
            eas: {
              projectId: "WRITEWISE_EAS_PROJECT_ID_REQUIRED",
            },
          },
        },
      }),
    ).toBeNull();
  });

  it("reads a real EAS project id from Expo config extras", () => {
    const projectId = "123e4567-e89b-12d3-a456-426614174000";

    expect(
      resolveExpoProjectId({
        easConfig: null,
        expoConfig: {
          extra: {
            eas: {
              projectId,
            },
          },
        },
      }),
    ).toBe(projectId);
  });

  it("prefers Constants.easConfig over Expo config extras", () => {
    const easProjectId = "123e4567-e89b-12d3-a456-426614174000";
    const extraProjectId = "223e4567-e89b-12d3-a456-426614174000";

    expect(
      resolveExpoProjectId({
        easConfig: {
          projectId: easProjectId,
        },
        expoConfig: {
          extra: {
            eas: {
              projectId: extraProjectId,
            },
          },
        },
      }),
    ).toBe(easProjectId);
  });

  it("falls back to Expo config extras when Constants.easConfig is empty", () => {
    const projectId = "123e4567-e89b-12d3-a456-426614174000";

    expect(
      resolveExpoProjectId({
        easConfig: {},
        expoConfig: {
          extra: {
            eas: {
              projectId,
            },
          },
        },
      }),
    ).toBe(projectId);
  });
});
