import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

export interface ProgressBarProps {
  value: number;
  label: string;
  showValue?: boolean;
  gradeBand?: GradeBand;
  style?: StyleProp<ViewStyle>;
  progressColor?: string;
  testID?: string;
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function ProgressBar({ value, label, showValue = false, gradeBand = "middle", style, progressColor, testID }: ProgressBarProps) {
  const progress = clampProgress(value);
  const percent = Math.round(progress * 100);
  const type = typography.gradeBands[gradeBand];
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      testID={testID}
      style={[{ gap: spacing.xs }, style]}
    >
      {showValue ? (
        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.text }]}>
            {label}
          </Text>
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.caption, settings),
              { color: accessibleColors.mutedText, fontVariant: ["tabular-nums"] },
            ]}
          >
            {percent}%
          </Text>
        </View>
      ) : null}
      <View
        style={{
          backgroundColor: colors.border.default,
          borderColor: settings.highContrast ? accessibleColors.border : "transparent",
          borderRadius: radius.full,
          borderWidth: settings.highContrast ? 1 : 0,
          height: gradeBand === "elementary" ? 12 : 8,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            backgroundColor: settings.highContrast
              ? accessibleColors.actionBackground
              : progressColor ?? colors.gradeBand[gradeBand].accentStrong,
            borderRadius: radius.full,
            height: "100%",
            width: `${percent}%`,
          }}
        />
      </View>
    </View>
  );
}
