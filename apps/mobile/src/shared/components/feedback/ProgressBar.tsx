import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";

export interface ProgressBarProps {
  value: number;
  label: string;
  showValue?: boolean;
  gradeBand?: GradeBand;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function ProgressBar({ value, label, showValue = false, gradeBand = "middle", style, testID }: ProgressBarProps) {
  const progress = clampProgress(value);
  const percent = Math.round(progress * 100);
  const type = typography.gradeBands[gradeBand];

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
          <Text selectable style={[type.label, { color: colors.text.primary }]}>
            {label}
          </Text>
          <Text selectable style={[type.caption, { color: colors.text.secondary, fontVariant: ["tabular-nums"] }]}>
            {percent}%
          </Text>
        </View>
      ) : null}
      <View
        style={{
          backgroundColor: colors.border.default,
          borderRadius: radius.full,
          height: gradeBand === "elementary" ? 12 : 8,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            backgroundColor: colors.gradeBand[gradeBand].accentStrong,
            borderRadius: radius.full,
            height: "100%",
            width: `${percent}%`,
          }}
        />
      </View>
    </View>
  );
}
