import { z } from "zod";
import { subscriptionPlanIdSchema, subscriptionStatusSchema, userRoleSchema } from "@WriterHabit/shared";
import type { SubscriptionPlanId, SubscriptionStatus } from "@WriterHabit/shared";

import type { AuthSession, NavigableUserRole } from "@/core/auth/authTypes";
import type { GradeBand } from "@/design/tokens";
import type { TranslationKey } from "@/i18n";

export { subscriptionPlanIdSchema, subscriptionStatusSchema };
export type { SubscriptionPlanId, SubscriptionStatus };

export const subscriptionScenarioSchema = z.enum([
  "success",
  "premium",
  "trial",
  "past_due",
  "empty",
  "error",
  "offline",
]);
export type SubscriptionScenario = z.infer<typeof subscriptionScenarioSchema>;

export const subscriptionConnectionStatusSchema = z.enum(["online", "offline_cached"]);
export type SubscriptionConnectionStatus = z.infer<typeof subscriptionConnectionStatusSchema>;

export const subscriptionFeatureIdSchema = z.enum([
  "safe_ai_coach",
  "daily_practice",
  "extended_progress_history",
  "family_progress_reports",
  "teacher_class_insights",
  "rubric_detail",
  "canvas_archive",
]);
export type SubscriptionFeatureId = z.infer<typeof subscriptionFeatureIdSchema>;

export const premiumFeatureIdSchema = z.enum([
  "extended_progress_history",
  "family_progress_reports",
  "teacher_class_insights",
  "rubric_detail",
  "canvas_archive",
]);
export type PremiumFeatureId = z.infer<typeof premiumFeatureIdSchema>;

export const subscriptionPlanSchema = z.object({
  id: subscriptionPlanIdSchema,
  billingPeriod: z.enum(["month", "year"]),
  isRecommended: z.boolean(),
  priceLabel: z.string().min(1),
  productId: z.string().min(1).optional(),
  trialDays: z.number().int().nonnegative(),
});
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const subscriptionFeatureSchema = z.object({
  id: subscriptionFeatureIdSchema,
  includedIn: z.enum(["free", "plus"]),
  supportedRoles: z.array(userRoleSchema).min(1),
});
export type SubscriptionFeature = z.infer<typeof subscriptionFeatureSchema> & {
  supportedRoles: NavigableUserRole[];
};

export const subscriptionTrustLinksSchema = z.object({
  privacyUrl: z.string().url(),
  termsUrl: z.string().url(),
});
export type SubscriptionTrustLinkUrls = z.infer<typeof subscriptionTrustLinksSchema>;

export const subscriptionApiResponseSchema = z.object({
  canAccessPremium: z.boolean(),
  connectionStatus: subscriptionConnectionStatusSchema,
  currentPlanId: subscriptionPlanIdSchema.nullable(),
  currentPeriodEndsAt: z.string().datetime().nullable().optional(),
  features: z.array(subscriptionFeatureSchema),
  generatedAt: z.string().datetime(),
  managementUrl: z.string().url().nullable(),
  plans: z.array(subscriptionPlanSchema),
  renewalLabel: z.string().min(1).nullable(),
  role: userRoleSchema,
  status: subscriptionStatusSchema,
  trialEndsAt: z.string().datetime().nullable().optional(),
  trustLinks: subscriptionTrustLinksSchema,
  userId: z.string().min(1),
});
export type SubscriptionApiResponse = z.infer<typeof subscriptionApiResponseSchema> & {
  features: SubscriptionFeature[];
  role: NavigableUserRole;
};

export const subscriptionCheckoutResultSchema = z.object({
  appUserId: z.string().min(1).optional(),
  entitlement: subscriptionApiResponseSchema,
  planId: subscriptionPlanIdSchema,
  productId: z.string().min(1).optional(),
  provider: z.enum(["revenuecat"]).optional(),
  status: z.enum(["pending_store_purchase"]),
});
export type SubscriptionCheckoutResult = z.infer<typeof subscriptionCheckoutResultSchema> & {
  entitlement: SubscriptionApiResponse;
};

export const subscriptionRestoreResultSchema = z.object({
  entitlement: subscriptionApiResponseSchema,
  status: z.enum(["restored", "not_found"]),
});
export type SubscriptionRestoreResult = z.infer<typeof subscriptionRestoreResultSchema> & {
  entitlement: SubscriptionApiResponse;
};

export interface SubscriptionApiInput {
  gradeLevel?: number;
  role: NavigableUserRole;
  sessionSource: AuthSession["source"];
  userId: string;
}

export interface SubscriptionCheckoutInput extends SubscriptionApiInput {
  planId: SubscriptionPlanId;
}

export interface SubscriptionRestoreInput extends SubscriptionApiInput {
  idempotencyKey?: string;
}

export interface SubscriptionGradeAdaptation {
  band: GradeBand;
  showDetailedPlanCopy: boolean;
  visibleBenefitCount: number;
}

export interface LocalizedSubscriptionBenefit {
  descriptionKey: TranslationKey;
  feature: SubscriptionFeature;
  titleKey: TranslationKey;
}

export interface LocalizedSubscriptionPlan extends SubscriptionPlan {
  badgeKey?: TranslationKey;
  cadenceKey: TranslationKey;
  descriptionKey: TranslationKey;
  titleKey: TranslationKey;
}

export interface PremiumFeatureCopy {
  descriptionKey: TranslationKey;
  titleKey: TranslationKey;
}

export interface SubscriptionViewModel {
  currentPlan: LocalizedSubscriptionPlan | null;
  entitlement: SubscriptionApiResponse;
  gradeAdaptation: SubscriptionGradeAdaptation;
  isEmpty: boolean;
  isOffline: boolean;
  isPastDue: boolean;
  isPremium: boolean;
  planOptions: LocalizedSubscriptionPlan[];
  recommendedPlan: LocalizedSubscriptionPlan | null;
  visibleBenefits: LocalizedSubscriptionBenefit[];
}

export type EntitlementGateDecision =
  | {
    allowed: true;
  }
  | {
    allowed: false;
    reason: "premium_required" | "payment_issue";
  };
