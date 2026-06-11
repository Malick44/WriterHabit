import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { EmptyState, ErrorState, LoadingState, StatusState, SuccessState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import {
  SubscriptionBenefitList,
  SubscriptionPlanCard,
  SubscriptionTrustLinks,
} from "../components";
import { useSubscriptions } from "../hooks/useSubscriptions";
import type { SubscriptionPlanId } from "../types";

export function PaywallScreen() {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const state = useSubscriptions();
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>("WriterHabit_plus_yearly");
  const type = typography.gradeBands[state.gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const isPremium = state.status === "success" && state.viewModel.isPremium;

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      testID="paywall-screen"
    >
      <AppHeader
        gradeBand={state.gradeBand}
        leftAction={{
          accessibilityLabelKey: "common.back",
          type: "back",
        }}
        showSafeArea={false}
        style={styles.header}
        subtitleKey={isPremium ? "subscriptions.paywall.activeSubtitle" : "subscriptions.paywall.subtitle"}
        titleKey={isPremium ? "subscriptions.paywall.activeTitle" : "subscriptions.paywall.title"}
        variant="transparent"
      />

      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("subscriptions.loading.accessibility")}
          description={t("subscriptions.loading.description")}
          gradeBand={state.gradeBand}
          label={t("subscriptions.loading.title")}
          testID="paywall-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          accessibilityLabel={t("subscriptions.error.accessibility")}
          actionLabel={t("common.retry")}
          description={t("subscriptions.error.description")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="paywall-error"
          title={t("subscriptions.error.title")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          accessibilityLabel={t("subscriptions.empty.accessibility")}
          actionLabel={t("common.retry")}
          description={t("subscriptions.empty.description")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="paywall-empty"
          title={t("subscriptions.empty.title")}
        />
      ) : null}

      {state.status === "success" ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <StatusState
              accessibilityLabel={t("subscriptions.offline.accessibility")}
              actionLabel={t("common.retry")}
              description={t("subscriptions.offline.description")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              title={t("subscriptions.offline.title")}
              tone="warning"
            />
          ) : null}

          {state.viewModel.isPremium ? (
            <Stack gap="lg">
              <SuccessState
                accessibilityLabel={t("subscriptions.active.accessibility")}
                description={
                  state.viewModel.entitlement.renewalLabel
                    ? t("subscriptions.active.descriptionWithRenewal", {
                      renewal: state.viewModel.entitlement.renewalLabel,
                    })
                    : t("subscriptions.active.description")
                }
                gradeBand={state.gradeBand}
                testID="paywall-active-state"
                title={t("subscriptions.active.title")}
              />

              {state.viewModel.currentPlan ? (
                <Card
                  accessibilityLabel={t("subscriptions.active.planAccessibility")}
                  gradeBand={state.gradeBand}
                  variant="success"
                >
                  <Stack gap="xs">
                    <Text
                      selectable
                      style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}
                    >
                      {t(state.viewModel.currentPlan.titleKey)}
                    </Text>
                    <Text
                      selectable
                      style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
                    >
                      {state.viewModel.currentPlan.priceLabel} {t(state.viewModel.currentPlan.cadenceKey)}
                    </Text>
                  </Stack>
                </Card>
              ) : null}

              <SubscriptionBenefitList
                benefits={state.viewModel.visibleBenefits}
                gradeBand={state.gradeBand}
              />

              <Button
                accessibilityHint={t("subscriptions.restore.hint")}
                accessibilityLabel={t("subscriptions.restore.accessibility")}
                gradeBand={state.gradeBand}
                label={t("subscriptions.restorePurchases")}
                loading={state.restoreStatus === "loading"}
                onPress={state.restorePurchases}
                size={state.gradeBand === "elementary" ? "lg" : "md"}
                variant="ghost"
              />
            </Stack>
          ) : (
            <Stack gap="lg">
              {state.viewModel.isPastDue ? (
                <StatusState
                  accessibilityLabel={t("subscriptions.pastDue.accessibility")}
                  description={t("subscriptions.pastDue.description")}
                  gradeBand={state.gradeBand}
                  title={t("subscriptions.pastDue.title")}
                  tone="warning"
                />
              ) : null}

              <StatusState
                accessibilityLabel={t("subscriptions.trust.accessibility")}
                description={t("subscriptions.trust.summary")}
                gradeBand={state.gradeBand}
                title={t("subscriptions.trust.title")}
                tone="info"
              />

              <PageSection
                gradeBand={state.gradeBand}
                subtitle={t("subscriptions.benefits.subtitle")}
                title={t("subscriptions.benefits.title")}
              >
                <SubscriptionBenefitList
                  benefits={state.viewModel.visibleBenefits}
                  gradeBand={state.gradeBand}
                />
              </PageSection>

              <PageSection
                gradeBand={state.gradeBand}
                subtitle={t("subscriptions.plans.subtitle")}
                title={t("subscriptions.plans.title")}
              >
                <Stack gap="md">
                  {state.viewModel.planOptions.map((plan) => (
                    <SubscriptionPlanCard
                      gradeBand={state.gradeBand}
                      isSelected={(selectedPlanId === plan.id) || (!selectedPlanId && plan.isRecommended)}
                      key={plan.id}
                      onSelectPlan={setSelectedPlanId}
                      plan={plan}
                    />
                  ))}
                </Stack>
              </PageSection>

              {state.checkoutStatus === "success" ? (
                <SuccessState
                  accessibilityLabel={t("subscriptions.checkout.successAccessibility")}
                  description={t("subscriptions.checkout.successDescription")}
                  gradeBand={state.gradeBand}
                  title={t("subscriptions.checkout.successTitle")}
                />
              ) : null}

              {state.checkoutError ? (
                <ErrorState
                  accessibilityLabel={t("subscriptions.checkout.errorAccessibility")}
                  actionLabel={t("common.retry")}
                  description={t("subscriptions.checkout.errorDescription")}
                  gradeBand={state.gradeBand}
                  onActionPress={() => state.checkoutWithPlan(selectedPlanId)}
                  title={t("subscriptions.checkout.errorTitle")}
                />
              ) : null}

              {state.restoreResult?.status === "not_found" ? (
                <StatusState
                  accessibilityLabel={t("subscriptions.restore.notFoundAccessibility")}
                  description={t("subscriptions.restore.notFoundDescription")}
                  gradeBand={state.gradeBand}
                  title={t("subscriptions.restore.notFoundTitle")}
                  tone="neutral"
                />
              ) : null}

              {state.restoreResult?.status === "restored" ? (
                <SuccessState
                  accessibilityLabel={t("subscriptions.restore.successAccessibility")}
                  description={t("subscriptions.restore.successDescription")}
                  gradeBand={state.gradeBand}
                  title={t("subscriptions.restore.successTitle")}
                />
              ) : null}

              {state.restoreError ? (
                <ErrorState
                  accessibilityLabel={t("subscriptions.restore.errorAccessibility")}
                  actionLabel={t("common.retry")}
                  description={t("subscriptions.restore.errorDescription")}
                  gradeBand={state.gradeBand}
                  onActionPress={state.restorePurchases}
                  title={t("subscriptions.restore.errorTitle")}
                />
              ) : null}

              <View style={{ gap: spacing.md }}>
                <Button
                  accessibilityHint={t("subscriptions.checkout.hint")}
                  accessibilityLabel={t("subscriptions.checkout.accessibility")}
                  disabled={!selectedPlanId}
                  gradeBand={state.gradeBand}
                  label={t("subscriptions.checkout.cta")}
                  loading={state.checkoutStatus === "loading"}
                  onPress={() => state.checkoutWithPlan(selectedPlanId)}
                  size={state.gradeBand === "elementary" ? "lg" : "md"}
                />
                <Button
                  accessibilityHint={t("subscriptions.restore.hint")}
                  accessibilityLabel={t("subscriptions.restore.accessibility")}
                  gradeBand={state.gradeBand}
                  label={t("subscriptions.restorePurchases")}
                  loading={state.restoreStatus === "loading"}
                  onPress={state.restorePurchases}
                  size={state.gradeBand === "elementary" ? "lg" : "md"}
                  variant="secondary"
                />
              </View>

              <SubscriptionTrustLinks
                gradeBand={state.gradeBand}
                links={state.viewModel.entitlement.trustLinks}
              />
            </Stack>
          )}
        </Stack>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});
