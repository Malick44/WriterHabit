import { z } from "zod";

import type {
  BillingPeriod,
  EntitlementRecord,
  EntitlementStatus,
  SubscriptionPlanId,
} from "../../data";
import type { AuthPrincipal } from "../../runtime/auth";

export const subscriptionEndpoints = [
  "GET /api/v1/me/entitlements",
  "POST /api/v1/subscriptions/checkout",
  "POST /api/v1/subscriptions/restore",
  "POST /api/v1/webhooks/revenuecat",
  "POST /api/v1/webhooks/stripe",
] as const;

export type SubscriptionEndpoint = (typeof subscriptionEndpoints)[number];

export const implementedSubscriptionEndpoints = new Set<SubscriptionEndpoint>([
  "GET /api/v1/me/entitlements",
  "POST /api/v1/subscriptions/checkout",
  "POST /api/v1/subscriptions/restore",
  "POST /api/v1/webhooks/revenuecat",
]);

export const subscriptionStatusSchema = z.enum([
  "free",
  "trial",
  "active",
  "past_due",
  "canceled",
  "expired",
  "refunded",
  "grace_period",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const subscriptionPlanIdSchema = z.enum([
  "WriterHabit_plus_monthly",
  "WriterHabit_plus_yearly",
]);
export const subscriptionPlanSchema = z.object({
  billingPeriod: z.enum(["month", "year"]),
  id: subscriptionPlanIdSchema,
  isRecommended: z.boolean(),
  priceLabel: z.string().min(1),
  productId: z.string().min(1),
  trialDays: z.number().int().nonnegative(),
});
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const subscriptionCheckoutBodySchema = z.object({
  idempotencyKey: z.string().min(8).max(128),
  platform: z.enum(["android", "ios", "web"]).optional(),
  planId: subscriptionPlanIdSchema,
});

export const subscriptionRestoreBodySchema = z.object({
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export const revenueCatWebhookBodySchema = z
  .object({
    event: z.object({}).passthrough(),
  })
  .passthrough();

export type RevenueCatWebhookBody = z.infer<typeof revenueCatWebhookBodySchema>;

export const subscriptionPlans: readonly SubscriptionPlan[] = [
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

export const subscriptionFeatures = [
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
] as const;
export type SubscriptionFeatureId = (typeof subscriptionFeatures)[number]["id"];

export interface EntitlementsResponse {
  canAccessPremium: boolean;
  connectionStatus: "online";
  currentPeriodEndsAt: string | null;
  currentPlanId: SubscriptionPlanId | null;
  features: typeof subscriptionFeatures;
  generatedAt: string;
  managementUrl: string | null;
  plans: readonly SubscriptionPlan[];
  renewalLabel: string | null;
  role: AuthPrincipal["role"];
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  trustLinks: {
    privacyUrl: string;
    termsUrl: string;
  };
  userId: string;
}

export interface CheckoutResponse {
  appUserId: string;
  entitlement: EntitlementsResponse;
  planId: SubscriptionPlanId;
  productId: string;
  provider: "revenuecat";
  status: "pending_store_purchase";
}

export interface RestoreResponse {
  entitlement: EntitlementsResponse;
  status: "not_found" | "restored";
}

export interface RevenueCatWebhookResponse {
  entitlement: EntitlementsResponse | null;
  eventId: string;
  status: "ignored" | "processed";
  wasDuplicate: boolean;
}

const productIdToPlanId = new Map<string, SubscriptionPlanId>([
  ["WriterHabit_plus_monthly", "WriterHabit_plus_monthly"],
  ["writerhabit_plus_monthly", "WriterHabit_plus_monthly"],
  ["com.writerhabit.plus.monthly", "WriterHabit_plus_monthly"],
  ["WriterHabit_plus_yearly", "WriterHabit_plus_yearly"],
  ["writerhabit_plus_yearly", "WriterHabit_plus_yearly"],
  ["com.writerhabit.plus.yearly", "WriterHabit_plus_yearly"],
]);

export function getPlanById(planId: SubscriptionPlanId): SubscriptionPlan | null {
  return subscriptionPlans.find((plan) => plan.id === planId) ?? null;
}

export function getPlanIdFromProductId(productId: string | null | undefined): SubscriptionPlanId | null {
  if (!productId) {
    return null;
  }

  return productIdToPlanId.get(productId) ?? null;
}

export function getBillingPeriodForPlan(planId: SubscriptionPlanId | null): BillingPeriod | null {
  return planId ? getPlanById(planId)?.billingPeriod ?? null : null;
}

function isFuture(value: string | null): boolean {
  return Boolean(value && Date.parse(value) > Date.now());
}

export function entitlementAllowsPremium(entitlement: Pick<
  EntitlementRecord,
  "canAccessPremium" | "currentPeriodEndsAt" | "status" | "trialEndsAt"
>): boolean {
  if (!entitlement.canAccessPremium) {
    return false;
  }

  if (entitlement.status === "active") {
    return !entitlement.currentPeriodEndsAt || isFuture(entitlement.currentPeriodEndsAt);
  }

  if (entitlement.status === "trial") {
    return isFuture(entitlement.trialEndsAt) || isFuture(entitlement.currentPeriodEndsAt);
  }

  if (entitlement.status === "grace_period" || entitlement.status === "canceled") {
    return isFuture(entitlement.currentPeriodEndsAt);
  }

  return false;
}

export function normalizeEntitlementStatus(status: EntitlementStatus | null | undefined): SubscriptionStatus {
  const parsed = subscriptionStatusSchema.safeParse(status);
  return parsed.success ? parsed.data : "free";
}
