import {
  type ExpoPushMessage,
  type NotificationCopyResolver,
  type NotificationDeliveryStatus,
  type NotificationDevicePlatform,
  type NotificationDeviceRegistrationRequest,
  type NotificationDeviceRegistrationResponse,
  type NotificationDeviceUnregistrationRequest,
  type NotificationRepository,
  type NotificationTokenVault,
  type PreparedNotificationDeliveryRecord,
  type PushDeliveryResult,
  type PushNotificationProvider,
  type SendDueNotificationsInput,
  type SendDueNotificationsResult,
} from "./notifications.contracts";

const supportedPlatforms = new Set<NotificationDevicePlatform>(["android", "ios", "web"]);
const defaultDueNotificationLimit = 100;

function ensureNonBlank(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${fieldName} must not be blank`);
  }

  return trimmed;
}

function ensureExpoPushToken(value: string): string {
  const token = ensureNonBlank(value, "expoPushToken");

  if (!/^Expo(nent)?PushToken\[[^\]]+\]$/.test(token)) {
    throw new Error("expoPushToken must be an Expo push token");
  }

  return token;
}

function ensurePlatform(value: NotificationDevicePlatform): NotificationDevicePlatform {
  if (!supportedPlatforms.has(value)) {
    throw new Error(`Unsupported notification device platform: ${value}`);
  }

  return value;
}

function normalizeLimit(value: number | undefined): number {
  if (value === undefined) {
    return defaultDueNotificationLimit;
  }

  if (!Number.isInteger(value) || value < 1 || value > 500) {
    throw new Error("Notification delivery limit must be between 1 and 500");
  }

  return value;
}

export class ExpoPushProvider implements PushNotificationProvider {
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;

  constructor(fetchImpl: typeof fetch = fetch, endpoint = "https://exp.host/--/api/v2/push/send") {
    this.endpoint = endpoint;
    this.fetchImpl = fetchImpl;
  }

  async send(messages: ExpoPushMessage[]): Promise<PushDeliveryResult[]> {
    if (messages.length === 0) {
      return [];
    }

    const response = await this.fetchImpl(this.endpoint, {
      body: JSON.stringify(messages),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Expo push request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{
        details?: Record<string, unknown>;
        message?: string;
        status?: string;
      }>;
    };

    return (payload.data ?? []).map((ticket) => ({
      errorMessage: typeof ticket.message === "string" ? ticket.message : undefined,
      status: ticket.status === "ok" ? "ok" : "error",
    }));
  }
}

export class NotificationsService {
  private readonly copyResolver: NotificationCopyResolver;
  private readonly pushProvider: PushNotificationProvider;
  private readonly repository: NotificationRepository;
  private readonly tokenVault: NotificationTokenVault;

  constructor(input: {
    copyResolver: NotificationCopyResolver;
    pushProvider: PushNotificationProvider;
    repository: NotificationRepository;
    tokenVault: NotificationTokenVault;
  }) {
    this.copyResolver = input.copyResolver;
    this.pushProvider = input.pushProvider;
    this.repository = input.repository;
    this.tokenVault = input.tokenVault;
  }

  async registerDevice(
    input: NotificationDeviceRegistrationRequest,
  ): Promise<NotificationDeviceRegistrationResponse> {
    const expoPushToken = ensureExpoPushToken(input.expoPushToken);
    const userId = ensureNonBlank(input.userId, "userId");
    const tokenHash = await this.tokenVault.hashExpoPushToken(expoPushToken);
    const pushTokenCiphertext = await this.tokenVault.sealExpoPushToken(expoPushToken);
    const device = await this.repository.upsertNotificationDevice({
      platform: ensurePlatform(input.platform),
      pushTokenCiphertext,
      studentProfileId: input.studentProfileId ?? null,
      tokenHash,
      userId,
    });

    return {
      deviceId: device.id,
      status: "registered",
    };
  }

  async unregisterDevice(input: NotificationDeviceUnregistrationRequest): Promise<{ status: "unregistered" }> {
    const expoPushToken = ensureExpoPushToken(input.expoPushToken);
    const userId = ensureNonBlank(input.userId, "userId");
    const tokenHash = await this.tokenVault.hashExpoPushToken(expoPushToken);

    await this.repository.disableNotificationDevice({
      tokenHash,
      userId,
    });

    return { status: "unregistered" };
  }

  async sendDuePreparedNotifications(input: SendDueNotificationsInput): Promise<SendDueNotificationsResult> {
    const dueNotifications = await this.repository.listDuePreparedNotifications({
      dueBefore: ensureNonBlank(input.dueBefore, "dueBefore"),
      limit: normalizeLimit(input.limit),
    });
    const result: SendDueNotificationsResult = {
      failed: 0,
      sent: 0,
      skipped: 0,
    };
    const sentAt = input.now ?? new Date().toISOString();

    for (const notification of dueNotifications) {
      const status = await this.sendPreparedNotification(notification, sentAt);
      result[status] += 1;
    }

    return result;
  }

  private async sendPreparedNotification(
    notification: PreparedNotificationDeliveryRecord,
    sentAt: string,
  ): Promise<NotificationDeliveryStatus> {
    const devices = await this.repository.listActiveNotificationDevices(notification.studentProfileId);

    if (devices.length === 0) {
      await this.repository.markPreparedNotificationFailed({
        failedAt: sentAt,
        notificationId: notification.id,
        reason: "no_active_devices",
      });
      return "failed";
    }

    const copy = await this.copyResolver.resolvePreparedNotificationCopy(notification);
    const messages: ExpoPushMessage[] = [];

    for (const device of devices) {
      const token = await this.tokenVault.openExpoPushToken(device.pushTokenCiphertext);
      messages.push({
        body: copy.body,
        data: {
          notificationId: notification.id,
          notificationType: notification.notificationType,
          source: "writewise",
          targetParams: notification.targetParams,
          targetRoute: notification.targetRoute,
        },
        sound: "default",
        title: copy.title,
        to: token,
      });
    }

    const deliveryResults = await this.pushProvider.send(messages);
    const sent = deliveryResults.some((deliveryResult) => deliveryResult.status === "ok");

    if (sent) {
      await this.repository.markPreparedNotificationSent({
        notificationId: notification.id,
        sentAt,
      });
      return "sent";
    }

    await this.repository.markPreparedNotificationFailed({
      failedAt: sentAt,
      notificationId: notification.id,
      reason: "push_provider_rejected",
    });

    return "failed";
  }
}
