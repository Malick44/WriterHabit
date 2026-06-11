import { Platform } from "react-native";

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

function getNotificationPlatform(): NotificationDevicePlatform {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return Platform.OS;
  }

  return "web";
}

async function getAuthHeaders(): Promise<Record<string, string> | null> {
  const accessToken = await getApiAccessToken();

  if (!accessToken) {
    return null;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export const profilesettingsApi = {
  async registerNotificationDevice({
    expoPushToken,
    idempotencyKey,
    platform = getNotificationPlatform(),
    studentId,
  }: RegisterNotificationDeviceInput): Promise<RegisterNotificationDeviceResult> {
    const headers = await getAuthHeaders();

    if (!headers) {
      return { status: "skipped" };
    }

    return apiClient.post<RegisterNotificationDeviceResult>(
      `/students/${studentId}/notifications/register-device`,
      {
        expoPushToken,
        idempotencyKey,
        platform,
      },
      { auth: "manual", headers },
    );
  },

  async unregisterNotificationDevice({
    expoPushToken,
    studentId,
  }: UnregisterNotificationDeviceInput): Promise<{ status: "unregistered" | "skipped" }> {
    const headers = await getAuthHeaders();

    if (!headers) {
      return { status: "skipped" };
    }

    return apiClient.post<{ status: "unregistered" | "skipped" }>(
      `/students/${studentId}/notifications/unregister-device`,
      {
        expoPushToken,
      },
      { auth: "manual", headers },
    );
  },
};
