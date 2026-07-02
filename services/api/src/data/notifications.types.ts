export type NotificationDevicePlatform = "android" | "ios" | "web";
export type NotificationType = "daily_assignment" | "streak" | "incomplete_assignment" | "weekly_report";
export type NotificationDeliveryStatus = "failed" | "sent" | "skipped";

export interface NotificationDeviceRecord {
  createdAt: string;
  id: string;
  ownerUserId: string;
  platform: NotificationDevicePlatform;
  studentProfileId: string | null;
  tokenHash: string;
  updatedAt: string;
}

export interface PreparedNotificationRecord {
  bodyFallback: string;
  bodyKey: string;
  deliveryStatus: NotificationDeliveryStatus;
  dueAt: string;
  id: string;
  studentProfileId: string;
  titleFallback: string;
  titleKey: string;
  type: NotificationType;
}
