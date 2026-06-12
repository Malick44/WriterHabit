import { Platform } from "react-native";

import { apiClient } from "@/core/api/apiClient";

import {
  subscriptionApiResponseSchema,
  subscriptionCheckoutResultSchema,
  subscriptionPlanIdSchema,
  subscriptionRestoreResultSchema,
  type SubscriptionApiInput,
  type SubscriptionApiResponse,
  type SubscriptionCheckoutInput,
  type SubscriptionCheckoutResult,
  type SubscriptionFeature,
  type SubscriptionPlan,
  type SubscriptionRestoreInput,
  type SubscriptionRestoreResult,
} from "../types";

const generatedAt = "2026-06-09T09:00:00.000Z";
const trustLinks = {
  privacyUrl: "https://WriterHabit.app/privacy",
  termsUrl: "https://WriterHabit.app/terms",
};

const defaultPlans: SubscriptionPlan[] = [
  {
    billingPeriod: "month",
    id: "WriterHabit_plus_monthly",
    isRecommended: false,
    priceLabel: "$9.99",
    productId: "WriterHabit_plus_monthly",
    trialDays: 7,
  },
  {
    billingPeriod: "year",
    id: "WriterHabit_plus_yearly",
    isRecommended: true,
    priceLabel: "$79.99",
    productId: "WriterHabit_plus_yearly",
    trialDays: 7,
  },
];

const defaultFeatures: SubscriptionFeature[] = [
  {
    id: "safe_ai_coach",
    includedIn: "free",
    supportedRoles: ["student", "parent", "teacher", "admin"],
  },
  {
    id: "daily_practice",
    includedIn: "free",
    supportedRoles: ["student", "parent", "teacher", "admin"],
  },
  {
    id: "extended_progress_history",
    includedIn: "plus",
    supportedRoles: ["student", "parent", "admin"],
  },
  {
    id: "family_progress_reports",
    includedIn: "plus",
    supportedRoles: ["parent", "admin"],
  },
  {
    id: "teacher_class_insights",
    includedIn: "plus",
    supportedRoles: ["teacher", "admin"],
  },
  {
    id: "rubric_detail",
    includedIn: "plus",
    supportedRoles: ["student", "parent", "teacher", "admin"],
  },
  {
    id: "canvas_archive",
    includedIn: "plus",
    supportedRoles: ["student", "parent", "teacher", "admin"],
  },
];

function isMockSession(input: SubscriptionApiInput): boolean {
  return input.sessionSource === "mock";
}

function getPlatform(): "android" | "ios" | "web" {
  if (Platform.OS === "android" || Platform.OS === "ios") {
    return Platform.OS;
  }

  return "web";
}

function createClientIdempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createFreeEntitlementResponse(input: SubscriptionApiInput): SubscriptionApiResponse {
  return subscriptionApiResponseSchema.parse({
    canAccessPremium: false,
    connectionStatus: "online",
    currentPeriodEndsAt: null,
    currentPlanId: null,
    features: defaultFeatures,
    generatedAt,
    managementUrl: null,
    plans: defaultPlans,
    renewalLabel: null,
    role: input.role,
    status: "free",
    trialEndsAt: null,
    trustLinks,
    userId: input.userId,
  });
}

export const subscriptionsApi = {
  async getEntitlements(input: SubscriptionApiInput): Promise<SubscriptionApiResponse> {
    if (isMockSession(input)) {
      return createFreeEntitlementResponse(input);
    }

    return apiClient.get<SubscriptionApiResponse>("/me/entitlements", {
      schema: subscriptionApiResponseSchema,
    });
  },

  async startCheckout(input: SubscriptionCheckoutInput): Promise<SubscriptionCheckoutResult> {
    const planId = subscriptionPlanIdSchema.parse(input.planId);

    if (isMockSession(input)) {
      throw new Error("Store checkout requires a verified server session.");
    }

    return apiClient.post<SubscriptionCheckoutResult>(
      "/subscriptions/checkout",
      {
        idempotencyKey: createClientIdempotencyKey("checkout"),
        planId,
        platform: getPlatform(),
      },
      { schema: subscriptionCheckoutResultSchema },
    );
  },

  async restorePurchases(input: SubscriptionRestoreInput): Promise<SubscriptionRestoreResult> {
    if (isMockSession(input)) {
      return subscriptionRestoreResultSchema.parse({
        entitlement: createFreeEntitlementResponse(input),
        status: "not_found",
      });
    }

    return apiClient.post<SubscriptionRestoreResult>(
      "/subscriptions/restore",
      {
        idempotencyKey: input.idempotencyKey ?? createClientIdempotencyKey("restore"),
      },
      { schema: subscriptionRestoreResultSchema },
    );
  },
};
