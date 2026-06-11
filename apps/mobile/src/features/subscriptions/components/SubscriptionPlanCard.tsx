import { Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { Inline, Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { LocalizedSubscriptionPlan, SubscriptionPlanId } from "../types";

interface SubscriptionPlanCardProps {
  gradeBand: GradeBand;
  isSelected: boolean;
  onSelectPlan: (planId: SubscriptionPlanId) => void;
  plan: LocalizedSubscriptionPlan;
}

export function SubscriptionPlanCard({
  gradeBand,
  isSelected,
  onSelectPlan,
  plan,
}: SubscriptionPlanCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const title = t(plan.titleKey);

  return (
    <Card
      accessibilityHint={t("subscriptions.plans.selectHint")}
      accessibilityLabel={t("subscriptions.plans.selectAccessibility", { price: plan.priceLabel, title })}
      accessibilityState={{ selected: isSelected }}
      gradeBand={gradeBand}
      onPress={() => onSelectPlan(plan.id)}
      style={{
        borderColor: isSelected ? colors.border.focus : colors.border.default,
        borderWidth: isSelected ? 2 : 1,
      }}
      testID={`subscription-plan-${plan.id}`}
      variant={isSelected ? "accent" : "default"}
    >
      <Stack gap="sm">
        <Inline align="flex-start" justify="space-between">
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
              {title}
            </Text>
            <Text
              selectable
              style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
            >
              {t(plan.descriptionKey)}
            </Text>
          </View>

          {plan.badgeKey ? (
            <View
              style={{
                backgroundColor: colors.feedback.success.background,
                borderColor: colors.feedback.success.border,
                borderRadius: radius.sm,
                borderWidth: 1,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              }}
            >
              <Text
                selectable
                style={[getAccessibleTextStyle(type.caption, settings), { color: colors.feedback.success.text }]}
              >
                {t(plan.badgeKey)}
              </Text>
            </View>
          ) : null}
        </Inline>

        <Inline align="baseline" gap="xs">
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.metric, settings),
              { color: accessibleColors.text, fontVariant: ["tabular-nums"] },
            ]}
          >
            {plan.priceLabel}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
            {t(plan.cadenceKey)}
          </Text>
        </Inline>
      </Stack>
    </Card>
  );
}
