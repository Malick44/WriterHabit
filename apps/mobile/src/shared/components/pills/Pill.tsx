import type { ComponentProps, ReactNode } from "react";
import {
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, layout, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

export type PillIconName = ComponentProps<typeof Ionicons>["name"];
export type PillSize = "sm" | "md";
export type PillTone = "neutral" | "primary" | "soft";

export interface PillIconConfig {
  color?: string;
  name: PillIconName;
  size?: number;
  testID?: string;
}

export interface PillColorOverrides {
  background?: string;
  border?: string;
  foreground?: string;
  pressedBackground?: string;
}

export interface PillProps {
  accessibilityHint?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  gradeBand?: GradeBand;
  label: string;
  leadingIcons?: readonly PillIconConfig[];
  onPress?: (event: GestureResponderEvent) => void;
  rightAccessory?: ReactNode;
  size?: PillSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  textStyle?: StyleProp<TextStyle>;
  tone?: PillTone;
  trailingIcons?: readonly PillIconConfig[];
  colorOverrides?: PillColorOverrides;
}

const pillSizeStyles: Record<
  PillSize,
  {
    gap: number;
    iconSize: number;
    minHeight: number;
    paddingHorizontal: number;
    paddingVertical: number;
  }
> = {
  sm: {
    gap: spacing.xs,
    iconSize: 16,
    minHeight: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  md: {
    gap: spacing.sm,
    iconSize: 18,
    minHeight: layout.touchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
};

function getToneColors(tone: PillTone, highContrast: boolean) {
  if (highContrast) {
    return {
      background: colors.background.surface,
      border: colors.border.strong,
      foreground: colors.text.primary,
      pressedBackground: colors.action.ghost.pressed,
    };
  }

  switch (tone) {
    case "primary":
      return {
        background: colors.action.primary.background,
        border: colors.action.primary.background,
        foreground: colors.action.primary.foreground,
        pressedBackground: colors.action.primary.pressed,
      };
    case "soft":
      return {
        background: colors.background.surfaceRaised,
        border: colors.border.default,
        foreground: colors.text.primary,
        pressedBackground: colors.action.ghost.pressed,
      };
    case "neutral":
      return {
        background: colors.background.surface,
        border: colors.border.default,
        foreground: colors.text.primary,
        pressedBackground: colors.action.ghost.pressed,
      };
  }
}

function renderIcons(
  icons: readonly PillIconConfig[] | undefined,
  defaultColor: string,
  defaultSize: number,
) {
  return icons?.map((icon, index) => (
    <Ionicons
      accessible={false}
      color={icon.color ?? defaultColor}
      importantForAccessibility="no"
      key={`${icon.name}-${icon.testID ?? index}`}
      name={icon.name}
      size={icon.size ?? defaultSize}
      testID={icon.testID}
    />
  ));
}

export function Pill({
  accessibilityHint,
  accessibilityLabel,
  colorOverrides,
  disabled = false,
  gradeBand = "middle",
  label,
  leadingIcons,
  onPress,
  rightAccessory,
  size = "md",
  style,
  testID,
  textStyle,
  tone = "neutral",
  trailingIcons,
}: PillProps) {
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const toneColors = getToneColors(tone, settings.highContrast);
  const sizeStyle = pillSizeStyles[size];
  const isInteractive = Boolean(onPress);
  const foreground = disabled
    ? colors.action.secondary.disabledForeground
    : colorOverrides?.foreground ?? (settings.highContrast ? accessibleColors.text : toneColors.foreground);
  const background = disabled
    ? colors.action.secondary.disabledBackground
    : colorOverrides?.background ?? (settings.highContrast ? accessibleColors.surface : toneColors.background);
  const border = disabled
    ? colors.border.default
    : colorOverrides?.border ?? (settings.highContrast ? accessibleColors.border : toneColors.border);
  const pressedBackground =
    colorOverrides?.pressedBackground ?? (settings.highContrast ? colors.action.ghost.pressed : toneColors.pressedBackground);
  const minHeight = isInteractive
    ? Math.max(getMinimumTouchTarget(settings), sizeStyle.minHeight)
    : sizeStyle.minHeight;
  const containerStyle: StyleProp<ViewStyle> = [
    {
      alignItems: "center",
      backgroundColor: background,
      borderColor: border,
      borderRadius: radius.full,
      borderWidth: 1,
      flexDirection: "row",
      gap: sizeStyle.gap,
      justifyContent: "center",
      minHeight,
      paddingHorizontal: sizeStyle.paddingHorizontal,
      paddingVertical: sizeStyle.paddingVertical,
    },
    style,
  ];
  const content = (
    <>
      {renderIcons(leadingIcons, foreground, sizeStyle.iconSize)}
      <Text
        numberOfLines={1}
        style={[
          getAccessibleTextStyle(typography.gradeBands[gradeBand].button, settings),
          {
            color: foreground,
            flexShrink: 1,
            textAlign: "center",
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
      {renderIcons(trailingIcons, foreground, sizeStyle.iconSize)}
      {rightAccessory ? <View>{rightAccessory}</View> : null}
    </>
  );

  if (!isInteractive) {
    return (
      <View
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        style={containerStyle}
        testID={testID}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={getAccessibleHitSlop(settings)}
      onPress={onPress}
      style={({ pressed }) => [
        containerStyle,
        pressed && !disabled
          ? {
              backgroundColor: pressedBackground,
            }
          : null,
      ]}
      testID={testID}
    >
      {content}
    </Pressable>
  );
}
