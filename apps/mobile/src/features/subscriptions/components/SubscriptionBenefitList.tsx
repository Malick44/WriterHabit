import { Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { LocalizedSubscriptionBenefit } from "../types";

interface SubscriptionBenefitListProps {
  benefits: LocalizedSubscriptionBenefit[];
  gradeBand: GradeBand;
}

export function SubscriptionBenefitList({ benefits, gradeBand }: SubscriptionBenefitListProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Stack gap="md" testID="subscription-benefit-list">
      {benefits.map((benefit) => (
        <Card
          accessibilityLabel={t("subscriptions.benefits.accessibility", {
            title: t(benefit.titleKey),
          })}
          gradeBand={gradeBand}
          key={benefit.feature.id}
          variant={benefit.feature.includedIn === "free" ? "default" : "accent"}
        >
          <View style={{ alignItems: "flex-start", flexDirection: "row", gap: spacing.md }}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{
                alignItems: "center",
                backgroundColor: colors.feedback.info.background,
                borderColor: colors.feedback.info.border,
                borderRadius: radius.sm,
                borderWidth: 1,
                height: 28,
                justifyContent: "center",
                width: 28,
              }}
            >
              <Text style={[type.label, { color: colors.feedback.info.icon }]}>+</Text>
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
                {t(benefit.titleKey)}
              </Text>
              <Text
                selectable
                style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
              >
                {t(benefit.descriptionKey)}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </Stack>
  );
}
