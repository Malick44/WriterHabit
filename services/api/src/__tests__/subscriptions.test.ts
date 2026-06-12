import type { FastifyInstance, InjectOptions } from "fastify";
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MemoryDatabase } from "../data";
import type { EntitlementRecord, EntitlementStatus } from "../data/types";
import type { ApiConfig } from "../runtime/config";
import { buildServer } from "../server";

const testJwtSecret = "writerhabit-test-jwt-secret-at-least-32-chars";
const testIssuer = "https://writerhabit.supabase.test/auth/v1";
const testAudience = "authenticated";
const userId = "00000000-0000-4000-8000-000000000001";
const webhookAuthorization = "test-revenuecat-webhook-auth";

function createTestConfig(): ApiConfig {
  return {
    apiBasePath: "/api/v1",
    auth: {
      audience: testAudience,
      issuer: testIssuer,
      jwtSecret: testJwtSecret,
      mode: "hs256",
    },
    cors: {
      allowLocalhostInDevelopment: true,
      allowedOrigins: [],
    },
    database: {
      mode: "unconfigured",
    },
    environment: "test",
    host: "127.0.0.1",
    logLevel: "silent",
    payments: {
      provider: "revenuecat",
      revenueCat: {
        entitlementId: "plus",
        webhookAuthorization,
      },
    },
    port: 3000,
  };
}

async function signTestToken(input: {
  appMetadataRole?: "student" | "parent" | "teacher" | "admin";
  subject?: string;
} = {}): Promise<string> {
  return new SignJWT({
    app_metadata: input.appMetadataRole ? { role: input.appMetadataRole } : {},
    email: `${input.subject ?? userId}@example.com`,
    user_metadata: {
      display_name: "Test User",
      onboarding_complete: true,
    },
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setAudience(testAudience)
    .setExpirationTime("15m")
    .setIssuer(testIssuer)
    .setIssuedAt()
    .setSubject(input.subject ?? userId)
    .sign(new TextEncoder().encode(testJwtSecret));
}

function makeEntitlement(overrides: Partial<EntitlementRecord> = {}): EntitlementRecord {
  return {
    billingPeriod: "year",
    canAccessPremium: true,
    createdAt: "2026-06-11T08:00:00.000Z",
    currentPeriodEndsAt: "2026-07-11T08:00:00.000Z",
    currentPlanId: "WriterHabit_plus_yearly",
    id: `entitlement-${overrides.status ?? "active"}`,
    managementUrl: null,
    ownerUserId: userId,
    provider: "revenuecat",
    providerCustomerId: userId,
    providerLastEventId: null,
    providerLastEventTimestampMs: null,
    providerLastEventType: null,
    providerSubscriptionId: `${userId}:WriterHabit_plus_yearly`,
    scopeId: null,
    scopeType: "personal",
    status: "active",
    trialEndsAt: null,
    updatedAt: "2026-06-11T08:00:00.000Z",
    ...overrides,
  };
}

describe("WriterHabit subscriptions API", () => {
  let app: FastifyInstance;
  let database: MemoryDatabase;
  let token: string;

  async function createApp(seed: ConstructorParameters<typeof MemoryDatabase>[0] = {}) {
    database = new MemoryDatabase(seed);
    app = await buildServer({
      config: createTestConfig(),
      database,
      logger: false,
    });
    await app.ready();
    token = await signTestToken();
  }

  afterEach(async () => {
    await app.close();
  });

  function inject(requestToken: string | null, options: InjectOptions) {
    return app.inject({
      ...options,
      headers: {
        ...(requestToken ? { authorization: `Bearer ${requestToken}` } : {}),
        ...(options.payload !== undefined ? { "content-type": "application/json" } : {}),
        ...options.headers,
      },
    });
  }

  function postRevenueCatEvent(event: Record<string, unknown>) {
    return inject(null, {
      headers: {
        authorization: webhookAuthorization,
      },
      method: "POST",
      payload: { event },
      url: "/api/v1/webhooks/revenuecat",
    });
  }

  describe("entitlement reads", () => {
    beforeEach(async () => {
      await createApp();
    });

    it("returns a free entitlement when the server has no paid entitlement row", async () => {
      const response = await inject(token, {
        method: "GET",
        url: "/api/v1/me/entitlements",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        canAccessPremium: false,
        currentPlanId: null,
        status: "free",
        userId,
      });
    });

    it("creates a pending RevenueCat checkout without granting local access", async () => {
      const response = await inject(token, {
        method: "POST",
        payload: {
          idempotencyKey: "checkout-test-1",
          planId: "WriterHabit_plus_yearly",
          platform: "ios",
        },
        url: "/api/v1/subscriptions/checkout",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        appUserId: userId,
        entitlement: {
          canAccessPremium: false,
          status: "free",
        },
        planId: "WriterHabit_plus_yearly",
        provider: "revenuecat",
        status: "pending_store_purchase",
      });
      expect(database.entitlements).toHaveLength(0);
    });
  });

  it.each([
    { expectedAccess: true, status: "trial" },
    { expectedAccess: true, status: "active" },
    { expectedAccess: false, status: "expired" },
    { expectedAccess: false, status: "refunded" },
  ] satisfies Array<{ expectedAccess: boolean; status: EntitlementStatus }>)(
    "returns %s entitlement state from the trusted server row",
    async ({ expectedAccess, status }) => {
      await createApp({
        entitlements: [
          makeEntitlement({
            canAccessPremium: expectedAccess,
            currentPeriodEndsAt: expectedAccess ? "2026-07-11T08:00:00.000Z" : "2026-05-11T08:00:00.000Z",
            status,
            trialEndsAt: status === "trial" ? "2026-06-18T08:00:00.000Z" : null,
          }),
        ],
      });

      const response = await inject(token, {
        method: "GET",
        url: "/api/v1/me/entitlements",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        canAccessPremium: expectedAccess,
        status,
      });
    },
  );

  it("restores from trusted server state when RevenueCat REST credentials are not configured", async () => {
    await createApp({
      entitlements: [makeEntitlement()],
    });

    const response = await inject(token, {
      method: "POST",
      payload: {
        idempotencyKey: "restore-test-1",
      },
      url: "/api/v1/subscriptions/restore",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      entitlement: {
        canAccessPremium: true,
        status: "active",
      },
      status: "restored",
    });
  });

  it("fails restore closed when no server entitlement exists and RevenueCat REST credentials are missing", async () => {
    await createApp();

    const response = await inject(token, {
      method: "POST",
      payload: {
        idempotencyKey: "restore-test-2",
      },
      url: "/api/v1/subscriptions/restore",
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().error).toMatchObject({
      code: "subscription.provider_unconfigured",
    });
  });

  it("denies RevenueCat webhooks when the Authorization header does not match", async () => {
    await createApp();

    const response = await inject(null, {
      headers: {
        authorization: "wrong-auth",
      },
      method: "POST",
      payload: {
        event: {
          app_user_id: userId,
          entitlement_ids: ["plus"],
          id: "event-denied",
          product_id: "WriterHabit_plus_yearly",
          type: "INITIAL_PURCHASE",
        },
      },
      url: "/api/v1/webhooks/revenuecat",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toMatchObject({
      code: "webhook.invalid_signature",
    });
    expect(database.entitlementProviderEvents).toHaveLength(0);
  });

  it("processes RevenueCat purchase events idempotently", async () => {
    await createApp();

    const payload = {
      event: {
        app_user_id: userId,
        entitlement_ids: ["plus"],
        event_timestamp_ms: 1_781_208_000_000,
        expiration_at_ms: 1_783_800_000_000,
        id: "event-initial-purchase",
        original_transaction_id: "original-transaction-1",
        period_type: "NORMAL",
        product_id: "WriterHabit_plus_yearly",
        type: "INITIAL_PURCHASE",
      },
    };

    const first = await inject(null, {
      headers: {
        authorization: webhookAuthorization,
      },
      method: "POST",
      payload,
      url: "/api/v1/webhooks/revenuecat",
    });
    const second = await inject(null, {
      headers: {
        authorization: webhookAuthorization,
      },
      method: "POST",
      payload,
      url: "/api/v1/webhooks/revenuecat",
    });

    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({
      entitlement: {
        canAccessPremium: true,
        currentPlanId: "WriterHabit_plus_yearly",
        status: "active",
      },
      eventId: "event-initial-purchase",
      status: "processed",
      wasDuplicate: false,
    });
    expect(second.statusCode).toBe(200);
    expect(second.json()).toMatchObject({
      eventId: "event-initial-purchase",
      status: "processed",
      wasDuplicate: true,
    });
    expect(database.entitlementProviderEvents).toHaveLength(1);
    expect(database.entitlements).toHaveLength(1);
  });

  it("maps RevenueCat refund cancellations to refunded without access", async () => {
    await createApp();

    const response = await inject(null, {
      headers: {
        authorization: webhookAuthorization,
      },
      method: "POST",
      payload: {
        event: {
          app_user_id: userId,
          cancel_reason: "CUSTOMER_SUPPORT",
          entitlement_ids: ["plus"],
          expiration_at_ms: 1_783_800_000_000,
          id: "event-refund-cancellation",
          original_transaction_id: "original-transaction-refund",
          product_id: "WriterHabit_plus_monthly",
          type: "CANCELLATION",
        },
      },
      url: "/api/v1/webhooks/revenuecat",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      entitlement: {
        canAccessPremium: false,
        status: "refunded",
      },
      status: "processed",
    });
  });

  it("keeps access during a RevenueCat pause event until expiration", async () => {
    await createApp();

    const response = await inject(null, {
      headers: {
        authorization: webhookAuthorization,
      },
      method: "POST",
      payload: {
        event: {
          app_user_id: userId,
          entitlement_ids: ["plus"],
          expiration_at_ms: 1_783_800_000_000,
          id: "event-subscription-paused",
          original_transaction_id: "original-transaction-paused",
          product_id: "WriterHabit_plus_monthly",
          type: "SUBSCRIPTION_PAUSED",
        },
      },
      url: "/api/v1/webhooks/revenuecat",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      entitlement: {
        canAccessPremium: true,
        status: "canceled",
      },
      status: "processed",
    });
  });

  it("ignores a stale RevenueCat renewal after a newer refund", async () => {
    await createApp();

    const refund = await postRevenueCatEvent({
      app_user_id: userId,
      entitlement_ids: ["plus"],
      event_timestamp_ms: 1_782_000_000_000,
      expiration_at_ms: 1_783_800_000_000,
      id: "event-refund-newer",
      original_transaction_id: "original-order-refund",
      product_id: "WriterHabit_plus_yearly",
      type: "REFUND",
    });
    const staleRenewal = await postRevenueCatEvent({
      app_user_id: userId,
      entitlement_ids: ["plus"],
      event_timestamp_ms: 1_781_000_000_000,
      expiration_at_ms: 1_783_800_000_000,
      id: "event-renewal-older-than-refund",
      original_transaction_id: "original-order-refund",
      period_type: "NORMAL",
      product_id: "WriterHabit_plus_yearly",
      type: "RENEWAL",
    });

    expect(refund.statusCode).toBe(200);
    expect(staleRenewal.statusCode).toBe(200);
    expect(staleRenewal.json()).toMatchObject({
      entitlement: {
        canAccessPremium: false,
        status: "refunded",
      },
      status: "ignored",
      wasDuplicate: false,
    });
    expect(database.entitlements).toHaveLength(1);
    expect(database.entitlements[0]).toMatchObject({
      canAccessPremium: false,
      providerLastEventId: "event-refund-newer",
      providerLastEventTimestampMs: 1_782_000_000_000,
      status: "refunded",
    });
    expect(database.entitlementProviderEvents).toHaveLength(2);
    expect(database.entitlementProviderEvents[1]?.metadata).toMatchObject({
      ignoredReason: "stale_provider_event",
    });
  });

  it("ignores a stale RevenueCat renewal after a newer expiration", async () => {
    await createApp();

    await postRevenueCatEvent({
      app_user_id: userId,
      entitlement_ids: ["plus"],
      event_timestamp_ms: 1_782_000_000_000,
      expiration_at_ms: 1_781_900_000_000,
      id: "event-expiration-newer",
      original_transaction_id: "original-order-expired",
      product_id: "WriterHabit_plus_monthly",
      type: "EXPIRATION",
    });
    const staleRenewal = await postRevenueCatEvent({
      app_user_id: userId,
      entitlement_ids: ["plus"],
      event_timestamp_ms: 1_781_000_000_000,
      expiration_at_ms: 1_783_800_000_000,
      id: "event-renewal-older-than-expiration",
      original_transaction_id: "original-order-expired",
      period_type: "NORMAL",
      product_id: "WriterHabit_plus_monthly",
      type: "RENEWAL",
    });

    expect(staleRenewal.statusCode).toBe(200);
    expect(staleRenewal.json()).toMatchObject({
      entitlement: {
        canAccessPremium: false,
        status: "expired",
      },
      status: "ignored",
    });
    expect(database.entitlements[0]).toMatchObject({
      canAccessPremium: false,
      providerLastEventId: "event-expiration-newer",
      status: "expired",
    });
  });

  it("ignores a stale RevenueCat renewal after a newer past-due event", async () => {
    await createApp();

    await postRevenueCatEvent({
      app_user_id: userId,
      entitlement_ids: ["plus"],
      event_timestamp_ms: 1_782_000_000_000,
      expiration_at_ms: 1_700_000_000_000,
      id: "event-billing-issue-newer",
      original_transaction_id: "original-order-past-due",
      product_id: "WriterHabit_plus_monthly",
      type: "BILLING_ISSUE",
    });
    const staleRenewal = await postRevenueCatEvent({
      app_user_id: userId,
      entitlement_ids: ["plus"],
      event_timestamp_ms: 1_781_000_000_000,
      expiration_at_ms: 1_783_800_000_000,
      id: "event-renewal-older-than-billing-issue",
      original_transaction_id: "original-order-past-due",
      period_type: "NORMAL",
      product_id: "WriterHabit_plus_monthly",
      type: "RENEWAL",
    });

    expect(staleRenewal.statusCode).toBe(200);
    expect(staleRenewal.json()).toMatchObject({
      entitlement: {
        canAccessPremium: false,
        status: "past_due",
      },
      status: "ignored",
    });
    expect(database.entitlements[0]).toMatchObject({
      canAccessPremium: false,
      providerLastEventId: "event-billing-issue-newer",
      status: "past_due",
    });
  });

  it("allows a newer RevenueCat refund reversal to restore premium access", async () => {
    await createApp();

    await postRevenueCatEvent({
      app_user_id: userId,
      entitlement_ids: ["plus"],
      event_timestamp_ms: 1_781_000_000_000,
      expiration_at_ms: 1_783_800_000_000,
      id: "event-refund-before-reversal",
      original_transaction_id: "original-order-reversal",
      product_id: "WriterHabit_plus_yearly",
      type: "REFUND",
    });
    const reversal = await postRevenueCatEvent({
      app_user_id: userId,
      entitlement_ids: ["plus"],
      event_timestamp_ms: 1_782_000_000_000,
      expiration_at_ms: 1_783_800_000_000,
      id: "event-refund-reversed-newer",
      original_transaction_id: "original-order-reversal",
      period_type: "NORMAL",
      product_id: "WriterHabit_plus_yearly",
      type: "REFUND_REVERSED",
    });

    expect(reversal.statusCode).toBe(200);
    expect(reversal.json()).toMatchObject({
      entitlement: {
        canAccessPremium: true,
        status: "active",
      },
      status: "processed",
    });
    expect(database.entitlements[0]).toMatchObject({
      canAccessPremium: true,
      providerLastEventId: "event-refund-reversed-newer",
      providerLastEventTimestampMs: 1_782_000_000_000,
      status: "active",
    });
  });

  it("allows a newer RevenueCat renewal to restore access after a billing issue", async () => {
    await createApp();

    await postRevenueCatEvent({
      app_user_id: userId,
      entitlement_ids: ["plus"],
      event_timestamp_ms: 1_781_000_000_000,
      expiration_at_ms: 1_700_000_000_000,
      id: "event-billing-issue-before-renewal",
      original_transaction_id: "original-order-renewed",
      product_id: "WriterHabit_plus_monthly",
      type: "BILLING_ISSUE",
    });
    const renewal = await postRevenueCatEvent({
      app_user_id: userId,
      entitlement_ids: ["plus"],
      event_timestamp_ms: 1_782_000_000_000,
      expiration_at_ms: 1_783_800_000_000,
      id: "event-renewal-newer-than-billing-issue",
      original_transaction_id: "original-order-renewed",
      period_type: "NORMAL",
      product_id: "WriterHabit_plus_monthly",
      type: "RENEWAL",
    });

    expect(renewal.statusCode).toBe(200);
    expect(renewal.json()).toMatchObject({
      entitlement: {
        canAccessPremium: true,
        status: "active",
      },
      status: "processed",
    });
    expect(database.entitlements[0]).toMatchObject({
      canAccessPremium: true,
      providerLastEventId: "event-renewal-newer-than-billing-issue",
      status: "active",
    });
  });
});
