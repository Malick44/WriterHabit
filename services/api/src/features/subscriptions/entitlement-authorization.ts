import type { Database } from "../../data";
import type { AuthPrincipal } from "../../runtime/auth";
import { ApiHttpError } from "../../runtime/errors";
import {
  entitlementAllowsPremium,
  subscriptionFeatures,
  type SubscriptionFeatureId,
} from "./subscriptions.contracts";

function getFeature(featureId: SubscriptionFeatureId) {
  return subscriptionFeatures.find((feature) => feature.id === featureId);
}

export async function assertPremiumFeatureAccess(
  database: Database,
  principal: AuthPrincipal,
  featureId: SubscriptionFeatureId,
): Promise<void> {
  const feature = getFeature(featureId);

  if (!feature || feature.includedIn !== "plus") {
    return;
  }

  if (!feature.supportedRoles.some((role) => role === principal.role)) {
    throw new ApiHttpError({
      code: "authorization.role_denied",
      details: {
        featureId,
        role: principal.role,
      },
    });
  }

  const entitlement = await database.getLatestEntitlementForUser(principal.id);

  if (!entitlement || !entitlementAllowsPremium(entitlement)) {
    throw new ApiHttpError({
      code: "subscription.entitlement_required",
      details: {
        entitlementStatus: entitlement?.status ?? "free",
        featureId,
      },
    });
  }
}

export async function canAccessPremiumFeature(
  database: Database,
  principal: AuthPrincipal,
  featureId: SubscriptionFeatureId,
): Promise<boolean> {
  try {
    await assertPremiumFeatureAccess(database, principal, featureId);
    return true;
  } catch (error) {
    if (
      error instanceof ApiHttpError &&
      (error.code === "subscription.entitlement_required" || error.code === "authorization.role_denied")
    ) {
      return false;
    }

    throw error;
  }
}
