import { typography, type GradeBand } from "@/design/tokens";

import type {
  EntitlementGateDecision,
  LocalizedSubscriptionBenefit,
  LocalizedSubscriptionPlan,
  PremiumFeatureCopy,
  PremiumFeatureId,
  SubscriptionApiResponse,
  SubscriptionFeatureId,
  SubscriptionGradeAdaptation,
  SubscriptionPlan,
  SubscriptionViewModel,
} from "../types";

const planCopy = {
  WriterHabit_plus_monthly: {
    cadenceKey: "subscriptions.plans.monthly.cadence",
    descriptionKey: "subscriptions.plans.monthly.description",
    titleKey: "subscriptions.plans.monthly.title",
  },
  WriterHabit_plus_yearly: {
    badgeKey: "subscriptions.plans.yearly.badge",
    cadenceKey: "subscriptions.plans.yearly.cadence",
    descriptionKey: "subscriptions.plans.yearly.description",
    titleKey: "subscriptions.plans.yearly.title",
  },
} satisfies Record<SubscriptionPlan["id"], Omit<LocalizedSubscriptionPlan, keyof SubscriptionPlan>>;

const benefitCopy = {
  safe_ai_coach: {
    descriptionKey: "subscriptions.benefits.safeAiCoach.description",
    titleKey: "subscriptions.benefits.safeAiCoach.title",
  },
  daily_practice: {
    descriptionKey: "subscriptions.benefits.dailyPractice.description",
    titleKey: "subscriptions.benefits.dailyPractice.title",
  },
  extended_progress_history: {
    descriptionKey: "subscriptions.benefits.extendedProgress.description",
    titleKey: "subscriptions.benefits.extendedProgress.title",
  },
  family_progress_reports: {
    descriptionKey: "subscriptions.benefits.familyReports.description",
    titleKey: "subscriptions.benefits.familyReports.title",
  },
  teacher_class_insights: {
    descriptionKey: "subscriptions.benefits.teacherInsights.description",
    titleKey: "subscriptions.benefits.teacherInsights.title",
  },
  rubric_detail: {
    descriptionKey: "subscriptions.benefits.rubricDetail.description",
    titleKey: "subscriptions.benefits.rubricDetail.title",
  },
  canvas_archive: {
    descriptionKey: "subscriptions.benefits.canvasArchive.description",
    titleKey: "subscriptions.benefits.canvasArchive.title",
  },
} satisfies Record<SubscriptionFeatureId, Pick<LocalizedSubscriptionBenefit, "descriptionKey" | "titleKey">>;

const premiumFeatureCopy = {
  canvas_archive: {
    descriptionKey: "subscriptions.upgrade.features.canvasArchive.description",
    titleKey: "subscriptions.upgrade.features.canvasArchive.title",
  },
  extended_progress_history: {
    descriptionKey: "subscriptions.upgrade.features.extendedProgress.description",
    titleKey: "subscriptions.upgrade.features.extendedProgress.title",
  },
  family_progress_reports: {
    descriptionKey: "subscriptions.upgrade.features.familyReports.description",
    titleKey: "subscriptions.upgrade.features.familyReports.title",
  },
  rubric_detail: {
    descriptionKey: "subscriptions.upgrade.features.rubricDetail.description",
    titleKey: "subscriptions.upgrade.features.rubricDetail.title",
  },
  teacher_class_insights: {
    descriptionKey: "subscriptions.upgrade.features.teacherInsights.description",
    titleKey: "subscriptions.upgrade.features.teacherInsights.title",
  },
} satisfies Record<PremiumFeatureId, PremiumFeatureCopy>;

export function hasPremiumEntitlement(entitlement: Pick<SubscriptionApiResponse, "status" | "canAccessPremium">): boolean {
  return entitlement.canAccessPremium && (entitlement.status === "active" || entitlement.status === "trial");
}

export function getSubscriptionGradeAdaptation(gradeLevel?: number): SubscriptionGradeAdaptation {
  const band = gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";

  switch (band) {
    case "elementary":
      return {
        band,
        showDetailedPlanCopy: false,
        visibleBenefitCount: 3,
      };
    case "high":
      return {
        band,
        showDetailedPlanCopy: true,
        visibleBenefitCount: 5,
      };
    case "middle":
      return {
        band,
        showDetailedPlanCopy: true,
        visibleBenefitCount: 4,
      };
  }
}

function localizePlan(plan: SubscriptionPlan): LocalizedSubscriptionPlan {
  return {
    ...plan,
    ...planCopy[plan.id],
  };
}

function getBenefitPriority(id: SubscriptionFeatureId, gradeBand: GradeBand): number {
  const elementaryPriority: SubscriptionFeatureId[] = [
    "safe_ai_coach",
    "daily_practice",
    "canvas_archive",
    "extended_progress_history",
    "rubric_detail",
    "family_progress_reports",
    "teacher_class_insights",
  ];
  const middlePriority: SubscriptionFeatureId[] = [
    "safe_ai_coach",
    "daily_practice",
    "extended_progress_history",
    "rubric_detail",
    "canvas_archive",
    "family_progress_reports",
    "teacher_class_insights",
  ];
  const highPriority: SubscriptionFeatureId[] = [
    "rubric_detail",
    "extended_progress_history",
    "safe_ai_coach",
    "canvas_archive",
    "daily_practice",
    "family_progress_reports",
    "teacher_class_insights",
  ];
  const priority = gradeBand === "elementary" ? elementaryPriority : gradeBand === "high" ? highPriority : middlePriority;

  return priority.indexOf(id);
}

function localizeBenefits(
  entitlement: SubscriptionApiResponse,
  adaptation: SubscriptionGradeAdaptation,
): LocalizedSubscriptionBenefit[] {
  return entitlement.features
    .filter((feature) => feature.includedIn === "plus" || feature.id === "safe_ai_coach" || feature.id === "daily_practice")
    .filter((feature) => feature.supportedRoles.includes(entitlement.role))
    .sort((left, right) => getBenefitPriority(left.id, adaptation.band) - getBenefitPriority(right.id, adaptation.band))
    .slice(0, adaptation.visibleBenefitCount)
    .map((feature) => ({
      ...benefitCopy[feature.id],
      feature,
    }));
}

export function getPremiumFeatureCopy(featureId: PremiumFeatureId): PremiumFeatureCopy {
  return premiumFeatureCopy[featureId];
}

export function evaluateEntitlementGate(
  entitlement: SubscriptionApiResponse,
  featureId: PremiumFeatureId,
): EntitlementGateDecision {
  const feature = entitlement.features.find((candidate) => candidate.id === featureId);
  const roleCanUseFeature = feature ? feature.supportedRoles.includes(entitlement.role) : true;

  if (!roleCanUseFeature) {
    return { allowed: true };
  }

  if (hasPremiumEntitlement(entitlement)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: entitlement.status === "past_due" ? "payment_issue" : "premium_required",
  };
}

export function buildSubscriptionViewModel(
  entitlement: SubscriptionApiResponse,
  options: { gradeLevel?: number } = {},
): SubscriptionViewModel {
  const gradeAdaptation = getSubscriptionGradeAdaptation(options.gradeLevel);
  const planOptions = entitlement.plans.map(localizePlan);

  return {
    currentPlan: planOptions.find((plan) => plan.id === entitlement.currentPlanId) ?? null,
    entitlement,
    gradeAdaptation,
    isEmpty: entitlement.plans.length === 0 || entitlement.features.length === 0,
    isOffline: entitlement.connectionStatus === "offline_cached",
    isPastDue: entitlement.status === "past_due",
    isPremium: hasPremiumEntitlement(entitlement),
    planOptions,
    recommendedPlan: planOptions.find((plan) => plan.isRecommended) ?? planOptions[0] ?? null,
    visibleBenefits: localizeBenefits(entitlement, gradeAdaptation),
  };
}
