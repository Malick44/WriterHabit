import { Text } from "react-native";
import { render } from "@testing-library/react-native";

import { I18nProvider } from "@/i18n";

import { EntitlementGate } from "./EntitlementGate";
import type {
  PremiumFeatureId,
  SubscriptionApiResponse,
  SubscriptionStatus,
  SubscriptionViewModel,
} from "../types";
import { buildSubscriptionViewModel } from "../services/entitlementService";
import { useSubscriptions, type SubscriptionsState } from "../hooks/useSubscriptions";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("../hooks/useSubscriptions", () => ({
  useSubscriptions: jest.fn(),
}));

const mockUseSubscriptions = jest.mocked(useSubscriptions);

const premiumFeatureCases = [
  { featureId: "extended_progress_history", role: "student" },
  { featureId: "family_progress_reports", role: "parent" },
  { featureId: "teacher_class_insights", role: "teacher" },
  { featureId: "rubric_detail", role: "student" },
  { featureId: "canvas_archive", role: "student" },
] satisfies { featureId: PremiumFeatureId; role: SubscriptionApiResponse["role"] }[];

function createEntitlement(overrides: Partial<SubscriptionApiResponse> = {}): SubscriptionApiResponse {
  return {
    canAccessPremium: false,
    connectionStatus: "online",
    currentPeriodEndsAt: null,
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
    ],
    generatedAt: "2026-06-11T08:00:00.000Z",
    managementUrl: null,
    plans: [
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
    ],
    renewalLabel: null,
    role: "student",
    status: "free",
    trialEndsAt: null,
    trustLinks: {
      privacyUrl: "https://WriterHabit.app/privacy",
      termsUrl: "https://WriterHabit.app/terms",
    },
    userId: "student-1",
    ...overrides,
  };
}

function setSubscriptionState(entitlement: SubscriptionApiResponse): void {
  const viewModel = buildSubscriptionViewModel(entitlement);

  mockUseSubscriptions.mockReturnValue({
    checkoutError: false,
    checkoutResult: null,
    checkoutStatus: "idle",
    checkoutWithPlan: jest.fn(),
    gradeBand: viewModel.gradeAdaptation.band,
    isRefreshing: false,
    refetch: jest.fn(),
    restoreError: false,
    restorePurchases: jest.fn(),
    restoreResult: null,
    restoreStatus: "idle",
    status: "success",
    viewModel: viewModel as SubscriptionViewModel,
  } satisfies SubscriptionsState);
}

function renderGate(featureId: PremiumFeatureId) {
  return render(
    <I18nProvider>
      <EntitlementGate featureId={featureId}>
        <Text testID="premium-content">Premium content</Text>
      </EntitlementGate>
    </I18nProvider>,
  );
}

describe("EntitlementGate", () => {
  afterEach(() => {
    mockUseSubscriptions.mockReset();
  });

  it.each(premiumFeatureCases)("shows the upgrade prompt for free users on $featureId", async ({ featureId, role }) => {
    setSubscriptionState(createEntitlement({ role }));

    const rendered = await renderGate(featureId);

    expect(rendered.getByTestId("upgrade-prompt-card")).toBeTruthy();
    expect(rendered.queryByTestId("premium-content")).toBeNull();
  });

  it.each([
    { status: "expired" },
    { status: "refunded" },
  ] satisfies { status: SubscriptionStatus }[])(
    "keeps premium surfaces blocked when the server state is $status",
    async ({ status }) => {
      setSubscriptionState(createEntitlement({ canAccessPremium: true, status }));

      const rendered = await renderGate("rubric_detail");

      expect(rendered.getByTestId("upgrade-prompt-card")).toBeTruthy();
      expect(rendered.queryByTestId("premium-content")).toBeNull();
    },
  );

  it("shows an honest payment issue state for past-due users", async () => {
    setSubscriptionState(createEntitlement({ status: "past_due" }));

    const rendered = await renderGate("canvas_archive");

    expect(rendered.getByText("Plan needs attention")).toBeTruthy();
    expect(rendered.queryByTestId("premium-content")).toBeNull();
  });

  it.each([
    { status: "trial" },
    { status: "active" },
    { status: "grace_period" },
  ] satisfies { status: SubscriptionStatus }[])(
    "allows protected content when the server grants $status access",
    async ({ status }) => {
      setSubscriptionState(
        createEntitlement({
          canAccessPremium: true,
          currentPeriodEndsAt: "2026-07-11T08:00:00.000Z",
          currentPlanId: "WriterHabit_plus_yearly",
          status,
          trialEndsAt: status === "trial" ? "2026-06-18T08:00:00.000Z" : null,
        }),
      );

      const rendered = await renderGate("extended_progress_history");

      expect(rendered.getByTestId("premium-content")).toBeTruthy();
      expect(rendered.queryByTestId("upgrade-prompt-card")).toBeNull();
    },
  );

  it("fails closed when the server entitlement check errors", async () => {
    mockUseSubscriptions.mockReturnValue({
      checkoutError: false,
      checkoutStatus: "idle",
      checkoutWithPlan: jest.fn(),
      gradeBand: "middle",
      refetch: jest.fn(),
      restoreError: false,
      restorePurchases: jest.fn(),
      restoreResult: null,
      restoreStatus: "idle",
      status: "error",
    } satisfies SubscriptionsState);

    const rendered = await renderGate("family_progress_reports");

    expect(rendered.getByTestId("entitlement-gate-error")).toBeTruthy();
    expect(rendered.queryByTestId("premium-content")).toBeNull();
  });
});
