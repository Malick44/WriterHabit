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
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function LoadingState({
  label,
  description,
  accessibilityLabel,
  gradeBand = "middle",
  style,
  testID,
}: LoadingStateProps) {
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

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
    </View>
  );
}
