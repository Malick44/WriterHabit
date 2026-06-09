import type { ReactNode } from "react";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback";

import { useSubscriptions } from "../hooks/useSubscriptions";
import { evaluateEntitlementGate } from "../services/entitlementService";
import type { PremiumFeatureId } from "../types";
import { UpgradePromptCard } from "./UpgradePromptCard";

interface EntitlementGateProps {
  children: ReactNode;
  featureId: PremiumFeatureId;
  onContinueFreePress?: () => void;
}

export function EntitlementGate({
  children,
  featureId,
  onContinueFreePress,
}: EntitlementGateProps) {
  const router = useRouter();
  const { t } = useI18n();
  const state = useSubscriptions();

  if (state.status === "loading") {
    return (
      <LoadingState
        accessibilityLabel={t("subscriptions.gate.loadingAccessibility")}
        description={t("subscriptions.gate.loadingDescription")}
        gradeBand={state.gradeBand}
        label={t("subscriptions.gate.loadingTitle")}
        testID="entitlement-gate-loading"
      />
    );
  }

  if (state.status === "error") {
    return (
      <ErrorState
        accessibilityLabel={t("subscriptions.gate.errorAccessibility")}
        actionLabel={t("common.retry")}
        description={t("subscriptions.gate.errorDescription")}
        gradeBand={state.gradeBand}
        onActionPress={state.refetch}
        testID="entitlement-gate-error"
        title={t("subscriptions.gate.errorTitle")}
      />
    );
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        accessibilityLabel={t("subscriptions.gate.emptyAccessibility")}
        actionLabel={t("subscriptions.gate.viewPlansCta")}
        description={t("subscriptions.gate.emptyDescription")}
        gradeBand={state.gradeBand}
        onActionPress={() => router.push(routes.paywall)}
        testID="entitlement-gate-empty"
        title={t("subscriptions.gate.emptyTitle")}
      />
    );
  }

  if (state.status !== "success") {
    return null;
  }

  const decision = evaluateEntitlementGate(state.viewModel.entitlement, featureId);

  if (decision.allowed) {
    return children;
  }

  return (
    <UpgradePromptCard
      featureId={featureId}
      gateReason={decision.reason}
      gradeBand={state.gradeBand}
      onContinueFreePress={onContinueFreePress}
      onUpgradePress={() => router.push(routes.paywall)}
    />
  );
}
