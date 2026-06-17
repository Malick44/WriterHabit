import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface CanvasToolButtonProps {
  accessibilityLabel: string;
  active?: boolean;
  disabled?: boolean;
  gradeBand: GradeBand;
  icon: IoniconName;
  onPress: () => void;
  /** Optional custom inner content rendered instead of the icon. */
  children?: ReactNode;
  testID?: string;
}

/**
 * Single round control inside the floating tool banner. Active controls use
 * the brand primary surface for a high-contrast selected state; inactive ones
 * stay quiet so the canvas remains the hero.
 */
export function CanvasToolButton({
  accessibilityLabel,
  active = false,
  disabled = false,
  gradeBand,
  icon,
  onPress,
  children,
  testID,
}: CanvasToolButtonProps) {
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const hitSlop = getAccessibleHitSlop(settings);
  const target = Math.max(getMinimumTouchTarget(settings), gradeBand === "elementary" ? 48 : 44);
  const iconColor = active ? colors.action.primary.foreground : accessibleColors.text;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { height: target, width: target },
        active
          ? { backgroundColor: settings.highContrast ? accessibleColors.actionBackground : colors.action.primary.background }
          : pressed
            ? styles.pressed
            : null,
        disabled ? styles.disabled : null,
      ]}
      testID={testID}
    >
      {children ?? <Ionicons color={iconColor} name={icon} size={20} />}
      {active ? <View accessible={false} style={styles.activeDot} pointerEvents="none" /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: colors.action.primary.foreground,
    borderRadius: radius.full,
    bottom: 6,
    height: 3,
    position: "absolute",
    width: 14,
  },
  button: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: radius.lg,
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    backgroundColor: colors.background.subtle,
  },
});
