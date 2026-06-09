import {
  buildSubscriptionViewModel,
  evaluateEntitlementGate,
  getSubscriptionGradeAdaptation,
  hasPremiumEntitlement,
} from "./entitlementService";
import type { SubscriptionApiResponse } from "../types";

function createEntitlement(overrides: Partial<SubscriptionApiResponse> = {}): SubscriptionApiResponse {
  return {
    canAccessPremium: false,
    connectionStatus: "online",
    currentPlanId: null,
    features: [
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
        id: "rubric_detail",
        includedIn: "plus",
        supportedRoles: ["student", "parent", "teacher", "admin"],
      },
      {
        id: "canvas_archive",
        includedIn: "plus",
        supportedRoles: ["student", "parent", "teacher", "admin"],
      },
    ],
    generatedAt: "2026-06-09T09:00:00.000Z",
    managementUrl: null,
    plans: [
      {
        billingPeriod: "month",
        id: "writewise_plus_monthly",
        isRecommended: false,
        priceLabel: "$9.99",
        trialDays: 7,
      },
      {
        billingPeriod: "year",
        id: "writewise_plus_yearly",
        isRecommended: true,
        priceLabel: "$79.99",
        trialDays: 7,
      },
    ],
    renewalLabel: null,
    role: "student",
    status: "free",
    trustLinks: {
      privacyUrl: "https://writewise.app/privacy",
      termsUrl: "https://writewise.app/terms",
    },
    userId: "student-1",
    ...overrides,
  };
}

describe("entitlementService", () => {
  it("adapts subscription benefit density by grade band", () => {
    expect(getSubscriptionGradeAdaptation(4)).toMatchObject({
      band: "elementary",
      showDetailedPlanCopy: false,
      visibleBenefitCount: 3,
    });

    expect(getSubscriptionGradeAdaptation(10)).toMatchObject({
      band: "high",
      showDetailedPlanCopy: true,
      visibleBenefitCount: 5,
    });
  });

  it("builds a localized subscription view model with a recommended plan", () => {
    const viewModel = buildSubscriptionViewModel(createEntitlement(), { gradeLevel: 4 });

    expect(viewModel.isPremium).toBe(false);
    expect(viewModel.recommendedPlan?.id).toBe("writewise_plus_yearly");
    expect(viewModel.visibleBenefits).toHaveLength(3);
    expect(viewModel.visibleBenefits[0]?.feature.id).toBe("safe_ai_coach");
  });

  it("detects premium entitlement from active and trial states", () => {
    expect(hasPremiumEntitlement(createEntitlement({ canAccessPremium: true, status: "active" }))).toBe(true);
    expect(hasPremiumEntitlement(createEntitlement({ canAccessPremium: true, status: "trial" }))).toBe(true);
    expect(hasPremiumEntitlement(createEntitlement({ canAccessPremium: false, status: "free" }))).toBe(false);
  });

  it("blocks premium features for free users and allows active users", () => {
    expect(evaluateEntitlementGate(createEntitlement(), "rubric_detail")).toEqual({
      allowed: false,
      reason: "premium_required",
    });

    expect(
      evaluateEntitlementGate(
        createEntitlement({
          canAccessPremium: true,
          currentPlanId: "writewise_plus_yearly",
          status: "active",
        }),
        "rubric_detail",
      ),
    ).toEqual({ allowed: true });
  });

  it("uses a payment issue reason for past-due premium gates", () => {
    expect(evaluateEntitlementGate(createEntitlement({ status: "past_due" }), "canvas_archive")).toEqual({
      allowed: false,
      reason: "payment_issue",
    });
  });
});
