import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";

export type SettingsRowIconName = ComponentProps<typeof Ionicons>["name"];

export interface SettingsRowProps {
  accessibilityHint?: string;
  gradeBand?: GradeBand;
  icon?: SettingsRowIconName;
  iconBackground?: string;
  iconColor?: string;
  label: string;
  onPress: () => void;
  testID?: string;
  trailingIcon?: SettingsRowIconName;
  value?: string;
}

export function SettingsRowIconBadge({
  backgroundColor,
  color,
  icon,
}: {
  backgroundColor: string;
  color: string;
  icon: SettingsRowIconName;
}) {
  return (
    <View style={[styles.iconBadge, { backgroundColor }]}>
      <Ionicons color={color} name={icon} size={22} />
    </View>
  );
}

/**
 * Shared navigation-style settings row: optional icon badge, label, optional
 * current value, and a trailing chevron. Copy is provided by the caller from
 * `@/shared/i18n`.
 */
export function SettingsRow({
  accessibilityHint,
  gradeBand: gradeBandProp,
  icon,
  iconBackground = colors.dashboard.surfaceContainerHigh,
  iconColor = colors.dashboard.outline,
  label,
  onPress,
  testID,
  trailingIcon = "chevron-forward",
  value,
}: SettingsRowProps) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand(gradeBandProp);
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const minimumTouchTarget = getMinimumTouchTarget(settings);

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityRole="button"
      hitSlop={getAccessibleHitSlop(settings)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { minHeight: Math.max(64, minimumTouchTarget + spacing.lg) },
        pressed ? styles.rowPressed : null,
      ]}
      testID={testID}
    >
      <View style={styles.rowLabel}>
        {icon ? <SettingsRowIconBadge backgroundColor={iconBackground} color={iconColor} icon={icon} /> : null}
        <Text
          numberOfLines={2}
          selectable
          style={[
            getAccessibleTextStyle(type.body, settings),
            styles.rowTitle,
            settings.highContrast ? { color: accessibleColors.text } : null,
          ]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.rowTrailing}>
        {value ? (
          <Text
            numberOfLines={1}
            selectable
            style={[
              getAccessibleTextStyle(type.caption, settings),
              styles.rowValue,
              settings.highContrast ? { color: accessibleColors.mutedText } : null,
            ]}
          >
            {value}
          </Text>
        ) : null}
        <Ionicons color={colors.dashboard.outlineVariant} name={trailingIcon} size={22} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBadge: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowLabel: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.lg,
    minWidth: 0,
  },
  rowPressed: {
    backgroundColor: colors.dashboard.surfaceContainerLow,
  },
  rowTitle: {
    color: colors.dashboard.onSurface,
    flex: 1,
  },
  rowTrailing: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    maxWidth: "46%",
  },
  rowValue: {
    color: colors.dashboard.outline,
    flexShrink: 1,
  },
});
