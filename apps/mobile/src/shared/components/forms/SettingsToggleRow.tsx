import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";

import { SettingsRowIconBadge, type SettingsRowIconName } from "./SettingsRow";

export interface SettingsToggleRowProps {
  description?: string;
  disabled?: boolean;
  gradeBand?: GradeBand;
  icon?: SettingsRowIconName;
  iconBackground?: string;
  iconColor?: string;
  label: string;
  onValueChange: (value: boolean) => void;
  testID?: string;
  value: boolean;
  variant?: "plain" | "outlined";
}

/**
 * Shared settings switch row. The pressable container carries the switch
 * semantics (role, checked state, toggle action) so screen readers announce
 * one labelled, toggleable element instead of a plain container that hides
 * the switch. Copy is provided by the caller from `@/shared/i18n`.
 */
export function SettingsToggleRow({
  description,
  disabled = false,
  gradeBand: gradeBandProp,
  icon,
  iconBackground = colors.dashboard.surfaceContainerLow,
  iconColor = colors.dashboard.primary,
  label,
  onValueChange,
  testID,
  value,
  variant = "plain",
}: SettingsToggleRowProps) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand(gradeBandProp);
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const minimumTouchTarget = getMinimumTouchTarget(settings);
  const handleToggle = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <Pressable
      accessibilityHint={description}
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={handleToggle}
      style={[
        styles.row,
        variant === "outlined" ? styles.rowOutlined : null,
        { minHeight: Math.max(64, minimumTouchTarget + spacing.lg) },
        disabled ? styles.rowDisabled : null,
      ]}
      testID={testID}
    >
      <View style={styles.rowLabel}>
        {icon ? <SettingsRowIconBadge backgroundColor={iconBackground} color={iconColor} icon={icon} /> : null}
        <View style={styles.rowCopy}>
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
          {description ? (
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.bodySmall, settings),
                styles.rowDescription,
                settings.highContrast ? { color: accessibleColors.mutedText } : null,
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
      >
        <Switch
          disabled={disabled}
          ios_backgroundColor={colors.dashboard.outlineVariant}
          onValueChange={onValueChange}
          thumbColor={colors.dashboard.surfaceLowest}
          trackColor={{
            false: colors.dashboard.outlineVariant,
            true: colors.dashboard.primary,
          }}
          value={value}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowDisabled: {
    opacity: 0.48,
  },
  rowLabel: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.lg,
    minWidth: 0,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  rowDescription: {
    color: colors.dashboard.onSurfaceVariant,
  },
  rowOutlined: {
    backgroundColor: colors.dashboard.surfaceLowest,
    borderColor: colors.dashboard.outlineVariant,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rowTitle: {
    color: colors.dashboard.onSurface,
  },
});
