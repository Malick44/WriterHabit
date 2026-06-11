import { z } from "zod";

import type { AuthSession, NavigableUserRole } from "@/core/auth/authTypes";
import type { GradeBand } from "@/design/tokens";
import type { TranslationKey } from "@/i18n";

export const subscriptionStatusSchema = z.enum(["free", "trial", "active", "past_due"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

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

export const subscriptionPlanIdSchema = z.enum(["WriterHabit_plus_monthly", "WriterHabit_plus_yearly"]);
export type SubscriptionPlanId = z.infer<typeof subscriptionPlanIdSchema>;

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
  trialDays: z.number().int().nonnegative(),
});
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const subscriptionFeatureSchema = z.object({
  id: subscriptionFeatureIdSchema,
  includedIn: z.enum(["free", "plus"]),
  supportedRoles: z.array(z.enum(["student", "parent", "teacher", "admin"])).min(1),
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
  features: z.array(subscriptionFeatureSchema),
  generatedAt: z.string().datetime(),
  managementUrl: z.string().url().nullable(),
  plans: z.array(subscriptionPlanSchema),
  renewalLabel: z.string().min(1).nullable(),
  role: z.enum(["student", "parent", "teacher", "admin"]),
  status: subscriptionStatusSchema,
  trustLinks: subscriptionTrustLinksSchema,
  userId: z.string().min(1),
});
export type SubscriptionApiResponse = z.infer<typeof subscriptionApiResponseSchema> & {
  features: SubscriptionFeature[];
  role: NavigableUserRole;
};

export const subscriptionCheckoutResultSchema = z.object({
  entitlement: subscriptionApiResponseSchema,
  planId: subscriptionPlanIdSchema,
  status: z.enum(["activated_preview"]),
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
  sessionSubscriptionStatus: AuthSession["subscriptionStatus"];
  userId: string;
}

export interface SubscriptionCheckoutInput extends SubscriptionApiInput {
  planId: SubscriptionPlanId;
}

export interface SubscriptionRestoreInput extends SubscriptionApiInput {
  expectedStatus?: AuthSession["subscriptionStatus"];
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
