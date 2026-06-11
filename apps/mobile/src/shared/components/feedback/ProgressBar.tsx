import { useEffect } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { colors, motion, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  getMotionDuration,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";

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

export function ProgressBar({
  value,
  label,
  showValue = false,
  gradeBand: gradeBandProp,
  style,
  progressColor,
  testID,
}: ProgressBarProps) {
  const progress = clampProgress(value);
  const percent = Math.round(progress * 100);
  const gradeBand = useGradeBand(gradeBandProp);
  const type = typography.gradeBands[gradeBand];
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const fillPercent = useSharedValue(percent);

  useEffect(() => {
    fillPercent.value = withTiming(percent, {
      duration: getMotionDuration(settings, motion.duration.md),
      easing: Easing.bezier(...motion.easing.standard),
    });
  }, [fillPercent, percent, settings]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillPercent.value}%`,
  }));

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
        <Animated.View
          style={[
            {
              backgroundColor: settings.highContrast
                ? accessibleColors.actionBackground
                : progressColor ?? colors.gradeBand[gradeBand].accentStrong,
              borderRadius: radius.full,
              height: "100%",
            },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
}
