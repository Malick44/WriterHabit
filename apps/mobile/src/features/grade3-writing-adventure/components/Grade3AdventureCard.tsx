import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, layout, radius, shadows, spacing, typography, withAlpha } from "@/design/tokens";
import { Card } from "@/shared/components";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { grade3Theme } from "../theme/grade3Theme";

type Grade3AdventureCardProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  children?: React.ReactNode;
  variant?: "cream" | "mint" | "sky" | "peach" | "success";
  style?: StyleProp<ViewStyle>;
};

const variantColors = {
  cream: { backgroundColor: grade3Theme.card.cream.background, borderColor: grade3Theme.card.cream.border },
  mint: { backgroundColor: grade3Theme.card.mint.background, borderColor: grade3Theme.card.mint.border },
  peach: { backgroundColor: grade3Theme.card.peach.background, borderColor: grade3Theme.card.peach.border },
  sky: { backgroundColor: grade3Theme.card.sky.background, borderColor: grade3Theme.card.sky.border },
  success: { backgroundColor: colors.feedback.success.background, borderColor: colors.feedback.success.border },
} as const;

export function Grade3AdventureCard({
  children,
  icon,
  style,
  subtitle,
  title,
  variant = "cream",
}: Grade3AdventureCardProps) {
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const variantStyle = variantColors[variant];

  return (
    <Card
      gradeBand="elementary"
      style={[
        {
          backgroundColor: settings.highContrast ? accessibleColors.surface : variantStyle.backgroundColor,
          borderColor: settings.highContrast ? accessibleColors.border : variantStyle.borderColor,
          borderRadius: radius.lg,
          ...shadows.raised,
        },
        style,
      ]}
    >
      <View style={{ gap: spacing.md }}>
        <View style={{ alignItems: "center", flexDirection: "row", gap: spacing.md }}>
          {icon ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{
                alignItems: "center",
                backgroundColor: withAlpha(variantStyle.borderColor, 0.3),
                borderRadius: radius.full,
                height: layout.touchTargetLarge,
                justifyContent: "center",
                width: layout.touchTargetLarge,
              }}
            >
              <Text style={{ fontSize: 28, lineHeight: 34 }}>{icon}</Text>
            </View>
          ) : null}
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text
              accessibilityRole="header"
              selectable
              style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                selectable
                style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {children}
      </View>
    </Card>
  );
}
