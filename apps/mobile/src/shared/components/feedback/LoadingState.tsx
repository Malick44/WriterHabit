import { ActivityIndicator, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

export interface LoadingStateProps {
  label: string;
  description?: string;
  accessibilityLabel?: string;
  gradeBand?: GradeBand;
  skeletonRowCount?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function LoadingState({
  label,
  description,
  accessibilityLabel,
  gradeBand = "middle",
  skeletonRowCount = 3,
  style,
  testID,
}: LoadingStateProps) {
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const skeletonWidths: Array<ViewStyle["width"]> =
    gradeBand === "elementary" ? ["92%", "78%", "66%"] : ["88%", "72%", "56%"];

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ busy: true }}
      testID={testID}
      style={[
        {
          alignItems: "center",
          gap: spacing.md,
          justifyContent: "center",
          padding: spacing.xl,
        },
        style,
      ]}
    >
      <ActivityIndicator color={colors.action.primary.background} size="large" />
      <View style={{ alignItems: "center", gap: spacing.xs }}>
        <Text
          selectable
          style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text, textAlign: "center" }]}
        >
          {label}
        </Text>
        {description ? (
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.bodySmall, settings),
              { color: accessibleColors.mutedText, textAlign: "center" },
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {skeletonRowCount > 0 ? (
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={{
            alignSelf: "stretch",
            gap: spacing.sm,
            maxWidth: 420,
            width: "100%",
          }}
        >
          {Array.from({ length: skeletonRowCount }, (_, index) => (
            <View
              key={`loading-skeleton-${index}`}
              style={{
                alignSelf: "center",
                backgroundColor: settings.highContrast ? accessibleColors.border : colors.border.default,
                borderRadius: 999,
                height: gradeBand === "elementary" ? 16 : 12,
                opacity: settings.highContrast ? 1 : 0.72,
                width: skeletonWidths[index % skeletonWidths.length],
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
