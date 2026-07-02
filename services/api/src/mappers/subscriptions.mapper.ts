import type { EntitlementRecord } from "../data";
import type { AuthPrincipal } from "../runtime/auth";
import {
  entitlementAllowsPremium,
  normalizeEntitlementStatus,
  subscriptionFeatures,
  subscriptionPlans,
  type EntitlementsResponse,
} from "../features/subscriptions/subscriptions.contracts";

const trustLinks = {
  privacyUrl: "https://WriterHabit.app/privacy",
  termsUrl: "https://WriterHabit.app/terms",
};

export function mapEntitlementApiResponse(input: {
  entitlement: EntitlementRecord | null;
  generatedAt: string;
  principal: Pick<AuthPrincipal, "id" | "role">;
}): EntitlementsResponse {
  const status = normalizeEntitlementStatus(input.entitlement?.status);
  const canAccessPremium = input.entitlement ? entitlementAllowsPremium(input.entitlement) : false;

  return {
    canAccessPremium,
    connectionStatus: "online",
    currentPeriodEndsAt: input.entitlement?.currentPeriodEndsAt ?? null,
    currentPlanId: input.entitlement?.currentPlanId ?? null,
    features: subscriptionFeatures,
    generatedAt: input.generatedAt,
    managementUrl: input.entitlement?.managementUrl ?? null,
    plans: subscriptionPlans,
    renewalLabel: null,
    role: input.principal.role,
    status: input.entitlement ? status : "free",
    trialEndsAt: input.entitlement?.trialEndsAt ?? null,
    trustLinks,
    userId: input.principal.id,
  };
}
