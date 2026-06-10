import {
  ExpoPushProvider,
  NotificationsService,
  type ExpoPushMessage,
  type NotificationCopyResolver,
  type NotificationDeviceRecord,
  type NotificationRepository,
  type NotificationTokenVault,
  type PreparedNotificationDeliveryRecord,
  type PushDeliveryResult,
  type PushNotificationProvider,
} from "../../services/api/src/features/notifications";

function createPreparedNotification(): PreparedNotificationDeliveryRecord {
  return {
    accessibilityLabelKey: "notifications.dailyAssignment.accessibility",
    bodyKey: "notifications.dailyAssignment.body",
    id: "notification-1",
    notificationType: "daily_assignment",
    params: {
      minutes: 10,
      title: "Practice",
    },
    scheduledFor: "2026-06-10T16:00:00.000Z",
    studentProfileId: "student-profile-1",
    targetParams: {
      assignmentId: "assignment-1",
    },
    targetRoute: "/(student)/assignments/history",
    titleKey: "notifications.dailyAssignment.title",
  };
}

function createDevice(): NotificationDeviceRecord {
  return {
    disabledAt: null,
    id: "device-1",
    lastSeenAt: "2026-06-10T15:00:00.000Z",
    platform: "ios",
    pushTokenCiphertext: "sealed:ExpoPushToken[device]",
    studentProfileId: "student-profile-1",
    tokenHash: "hash:ExpoPushToken[device]",
    userId: "user-1",
  };
}

class MemoryNotificationRepository implements NotificationRepository {
  public readonly disabledDevices: Array<{ tokenHash: string; userId: string }> = [];
  public readonly failedNotifications: Array<{ notificationId: string; reason: string }> = [];
  public readonly sentNotifications: string[] = [];
  public devices: NotificationDeviceRecord[] = [];
  public dueNotifications: PreparedNotificationDeliveryRecord[] = [];

  async disableNotificationDevice(input: { tokenHash: string; userId: string }): Promise<void> {
    this.disabledDevices.push(input);
  }

  async listActiveNotificationDevices(studentProfileId: string): Promise<NotificationDeviceRecord[]> {
    return this.devices.filter(
      (device) => device.studentProfileId === studentProfileId && device.disabledAt === null,
    );
  }

  async listDuePreparedNotifications(): Promise<PreparedNotificationDeliveryRecord[]> {
    return this.dueNotifications;
  }

  async markPreparedNotificationFailed(input: {
    failedAt: string;
    notificationId: string;
    reason: string;
  }): Promise<void> {
    this.failedNotifications.push({
      notificationId: input.notificationId,
      reason: input.reason,
    });
  }

  async markPreparedNotificationSent(input: { notificationId: string; sentAt: string }): Promise<void> {
    this.sentNotifications.push(input.notificationId);
  }

  async upsertNotificationDevice(input: {
    platform: "android" | "ios" | "web";
    pushTokenCiphertext: string;
    studentProfileId: string | null;
    tokenHash: string;
    userId: string;
  }): Promise<NotificationDeviceRecord> {
    const device = {
      disabledAt: null,
      id: "device-registered",
      lastSeenAt: "2026-06-10T15:00:00.000Z",
      ...input,
    };

    this.devices = [device];

    return device;
  }
}

class TestTokenVault implements NotificationTokenVault {
  async hashExpoPushToken(expoPushToken: string): Promise<string> {
    return `hash:${expoPushToken}`;
  }

  async openExpoPushToken(ciphertext: string): Promise<string> {
    return ciphertext.replace("sealed:", "");
  }

  async sealExpoPushToken(expoPushToken: string): Promise<string> {
    return `sealed:${expoPushToken}`;
  }
}

class CapturingPushProvider implements PushNotificationProvider {
  public messages: ExpoPushMessage[] = [];
  public result: PushDeliveryResult[] = [{ status: "ok" }];

  async send(messages: ExpoPushMessage[]): Promise<PushDeliveryResult[]> {
    this.messages = messages;
    return this.result;
  }
}

const copyResolver: NotificationCopyResolver = {
  async resolvePreparedNotificationCopy() {
    return {
      body: "Practice is ready.",
      title: "Writing practice",
    };
  },
};

describe("notifications backend service", () => {
  it("hashes and seals Expo tokens before registering a notification device", async () => {
    const repository = new MemoryNotificationRepository();
    const service = new NotificationsService({
      copyResolver,
      pushProvider: new CapturingPushProvider(),
      repository,
      tokenVault: new TestTokenVault(),
    });

    const result = await service.registerDevice({
      expoPushToken: "ExpoPushToken[device]",
      platform: "ios",
      studentProfileId: "student-profile-1",
      userId: "user-1",
    });

    expect(result).toEqual({
      deviceId: "device-registered",
      status: "registered",
    });
    expect(repository.devices[0]).toMatchObject({
      pushTokenCiphertext: "sealed:ExpoPushToken[device]",
      tokenHash: "hash:ExpoPushToken[device]",
    });
  });

  it("sends due prepared notifications through the push provider and marks them sent", async () => {
    const repository = new MemoryNotificationRepository();
    const pushProvider = new CapturingPushProvider();
    repository.devices = [createDevice()];
    repository.dueNotifications = [createPreparedNotification()];
    const service = new NotificationsService({
      copyResolver,
      pushProvider,
      repository,
      tokenVault: new TestTokenVault(),
    });

    const result = await service.sendDuePreparedNotifications({
      dueBefore: "2026-06-10T17:00:00.000Z",
      now: "2026-06-10T17:01:00.000Z",
    });

    expect(result).toEqual({
      failed: 0,
      sent: 1,
      skipped: 0,
    });
    expect(pushProvider.messages).toEqual([
      {
        body: "Practice is ready.",
        data: {
          notificationId: "notification-1",
          notificationType: "daily_assignment",
          source: "writewise",
          targetParams: {
            assignmentId: "assignment-1",
          },
          targetRoute: "/(student)/assignments/history",
        },
        sound: "default",
        title: "Writing practice",
        to: "ExpoPushToken[device]",
      },
    ]);
    expect(repository.sentNotifications).toEqual(["notification-1"]);
  });

  it("marks due notifications failed when no active devices are registered", async () => {
    const repository = new MemoryNotificationRepository();
    repository.dueNotifications = [createPreparedNotification()];
    const service = new NotificationsService({
      copyResolver,
      pushProvider: new CapturingPushProvider(),
      repository,
      tokenVault: new TestTokenVault(),
    });

    const result = await service.sendDuePreparedNotifications({
      dueBefore: "2026-06-10T17:00:00.000Z",
    });

    expect(result.failed).toBe(1);
    expect(repository.failedNotifications).toEqual([
      {
        notificationId: "notification-1",
        reason: "no_active_devices",
      },
    ]);
  });

  it("posts Expo push batches to Expo's push API", async () => {
    const fetchImpl: typeof fetch = jest.fn(async () => ({
      json: async () => ({
        data: [{ status: "ok" }],
      }),
      ok: true,
      status: 200,
    } as Response));
    const provider = new ExpoPushProvider(fetchImpl, "https://example.test/push");

    const result = await provider.send([
      {
        body: "Body",
        data: { source: "writewise" },
        sound: "default",
        title: "Title",
        to: "ExpoPushToken[device]",
      },
    ]);

    expect(result).toEqual([{ errorMessage: undefined, status: "ok" }]);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://example.test/push",
      expect.objectContaining({
        body: JSON.stringify([
          {
            body: "Body",
            data: { source: "writewise" },
            sound: "default",
            title: "Title",
            to: "ExpoPushToken[device]",
          },
        ]),
        method: "POST",
      }),
    );
  });
});
