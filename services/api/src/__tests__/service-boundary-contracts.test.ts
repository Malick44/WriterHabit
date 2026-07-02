import { describe, expect, it } from "vitest";

import type { EntitlementRecord } from "../data";
import { createAuditEvent, auditEventToDatabaseRow } from "../features/audit/audit.service";
import type { AiCoachResponse as BackendAiCoachResponse } from "../features/ai/contracts";
import type {
  NotificationCopyResolver,
  NotificationRepository,
  NotificationTokenVault,
  PushNotificationProvider,
} from "../features/notifications";
import { NotificationsService } from "../features/notifications";
import { mapAiCoachApiResponse } from "../mappers/ai-coach.mapper";
import { mapEntitlementApiResponse } from "../mappers/subscriptions.mapper";
import { aiCoachResponseSchema } from "../../../../apps/mobile/src/features/ai-coach/types";
import { subscriptionApiResponseSchema } from "../../../../apps/mobile/src/features/subscriptions/types";

const generatedAt = "2026-06-30T18:00:00.000Z";

describe("service boundary contracts", () => {
  it("maps backend AI coach responses into the current mobile Zod schema", () => {
    const response: BackendAiCoachResponse = {
      action: "check_sentence",
      coachingMessage: {
        fallback: "Your sentence has a clear idea. Check one detail to make it stronger.",
        key: "ai.coach.contract.message",
      },
      generatedAt,
      id: "coach-response-1",
      nextStep: {
        fallback: "Read the sentence once and add one detail in your own words.",
        key: "ai.coach.contract.nextStep",
      },
      provider: {
        estimatedTokens: {
          inputTokens: 20,
          outputTokens: 30,
          totalTokens: 50,
        },
        kind: "mock",
        requestId: "provider-request-1",
      },
      questionForStudent: {
        fallback: "What detail helps the reader picture your idea?",
        key: "ai.coach.contract.question",
      },
      safetyFlags: [],
      status: "completed",
      title: {
        fallback: "Clear idea",
        key: "ai.coach.contract.title",
      },
      usage: {
        dailyLimit: 10,
        requestsToday: 1,
      },
    };
    const mobileResponse = mapAiCoachApiResponse({
      clientAction: "sentence_check",
      response,
    });

    expect(() => aiCoachResponseSchema.parse(mobileResponse)).not.toThrow();
  });

  it("maps entitlement records into the current mobile subscription Zod schema", () => {
    const entitlement: EntitlementRecord = {
      billingPeriod: "year",
      canAccessPremium: true,
      createdAt: generatedAt,
      currentPeriodEndsAt: "2026-12-30T18:00:00.000Z",
      currentPlanId: "WriterHabit_plus_yearly",
      id: "entitlement-1",
      managementUrl: "https://billing.writerhabit.test/manage",
      ownerUserId: "user-1",
      provider: "revenuecat",
      providerCustomerId: "user-1",
      providerLastEventId: "event-1",
      providerLastEventTimestampMs: 1780000000000,
      providerLastEventType: "RENEWAL",
      providerSubscriptionId: "subscription-1",
      scopeId: null,
      scopeType: "personal",
      status: "active",
      trialEndsAt: null,
      updatedAt: generatedAt,
    };
    const response = mapEntitlementApiResponse({
      entitlement,
      generatedAt,
      principal: { id: "user-1", role: "parent" },
    });

    expect(() => subscriptionApiResponseSchema.parse(response)).not.toThrow();
  });

  it("does not expose Expo push tokens in notification registration responses", async () => {
    const repository: NotificationRepository = {
      async disableNotificationDevice() {},
      async listActiveNotificationDevices() {
        return [];
      },
      async listDuePreparedNotifications() {
        return [];
      },
      async markPreparedNotificationFailed() {},
      async markPreparedNotificationSent() {},
      async upsertNotificationDevice(input) {
        return {
          disabledAt: null,
          id: "device-1",
          lastSeenAt: generatedAt,
          platform: input.platform,
          pushTokenCiphertext: input.pushTokenCiphertext,
          studentProfileId: input.studentProfileId,
          tokenHash: input.tokenHash,
          userId: input.userId,
        };
      },
    };
    const tokenVault: NotificationTokenVault = {
      async hashExpoPushToken() {
        return "token-hash";
      },
      async openExpoPushToken() {
        return "ExpoPushToken[secret]";
      },
      async sealExpoPushToken() {
        return "sealed-token";
      },
    };
    const copyResolver: NotificationCopyResolver = {
      async resolvePreparedNotificationCopy() {
        return { body: "Body", title: "Title" };
      },
    };
    const pushProvider: PushNotificationProvider = {
      async send() {
        return [];
      },
    };
    const service = new NotificationsService({
      copyResolver,
      pushProvider,
      repository,
      tokenVault,
    });
    const response = await service.registerDevice({
      expoPushToken: "ExpoPushToken[secret]",
      platform: "ios",
      studentProfileId: "student-profile-1",
      userId: "user-1",
    });
    const serialized = JSON.stringify(response);

    expect(response).toEqual({ deviceId: "device-1", status: "registered" });
    expect(serialized).not.toContain("ExpoPushToken");
    expect(serialized).not.toContain("sealed-token");
    expect(serialized).not.toContain("token-hash");
  });

  it("sanitizes audit metadata before database-row mapping", () => {
    const event = createAuditEvent(
      {
        action: "ai.coach.response",
        actorRole: "student",
        actorUserId: "user-1",
        metadata: {
          fullDraft: "PRIVATE FULL DRAFT TEXT",
          nested: {
            keep: "bounded",
            unsafeFunction: () => "drop me",
          },
        },
        requestId: "request-1",
        result: "success",
        targetId: "submission-1",
        targetType: "submission",
      },
      new Date(generatedAt),
    );
    const row = auditEventToDatabaseRow(event);

    expect(row.metadata).toMatchObject({
      fullDraft: "[redacted]",
      nested: { keep: "bounded" },
    });
    expect(JSON.stringify(row.metadata)).not.toContain("PRIVATE FULL DRAFT TEXT");
    expect(JSON.stringify(row.metadata)).not.toContain("unsafeFunction");
  });
});
