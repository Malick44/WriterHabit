import { timingSafeEqual } from "node:crypto";

import type {
  Database,
  EntitlementRecord,
  EntitlementStatus,
  SubscriptionPlanId,
  UpsertEntitlementInput,
} from "../../data";
import type { AuthPrincipal } from "../../runtime/auth";
import type { ApiConfig } from "../../runtime/config";
import { ApiHttpError } from "../../runtime/errors";
import {
  entitlementAllowsPremium,
  getBillingPeriodForPlan,
  getPlanById,
  getPlanIdFromProductId,
  normalizeEntitlementStatus,
  subscriptionFeatures,
  subscriptionPlans,
  type CheckoutResponse,
  type EntitlementsResponse,
  type RestoreResponse,
  type RevenueCatWebhookBody,
  type RevenueCatWebhookResponse,
} from "./subscriptions.contracts";

type RevenueCatEventDecision =
  | {
      entitlement: UpsertEntitlementInput;
      eventType: string;
      metadata: Record<string, unknown>;
      ownerUserId: string;
      processingStatus: "processed";
      providerEventId: string;
    }
  | {
      eventType: string;
      metadata: Record<string, unknown>;
      ownerUserId: string | null;
      processingStatus: "ignored";
      providerEventId: string;
      reason: string;
    };

interface RevenueCatSubscriberResponse {
  subscriber?: {
    entitlements?: Record<string, unknown>;
    original_app_user_id?: string;
    subscriptions?: Record<string, unknown>;
  };
}

const trustLinks = {
  privacyUrl: "https://WriterHabit.app/privacy",
  termsUrl: "https://WriterHabit.app/terms",
};

const activeEventTypes = new Set([
  "INITIAL_PURCHASE",
  "NON_RENEWING_PURCHASE",
  "PRODUCT_CHANGE",
  "REFUND_REVERSED",
  "RENEWAL",
  "SUBSCRIPTION_EXTENDED",
  "TEMPORARY_ENTITLEMENT_GRANT",
  "UNCANCELLATION",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }

  return null;
}

function getStringArray(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function msToIso(value: number | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function dateStringToIso(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isFuture(value: string | null): boolean {
  return Boolean(value && Date.parse(value) > Date.now());
}

function isRefundEvent(eventType: string, event: Record<string, unknown>): boolean {
  const cancelReason = getString(event, "cancel_reason")?.toUpperCase() ?? "";
  const expirationReason = getString(event, "expiration_reason")?.toUpperCase() ?? "";

  return (
    eventType === "REFUND" ||
    cancelReason === "REFUND" ||
    cancelReason === "CUSTOMER_SUPPORT" ||
    expirationReason === "CUSTOMER_SUPPORT" ||
    event.is_refund === true
  );
}

function getRevenueCatEventTimestampMs(event: Record<string, unknown>): number | null {
  return getNumber(event, "event_timestamp_ms") ?? getNumber(event, "purchased_at_ms");
}

function getProviderEventId(event: Record<string, unknown>, eventType: string): string {
  const explicitId = getString(event, "id") ?? getString(event, "event_id");

  if (explicitId) {
    return explicitId;
  }

  return [
    eventType,
    getString(event, "transaction_id") ?? "no-transaction",
    getString(event, "app_user_id") ?? getString(event, "original_app_user_id") ?? "no-user",
    String(getRevenueCatEventTimestampMs(event) ?? 0),
  ].join(":");
}

function getProviderSubscriptionId(input: {
  event: Record<string, unknown>;
  ownerUserId: string;
  planId: SubscriptionPlanId | null;
  productId: string | null;
}): string {
  return (
    getString(input.event, "original_transaction_id") ??
    getString(input.event, "transaction_id") ??
    `${input.ownerUserId}:${input.planId ?? input.productId ?? "unknown"}`
  );
}

function buildMetadata(input: {
  event: Record<string, unknown>;
  eventType: string;
  ignoredReason?: string;
  planId?: SubscriptionPlanId | null;
}): Record<string, unknown> {
  return {
    appUserId: getString(input.event, "app_user_id"),
    cancelReason: getString(input.event, "cancel_reason"),
    entitlementIds: getStringArray(input.event, "entitlement_ids"),
    environment: getString(input.event, "environment"),
    eventTimestampMs: getRevenueCatEventTimestampMs(input.event),
    eventType: input.eventType,
    ignoredReason: input.ignoredReason,
    periodType: getString(input.event, "period_type"),
    planId: input.planId ?? null,
    productId: getString(input.event, "product_id"),
    store: getString(input.event, "store"),
  };
}

function statusForRevenueCatEvent(input: {
  currentPeriodEndsAt: string | null;
  event: Record<string, unknown>;
  eventType: string;
  gracePeriodEndsAt: string | null;
}): {
  canAccessPremium: boolean;
  status: EntitlementStatus;
} {
  const periodType = getString(input.event, "period_type")?.toUpperCase();

  if (isRefundEvent(input.eventType, input.event)) {
    return { canAccessPremium: false, status: "refunded" };
  }

  if (input.eventType === "EXPIRATION") {
    return { canAccessPremium: false, status: "expired" };
  }

  if (input.eventType === "SUBSCRIPTION_PAUSED") {
    return {
      canAccessPremium: isFuture(input.currentPeriodEndsAt),
      status: "canceled",
    };
  }

  if (input.eventType === "BILLING_ISSUE") {
    const hasGraceAccess = isFuture(input.gracePeriodEndsAt) || isFuture(input.currentPeriodEndsAt);
    return {
      canAccessPremium: hasGraceAccess,
      status: hasGraceAccess ? "grace_period" : "past_due",
    };
  }

  if (input.eventType === "CANCELLATION") {
    const cancelReason = getString(input.event, "cancel_reason")?.toUpperCase();

    if (cancelReason === "BILLING_ERROR") {
      const hasGraceAccess = isFuture(input.gracePeriodEndsAt) || isFuture(input.currentPeriodEndsAt);
      return {
        canAccessPremium: hasGraceAccess,
        status: hasGraceAccess ? "grace_period" : "past_due",
      };
    }

    return {
      canAccessPremium: isFuture(input.currentPeriodEndsAt),
      status: "canceled",
    };
  }

  if (activeEventTypes.has(input.eventType)) {
    const status = periodType === "TRIAL" ? "trial" : "active";
    const canAccessPremium =
      status === "active"
        ? !input.currentPeriodEndsAt || isFuture(input.currentPeriodEndsAt)
        : isFuture(input.currentPeriodEndsAt);

    return {
      canAccessPremium,
      status: canAccessPremium ? status : "expired",
    };
  }

  return { canAccessPremium: false, status: "free" };
}

function normalizeRevenueCatWebhook(
  body: RevenueCatWebhookBody,
  entitlementId: string,
): RevenueCatEventDecision {
  const event = body.event;
  const eventType = getString(event, "type")?.toUpperCase() ?? "UNKNOWN";
  const providerEventId = getProviderEventId(event, eventType);
  const ownerUserId = getString(event, "app_user_id") ?? getString(event, "original_app_user_id");
  const productId = getString(event, "product_id");
  const planId = getPlanIdFromProductId(productId);
  const entitlementIds = getStringArray(event, "entitlement_ids");
  const isPlusEvent = entitlementIds.includes(entitlementId) || Boolean(planId);

  if (eventType === "TEST") {
    return {
      eventType,
      metadata: buildMetadata({ event, eventType, ignoredReason: "test_event", planId }),
      ownerUserId,
      processingStatus: "ignored",
      providerEventId,
      reason: "test_event",
    };
  }

  if (!ownerUserId) {
    return {
      eventType,
      metadata: buildMetadata({ event, eventType, ignoredReason: "missing_app_user_id", planId }),
      ownerUserId: null,
      processingStatus: "ignored",
      providerEventId,
      reason: "missing_app_user_id",
    };
  }

  if (!isPlusEvent || !planId) {
    return {
      eventType,
      metadata: buildMetadata({ event, eventType, ignoredReason: "non_plus_entitlement", planId }),
      ownerUserId,
      processingStatus: "ignored",
      providerEventId,
      reason: "non_plus_entitlement",
    };
  }

  const currentPeriodEndsAt = msToIso(getNumber(event, "expiration_at_ms"));
  const gracePeriodEndsAt = msToIso(getNumber(event, "grace_period_expiration_at_ms"));
  const providerLastEventTimestampMs = getRevenueCatEventTimestampMs(event);
  const trialEndsAt = getString(event, "period_type")?.toUpperCase() === "TRIAL" ? currentPeriodEndsAt : null;
  const state = statusForRevenueCatEvent({
    currentPeriodEndsAt,
    event,
    eventType,
    gracePeriodEndsAt,
  });

  if (state.status === "free") {
    return {
      eventType,
      metadata: buildMetadata({ event, eventType, ignoredReason: "unsupported_event_type", planId }),
      ownerUserId,
      processingStatus: "ignored",
      providerEventId,
      reason: "unsupported_event_type",
    };
  }

  return {
    entitlement: {
      billingPeriod: getBillingPeriodForPlan(planId),
      canAccessPremium: state.canAccessPremium,
      currentPeriodEndsAt,
      currentPlanId: planId,
      managementUrl: null,
      ownerUserId,
      provider: "revenuecat",
      providerCustomerId: ownerUserId,
      providerLastEventId: providerEventId,
      providerLastEventTimestampMs,
      providerLastEventType: eventType,
      providerSubscriptionId: getProviderSubscriptionId({ event, ownerUserId, planId, productId }),
      scopeId: null,
      scopeType: "personal",
      status: state.status,
      trialEndsAt,
    },
    eventType,
    metadata: buildMetadata({ event, eventType, planId }),
    ownerUserId,
    processingStatus: "processed",
    providerEventId,
  };
}

function normalizeRevenueCatSubscriber(
  appUserId: string,
  body: RevenueCatSubscriberResponse,
  entitlementId: string,
): UpsertEntitlementInput | null {
  const subscriber = body.subscriber;
  const entitlement = isRecord(subscriber?.entitlements)
    ? subscriber.entitlements[entitlementId]
    : undefined;

  if (!isRecord(entitlement)) {
    return null;
  }

  const productId = getString(entitlement, "product_identifier");
  const planId = getPlanIdFromProductId(productId);

  if (!planId) {
    return null;
  }

  const currentPeriodEndsAt = dateStringToIso(entitlement.expires_date);
  const gracePeriodEndsAt = dateStringToIso(entitlement.grace_period_expires_date);
  const trialEndsAt =
    getString(entitlement, "period_type")?.toUpperCase() === "TRIAL" ? currentPeriodEndsAt : null;
  const hasAccess = !currentPeriodEndsAt || isFuture(currentPeriodEndsAt) || isFuture(gracePeriodEndsAt);
  const billingIssue = Boolean(entitlement.billing_issues_detected_at);
  let status: EntitlementStatus = hasAccess ? "active" : "expired";

  if (billingIssue) {
    status = isFuture(gracePeriodEndsAt) || isFuture(currentPeriodEndsAt) ? "grace_period" : "past_due";
  } else if (hasAccess && trialEndsAt) {
    status = "trial";
  } else if (hasAccess && entitlement.unsubscribe_detected_at) {
    status = "canceled";
  }

  const subscriptions = isRecord(subscriber?.subscriptions) ? subscriber.subscriptions : {};
  const subscription = productId && isRecord(subscriptions[productId]) ? subscriptions[productId] : {};

  return {
    billingPeriod: getBillingPeriodForPlan(planId),
    canAccessPremium: hasAccess && status !== "past_due",
    currentPeriodEndsAt,
    currentPlanId: planId,
    managementUrl: null,
    ownerUserId: appUserId,
    provider: "revenuecat",
    providerCustomerId: subscriber?.original_app_user_id ?? appUserId,
    providerSubscriptionId:
      getString(subscription, "original_transaction_id") ??
      getString(subscription, "transaction_id") ??
      `${appUserId}:${planId}`,
    scopeId: null,
    scopeType: "personal",
    status,
    trialEndsAt,
  };
}

function timingSafeMatches(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export class SubscriptionsService {
  private readonly database: Database;
  private readonly revenueCat: ApiConfig["payments"]["revenueCat"];

  constructor(input: { database: Database; payments: ApiConfig["payments"] }) {
    this.database = input.database;
    this.revenueCat = input.payments.revenueCat;
  }

  async getEntitlements(principal: AuthPrincipal): Promise<EntitlementsResponse> {
    return this.buildEntitlementsResponse(principal, await this.database.getLatestEntitlementForUser(principal.id));
  }

  async startCheckout(input: {
    principal: AuthPrincipal;
    planId: SubscriptionPlanId;
  }): Promise<CheckoutResponse> {
    const plan = getPlanById(input.planId);

    if (!plan) {
      throw new ApiHttpError({
        code: "subscription.plan_not_found",
      });
    }

    return {
      appUserId: input.principal.id,
      entitlement: await this.getEntitlements(input.principal),
      planId: plan.id,
      productId: plan.productId,
      provider: "revenuecat",
      status: "pending_store_purchase",
    };
  }

  async restorePurchases(principal: AuthPrincipal): Promise<RestoreResponse> {
    const existing = await this.database.getLatestEntitlementForUser(principal.id);

    if (!this.revenueCat.secretApiKey) {
      if (existing && entitlementAllowsPremium(existing)) {
        return {
          entitlement: this.buildEntitlementsResponse(principal, existing),
          status: "restored",
        };
      }

      throw new ApiHttpError({
        code: "subscription.provider_unconfigured",
        details: {
          ownerAction: "Set REVENUECAT_SECRET_API_KEY on the API service before production restore is enabled.",
          provider: "revenuecat",
        },
      });
    }

    const subscriber = await this.fetchRevenueCatSubscriber(principal.id);
    const nextEntitlement = normalizeRevenueCatSubscriber(
      principal.id,
      subscriber,
      this.revenueCat.entitlementId,
    );

    if (nextEntitlement) {
      const saved = await this.database.upsertEntitlement(nextEntitlement);
      return {
        entitlement: this.buildEntitlementsResponse(principal, saved),
        status: entitlementAllowsPremium(saved) ? "restored" : "not_found",
      };
    }

    if (existing?.provider === "revenuecat") {
      const revoked = await this.database.upsertEntitlement({
        billingPeriod: existing.billingPeriod,
        canAccessPremium: false,
        currentPeriodEndsAt: existing.currentPeriodEndsAt,
        currentPlanId: existing.currentPlanId,
        managementUrl: existing.managementUrl,
        ownerUserId: existing.ownerUserId,
        provider: existing.provider,
        providerCustomerId: existing.providerCustomerId,
        providerSubscriptionId: existing.providerSubscriptionId,
        scopeId: existing.scopeId,
        scopeType: existing.scopeType,
        status: "expired",
        trialEndsAt: existing.trialEndsAt,
      });

      return {
        entitlement: this.buildEntitlementsResponse(principal, revoked),
        status: "not_found",
      };
    }

    return {
      entitlement: await this.getEntitlements(principal),
      status: "not_found",
    };
  }

  async handleRevenueCatWebhook(input: {
    authorizationHeader?: string;
    body: RevenueCatWebhookBody;
    principalForResponse?: AuthPrincipal;
  }): Promise<RevenueCatWebhookResponse> {
    this.verifyRevenueCatWebhookAuthorization(input.authorizationHeader);

    const decision = normalizeRevenueCatWebhook(input.body, this.revenueCat.entitlementId);
    const result = await this.database.applyEntitlementProviderEvent({
      entitlement: "entitlement" in decision ? decision.entitlement : undefined,
      eventType: decision.eventType,
      metadata: decision.metadata,
      ownerUserId: decision.ownerUserId,
      processingStatus: decision.processingStatus,
      provider: "revenuecat",
      providerEventId: decision.providerEventId,
    });
    const responsePrincipal =
      input.principalForResponse ??
      (decision.ownerUserId
        ? {
            displayName: "",
            email: "",
            id: decision.ownerUserId,
            onboardingCompleted: true,
            role: "student" as const,
          }
        : null);

    return {
      entitlement:
        responsePrincipal && result.entitlement
          ? this.buildEntitlementsResponse(responsePrincipal, result.entitlement)
          : null,
      eventId: decision.providerEventId,
      status: result.event.processingStatus === "ignored" ? "ignored" : "processed",
      wasDuplicate: result.wasDuplicate,
    };
  }

  private buildEntitlementsResponse(
    principal: Pick<AuthPrincipal, "id" | "role">,
    entitlement: EntitlementRecord | null,
  ): EntitlementsResponse {
    const status = normalizeEntitlementStatus(entitlement?.status);
    const canAccessPremium = entitlement ? entitlementAllowsPremium(entitlement) : false;

    return {
      canAccessPremium,
      connectionStatus: "online",
      currentPeriodEndsAt: entitlement?.currentPeriodEndsAt ?? null,
      currentPlanId: entitlement?.currentPlanId ?? null,
      features: subscriptionFeatures,
      generatedAt: new Date().toISOString(),
      managementUrl: entitlement?.managementUrl ?? null,
      plans: subscriptionPlans,
      renewalLabel: null,
      role: principal.role,
      status: entitlement ? status : "free",
      trialEndsAt: entitlement?.trialEndsAt ?? null,
      trustLinks,
      userId: principal.id,
    };
  }

  private async fetchRevenueCatSubscriber(appUserId: string): Promise<RevenueCatSubscriberResponse> {
    const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.revenueCat.secretApiKey}`,
      },
      method: "GET",
    });

    if (response.status === 404) {
      return {};
    }

    if (!response.ok) {
      throw new ApiHttpError({
        code: "subscription.provider_unconfigured",
        details: {
          provider: "revenuecat",
          providerStatus: response.status,
        },
        fallbackMessage: "Purchase restore could not verify the store account. Your plan was not changed.",
        retryable: response.status >= 500,
        statusCode: response.status >= 500 ? 503 : 502,
      });
    }

    const payload = (await response.json()) as unknown;
    return isRecord(payload) ? (payload as RevenueCatSubscriberResponse) : {};
  }

  private verifyRevenueCatWebhookAuthorization(authorizationHeader: string | undefined): void {
    const expected = this.revenueCat.webhookAuthorization;

    if (!expected) {
      throw new ApiHttpError({
        code: "subscription.provider_unconfigured",
        details: {
          ownerAction:
            "Set REVENUECAT_WEBHOOK_AUTHORIZATION on the API service and configure the same Authorization value in RevenueCat.",
          provider: "revenuecat",
        },
      });
    }

    if (!authorizationHeader || !timingSafeMatches(authorizationHeader, expected)) {
      throw new ApiHttpError({
        code: "webhook.invalid_signature",
      });
    }
  }
}

export const __subscriptionsTestInternals = {
  normalizeRevenueCatSubscriber,
  normalizeRevenueCatWebhook,
};
