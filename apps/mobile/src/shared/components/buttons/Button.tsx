import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, layout, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonSizeStyle = ViewStyle & {
  minHeight: number;
};

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
  testID?: string;
}

const buttonSizeStyles: Record<ButtonSize, ButtonSizeStyle> = {
  sm: {
    minHeight: layout.touchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  md: {
    minHeight: layout.touchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lg: {
    minHeight: layout.touchTargetLarge,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
};

function getVariantStyle(variant: ButtonVariant, disabled: boolean) {
  const token = colors.action[variant];

  if (disabled) {
    return {
      backgroundColor:
        "disabledBackground" in token ? token.disabledBackground : colors.background.surface,
      borderColor: "border" in token ? token.border : "transparent",
      foregroundColor: token.disabledForeground,
      pressedColor: "disabledBackground" in token ? token.disabledBackground : colors.background.surface,
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
  gradeBand = "middle",
  leftAccessory,
  rightAccessory,
  style,
  testID,
}: ButtonProps) {
  const { settings } = useAccessibilityContext();
  const isDisabled = disabled || loading;
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
    gradeBand === "elementary" ? layout.touchTargetLarge : buttonSizeStyles[size].minHeight,
  );

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={getAccessibleHitSlop(settings)}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
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
        ]}
      >
        {label}
      </Text>
      {rightAccessory ? <View>{rightAccessory}</View> : null}
    </Pressable>
  );
}
