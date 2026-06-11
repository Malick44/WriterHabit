import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
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

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  gradeBand?: GradeBand;
  leftAccessory?: ReactNode;
  rightAccessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

const buttonSizeMinHeights: Record<ButtonSize, number> = {
  sm: layout.touchTarget,
  md: layout.touchTarget,
  lg: layout.touchTargetLarge,
};

const buttonSizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
};

function getVariantStyle(variant: ButtonVariant, disabled: boolean) {
  const token = colors.action[variant];

  if (disabled) {
    return {
      backgroundColor:
        "disabledBackground" in token ? token.disabledBackground : token.background,
      borderColor: "border" in token ? token.border : "transparent",
      foregroundColor: token.disabledForeground,
      pressedColor: "disabledBackground" in token ? token.disabledBackground : token.background,
    };
  }

  return {
    backgroundColor: token.background,
    borderColor: "border" in token ? token.border : "transparent",
    foregroundColor: token.foreground,
    pressedColor: token.pressed,
  };
}

export function Button({
  label,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
  gradeBand: gradeBandProp,
  leftAccessory,
  rightAccessory,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand(gradeBandProp);
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;
  const { handlePressIn, handlePressOut, pressScaleStyle } = usePressScale(!isDisabled);
  const variantStyle = getVariantStyle(variant, isDisabled);
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const isFilledHighContrastVariant = variant === "primary" || variant === "danger";
  const foregroundColor =
    settings.highContrast && !isDisabled
      ? isFilledHighContrastVariant
        ? accessibleColors.actionForeground
        : accessibleColors.text
      : variantStyle.foregroundColor;
  const backgroundColor =
    settings.highContrast && !isDisabled && isFilledHighContrastVariant
      ? accessibleColors.actionBackground
      : variantStyle.backgroundColor;
  const pressedColor =
    settings.highContrast && !isDisabled && isFilledHighContrastVariant ? accessibleColors.text : variantStyle.pressedColor;
  const borderColor = settings.highContrast && !isDisabled ? accessibleColors.border : variantStyle.borderColor;
  const minHeight = Math.max(
    getMinimumTouchTarget(settings),
    gradeBand === "elementary" ? layout.touchTargetLarge : buttonSizeMinHeights[size],
  );

  return (
    <AnimatedPressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
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
          backgroundColor: pressed && !isDisabled ? pressedColor : backgroundColor,
          borderColor,
          borderRadius: radius.md,
          borderWidth: 1,
          flexDirection: "row",
          gap: spacing.sm,
          justifyContent: "center",
          minHeight,
        },
        buttonSizeStyles[size],
        fullWidth ? { alignSelf: "stretch" } : null,
        pressScaleStyle,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={foregroundColor} /> : null}
      {leftAccessory ? <View>{leftAccessory}</View> : null}
      <Text
        numberOfLines={2}
        style={[
          getAccessibleTextStyle(type.button, settings),
          {
            color: foregroundColor,
            flexShrink: 1,
            textAlign: "center",
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
      {rightAccessory ? <View>{rightAccessory}</View> : null}
    </AnimatedPressable>
  );
}
