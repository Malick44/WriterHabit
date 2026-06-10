export type NotificationDevicePlatform = "android" | "ios" | "web";

export type NotificationType =
  | "daily_assignment"
  | "incomplete_assignment"
  | "streak"
  | "weekly_report";

export type NotificationDeliveryStatus = "failed" | "sent" | "skipped";

export interface NotificationDeviceRegistrationRequest {
  expoPushToken: string;
  idempotencyKey?: string;
  platform: NotificationDevicePlatform;
  studentProfileId?: string | null;
  userId: string;
}

export interface NotificationDeviceRegistrationResponse {
  deviceId: string;
  status: "registered";
}

export interface NotificationDeviceUnregistrationRequest {
  expoPushToken: string;
  userId: string;
}

export interface NotificationDeviceRecord {
  disabledAt: string | null;
  id: string;
  lastSeenAt: string;
  platform: NotificationDevicePlatform;
  pushTokenCiphertext: string;
  studentProfileId: string | null;
  tokenHash: string;
  userId: string;
}

export interface PreparedNotificationDeliveryRecord {
  accessibilityLabelKey: string;
  bodyKey: string;
  id: string;
  notificationType: NotificationType;
  params: Record<string, string | number>;
  scheduledFor: string;
  studentProfileId: string;
  targetParams: Record<string, string>;
  targetRoute: string;
  titleKey: string;
}

export interface NotificationRepository {
  disableNotificationDevice(input: {
    tokenHash: string;
    userId: string;
  }): Promise<void>;
  listActiveNotificationDevices(studentProfileId: string): Promise<NotificationDeviceRecord[]>;
  listDuePreparedNotifications(input: {
    dueBefore: string;
    limit: number;
  }): Promise<PreparedNotificationDeliveryRecord[]>;
  markPreparedNotificationFailed(input: {
    failedAt: string;
    notificationId: string;
    reason: string;
  }): Promise<void>;
  markPreparedNotificationSent(input: {
    notificationId: string;
    sentAt: string;
  }): Promise<void>;
  upsertNotificationDevice(input: {
    platform: NotificationDevicePlatform;
    pushTokenCiphertext: string;
    studentProfileId: string | null;
    tokenHash: string;
    userId: string;
  }): Promise<NotificationDeviceRecord>;
}

export interface NotificationTokenVault {
  hashExpoPushToken(expoPushToken: string): Promise<string>;
  openExpoPushToken(ciphertext: string): Promise<string>;
  sealExpoPushToken(expoPushToken: string): Promise<string>;
}

export interface NotificationCopyResolver {
  resolvePreparedNotificationCopy(
    notification: PreparedNotificationDeliveryRecord,
  ): Promise<{
    body: string;
    title: string;
  }>;
}

export interface ExpoPushMessage {
  body: string;
  data: Record<string, unknown>;
  sound: "default";
  title: string;
  to: string;
}

export interface PushDeliveryResult {
  errorMessage?: string;
  status: "error" | "ok";
}

export interface PushNotificationProvider {
  send(messages: ExpoPushMessage[]): Promise<PushDeliveryResult[]>;
}

export interface SendDueNotificationsInput {
  dueBefore: string;
  limit?: number;
  now?: string;
}

export interface SendDueNotificationsResult {
  failed: number;
  sent: number;
  skipped: number;
}
