import { useState, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";

export interface AccordionSectionProps extends PropsWithChildren {
  accessibilityHint?: string;
  defaultExpanded?: boolean;
  gradeBand?: GradeBand;
  label: string;
  testID?: string;
  /** Summary of the current selection, shown next to the chevron while collapsed. */
  value?: string;
}

/**
 * Outlined collapsible section. The header row toggles the body and carries
 * the expanded state for screen readers. Copy is provided by the caller from
 * `@/shared/i18n`.
 */
export function AccordionSection({
  accessibilityHint,
  children,
  defaultExpanded = false,
  gradeBand: gradeBandProp,
  label,
  testID,
  value,
}: AccordionSectionProps) {
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand(gradeBandProp);
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const minimumTouchTarget = getMinimumTouchTarget(settings);
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={buildAccessibilityLabel([label, value])}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={[styles.headerRow, { minHeight: Math.max(64, minimumTouchTarget + spacing.lg) }]}
        testID={testID}
      >
        <Text
          numberOfLines={1}
          style={[
            getAccessibleTextStyle(type.body, settings),
            styles.headerLabel,
            settings.highContrast ? { color: accessibleColors.text } : null,
          ]}
        >
          {label}
        </Text>
        <View style={styles.headerValue}>
          {value ? (
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(type.bodySmall, settings),
                styles.headerValueText,
                settings.highContrast ? { color: accessibleColors.mutedText } : null,
              ]}
            >
              {value}
            </Text>
          ) : null}
          <Ionicons
            accessible={false}
            color={settings.highContrast ? accessibleColors.mutedText : colors.dashboard.onSurfaceVariant}
            importantForAccessibility="no"
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
          />
        </View>
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  container: {
    backgroundColor: colors.dashboard.surfaceLowest,
    borderColor: colors.dashboard.outlineVariant,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  headerLabel: {
    color: colors.dashboard.onSurface,
    flexShrink: 1,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  headerValue: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  headerValueText: {
    color: colors.dashboard.onSurfaceVariant,
    flexShrink: 1,
  },
});
