import { useState } from "react";
import { Pressable, Text, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

import { colors, layout, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";
import { usePressScale } from "@/shared/utils/usePressScale";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ChoiceCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  gradeBand?: GradeBand;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ChoiceCard({
  label,
  description,
  selected,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  gradeBand: gradeBandProp,
  style,
  testID,
}: ChoiceCardProps) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand(gradeBandProp);
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const accent = settings.highContrast ? accessibleColors.actionBackground : colors.gradeBand[gradeBand].accentStrong;
  const pressedColor = settings.highContrast ? accessibleColors.surface : colors.gradeBand[gradeBand].background;
  const [pressed, setPressed] = useState(false);
  const { handlePressIn, handlePressOut, pressScaleStyle } = usePressScale(!disabled);

  return (
    <AnimatedPressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      hitSlop={getAccessibleHitSlop(settings)}
      onPress={onPress}
      onPressIn={() => {
        setPressed(true);
        handlePressIn();
      }}
      onPressOut={() => {
        setPressed(false);
        handlePressOut();
      }}
      testID={testID}
      style={[
        {
          alignItems: "center",
          backgroundColor: selected && !settings.highContrast ? colors.gradeBand[gradeBand].background : accessibleColors.surface,
          borderColor: selected ? accent : colors.border.default,
          borderRadius: radius.md,
          borderWidth: 1,
          flexDirection: "row",
          gap: spacing.md,
          minHeight: Math.max(
            getMinimumTouchTarget(settings),
            gradeBand === "elementary" ? layout.touchTargetLarge : layout.touchTarget,
          ),
          opacity: disabled ? 0.6 : 1,
          padding: spacing.lg,
        },
        pressed && !disabled ? { backgroundColor: pressedColor } : null,
        pressScaleStyle,
        style,
      ]}
    >
      <View
        style={{
          alignItems: "center",
          borderColor: selected ? accent : colors.border.strong,
          borderRadius: radius.full,
          borderWidth: 2,
          height: 22,
          justifyContent: "center",
          width: 22,
        }}
      >
        {selected ? (
          <View
            style={{
              backgroundColor: accent,
              borderRadius: radius.full,
              height: 10,
              width: 10,
            }}
          />
        ) : null}
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
          {label}
        </Text>
        {description ? (
          <Text
            selectable
            style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}
