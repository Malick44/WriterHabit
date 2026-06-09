import { useRouter } from "expo-router";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { getLaunchRoute } from "@/core/navigation/roleRouter";
import { routes } from "@/core/navigation/routeNames";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, SuccessState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout";

import { UpgradePromptCard } from "../components";
import { useSubscriptions } from "../hooks/useSubscriptions";
import type { PremiumFeatureId } from "../types";

interface UpgradePromptScreenProps {
  featureId?: PremiumFeatureId;
}

export function UpgradePromptScreen({ featureId = "extended_progress_history" }: UpgradePromptScreenProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { session } = useAuthSession();
  const state = useSubscriptions();

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("subscriptions.upgrade.subtitle")}
      testID="upgrade-prompt-screen"
      title={t("subscriptions.upgrade.title")}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("subscriptions.gate.loadingAccessibility")}
          description={t("subscriptions.gate.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("subscriptions.gate.loadingTitle")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          accessibilityLabel={t("subscriptions.gate.errorAccessibility")}
          actionLabel={t("common.retry")}
          description={t("subscriptions.gate.errorDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("subscriptions.gate.errorTitle")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          accessibilityLabel={t("subscriptions.gate.emptyAccessibility")}
          actionLabel={t("subscriptions.gate.viewPlansCta")}
          description={t("subscriptions.gate.emptyDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.push(routes.paywall)}
          title={t("subscriptions.gate.emptyTitle")}
        />
      ) : null}

      {state.status === "success" && state.viewModel.isPremium ? (
        <SuccessState
          accessibilityLabel={t("subscriptions.active.accessibility")}
          description={t("subscriptions.active.description")}
          gradeBand={state.gradeBand}
          title={t("subscriptions.active.title")}
        />
      ) : null}

      {state.status === "success" && !state.viewModel.isPremium ? (
        <UpgradePromptCard
          featureId={featureId}
          gateReason={state.viewModel.isPastDue ? "payment_issue" : "premium_required"}
          gradeBand={state.gradeBand}
          onContinueFreePress={() => router.replace(getLaunchRoute(session))}
          onUpgradePress={() => router.push(routes.paywall)}
        />
      ) : null}
    </Screen>
  );
}
