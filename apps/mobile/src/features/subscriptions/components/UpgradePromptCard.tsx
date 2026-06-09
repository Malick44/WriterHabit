import { Text } from "react-native";

import { typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { getPremiumFeatureCopy } from "../services/entitlementService";
import type { EntitlementGateDecision, PremiumFeatureId } from "../types";

interface UpgradePromptCardProps {
  featureId: PremiumFeatureId;
  gateReason?: Exclude<EntitlementGateDecision, { allowed: true }>["reason"];
  gradeBand: GradeBand;
  onContinueFreePress?: () => void;
  onUpgradePress: () => void;
}

export function UpgradePromptCard({
  featureId,
  gateReason = "premium_required",
  gradeBand,
  onContinueFreePress,
  onUpgradePress,
}: UpgradePromptCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const featureCopy = getPremiumFeatureCopy(featureId);
  const title =
    gateReason === "payment_issue" ? t("subscriptions.upgrade.paymentIssueTitle") : t(featureCopy.titleKey);
  const description =
    gateReason === "payment_issue"
      ? t("subscriptions.upgrade.paymentIssueDescription")
      : t(featureCopy.descriptionKey);

  return (
    <Card
      accessibilityLabel={t("subscriptions.upgrade.accessibility")}
      gradeBand={gradeBand}
      testID="upgrade-prompt-card"
      variant={gateReason === "payment_issue" ? "warning" : "accent"}
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
            {title}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
            {description}
          </Text>
        </Stack>

        <Button
          accessibilityHint={t("subscriptions.upgrade.openPaywallHint")}
          accessibilityLabel={t("subscriptions.upgrade.openPaywallAccessibility")}
          gradeBand={gradeBand}
          label={t("subscriptions.upgrade.openPaywallCta")}
          onPress={onUpgradePress}
          size={gradeBand === "elementary" ? "lg" : "md"}
        />

        {onContinueFreePress ? (
          <Button
            accessibilityHint={t("subscriptions.upgrade.continueFreeHint")}
            accessibilityLabel={t("subscriptions.upgrade.continueFreeAccessibility")}
            gradeBand={gradeBand}
            label={t("subscriptions.upgrade.continueFreeCta")}
            onPress={onContinueFreePress}
            size={gradeBand === "elementary" ? "lg" : "md"}
            variant="secondary"
          />
        ) : null}
      </Stack>
    </Card>
  );
}
