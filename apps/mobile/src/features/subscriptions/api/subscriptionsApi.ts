import type { AuthSession } from "@/core/auth/authTypes";

import {
  subscriptionApiResponseSchema,
  subscriptionCheckoutResultSchema,
  subscriptionPlanIdSchema,
  subscriptionRestoreResultSchema,
  subscriptionScenarioSchema,
  type SubscriptionApiInput,
  type SubscriptionApiResponse,
  type SubscriptionCheckoutInput,
  type SubscriptionCheckoutResult,
  type SubscriptionFeature,
  type SubscriptionPlan,
  type SubscriptionRestoreInput,
  type SubscriptionRestoreResult,
  type SubscriptionScenario,
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
    trialDays: 7,
  },
  {
    billingPeriod: "year",
    id: "WriterHabit_plus_yearly",
    isRecommended: true,
    priceLabel: "$79.99",
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

function readScenario(): SubscriptionScenario {
  const parsed = subscriptionScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WriterHabit_SUBSCRIPTION_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

function getStatus(
  scenario: SubscriptionScenario,
  fallbackStatus: AuthSession["subscriptionStatus"],
): AuthSession["subscriptionStatus"] {
  switch (scenario) {
    case "premium":
      return "active";
    case "trial":
      return "trial";
    case "past_due":
      return "past_due";
    case "empty":
    case "error":
    case "offline":
    case "success":
      return fallbackStatus;
  }
}

function createEntitlementResponse(
  input: SubscriptionApiInput,
  scenario: SubscriptionScenario,
  overrideStatus?: AuthSession["subscriptionStatus"],
  overridePlanId?: SubscriptionPlan["id"] | null,
): SubscriptionApiResponse {
  const status = overrideStatus ?? getStatus(scenario, input.sessionSubscriptionStatus);
  const isPremium = status === "active" || status === "trial";
  const isEmpty = scenario === "empty";
  const planId = overridePlanId ?? (isPremium ? "WriterHabit_plus_yearly" : null);

  const response: SubscriptionApiResponse = {
    canAccessPremium: isPremium,
    connectionStatus: scenario === "offline" ? "offline_cached" : "online",
    currentPlanId: planId,
    features: isEmpty ? [] : defaultFeatures,
    generatedAt,
    managementUrl: null,
    plans: isEmpty ? [] : defaultPlans,
    renewalLabel:
      status === "active"
        ? "Renews Jul 9, 2026"
        : status === "trial"
          ? "Trial ends Jun 16, 2026"
          : status === "past_due"
            ? "Payment needs attention"
            : null,
    role: input.role,
    status,
    trustLinks,
    userId: input.userId,
  };

  return subscriptionApiResponseSchema.parse(response);
}

export const subscriptionsApi = {
  async getEntitlements(input: SubscriptionApiInput): Promise<SubscriptionApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Subscription entitlement mock error");
    }

    return createEntitlementResponse(input, scenario);
  },

  async startCheckout(input: SubscriptionCheckoutInput): Promise<SubscriptionCheckoutResult> {
    const scenario = readScenario();
    const planId = subscriptionPlanIdSchema.parse(input.planId);

    if (scenario === "error") {
      throw new Error("Subscription checkout mock error");
    }

    const response: SubscriptionCheckoutResult = {
      entitlement: createEntitlementResponse(input, scenario, "trial", planId),
      planId,
      status: "activated_preview",
    };

    return subscriptionCheckoutResultSchema.parse(response);
  },

  async restorePurchases(input: SubscriptionRestoreInput): Promise<SubscriptionRestoreResult> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Subscription restore mock error");
    }

    const restoredStatus = input.expectedStatus ?? getStatus(scenario, input.sessionSubscriptionStatus);
    const hasRestorablePurchase = restoredStatus === "active" || restoredStatus === "trial";
    const response: SubscriptionRestoreResult = {
      entitlement: createEntitlementResponse(
        input,
        scenario,
        hasRestorablePurchase ? restoredStatus : input.sessionSubscriptionStatus,
      ),
      status: hasRestorablePurchase ? "restored" : "not_found",
    };

    return subscriptionRestoreResultSchema.parse(response);
  },
};
