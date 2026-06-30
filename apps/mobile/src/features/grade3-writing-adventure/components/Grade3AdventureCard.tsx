import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, shadows, spacing, typography, withAlpha } from "@/design/tokens";
import { Card } from "@/shared/components";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

type Grade3AdventureCardProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  children?: React.ReactNode;
  variant?: "cream" | "mint" | "sky" | "peach" | "success";
  style?: StyleProp<ViewStyle>;
};

const variantColors = {
  cream: { backgroundColor: "#FFF8E9", borderColor: "#EBCB8B" },
  mint: { backgroundColor: "#ECF8F0", borderColor: "#A6D6B5" },
  peach: { backgroundColor: "#FFF0E8", borderColor: "#F0B493" },
  sky: { backgroundColor: "#EEF7FF", borderColor: "#A8CBE8" },
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
                borderRadius: 999,
                height: 48,
                justifyContent: "center",
                width: 48,
              }}
            >
              <Text style={{ fontSize: 26, lineHeight: 32 }}>{icon}</Text>
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
