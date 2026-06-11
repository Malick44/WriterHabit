import { Platform } from "react-native";
import { z } from "zod";

import { apiClient } from "@/core/api/apiClient";
import { getApiAccessToken } from "@/core/api/apiTokenProvider";

export type NotificationDevicePlatform = "android" | "ios" | "web";

export interface RegisterNotificationDeviceInput {
  expoPushToken: string;
  idempotencyKey?: string;
  platform?: NotificationDevicePlatform;
  studentId: string;
}

export interface RegisterNotificationDeviceResult {
  deviceId?: string;
  status: "registered" | "skipped";
}

export interface UnregisterNotificationDeviceInput {
  expoPushToken: string;
  studentId: string;
}

export const registerNotificationDeviceResultSchema = z.object({
  deviceId: z.string().min(1).optional(),
  status: z.enum(["registered", "skipped"]),
});

export const unregisterNotificationDeviceResultSchema = z.object({
  status: z.enum(["unregistered", "skipped"]),
});

function getNotificationPlatform(): NotificationDevicePlatform {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return Platform.OS;
  }

  return "web";
}

async function hasAuthSession(): Promise<boolean> {
  const accessToken = await getApiAccessToken();
  return Boolean(accessToken);
}

export const profilesettingsApi = {
  async registerNotificationDevice({
    expoPushToken,
    idempotencyKey,
    platform = getNotificationPlatform(),
    studentId,
  }: RegisterNotificationDeviceInput): Promise<RegisterNotificationDeviceResult> {
    if (!(await hasAuthSession())) {
      return { status: "skipped" };
    }

    return apiClient.post<RegisterNotificationDeviceResult>(
      `/students/${studentId}/notifications/register-device`,
      {
        expoPushToken,
        idempotencyKey,
        platform,
      },
      { schema: registerNotificationDeviceResultSchema },
    );
  },

  async unregisterNotificationDevice({
    expoPushToken,
    studentId,
  }: UnregisterNotificationDeviceInput): Promise<{ status: "unregistered" | "skipped" }> {
    if (!(await hasAuthSession())) {
      return { status: "skipped" };
    }

    return apiClient.post<{ status: "unregistered" | "skipped" }>(
      `/students/${studentId}/notifications/unregister-device`,
      {
        expoPushToken,
      },
      { schema: unregisterNotificationDeviceResultSchema },
    );
  },
};
