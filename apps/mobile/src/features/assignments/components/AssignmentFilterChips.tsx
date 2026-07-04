import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import {
  colors,
  radius,
  spacing,
  typography,
  type GradeBand,
} from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

export type AssignmentListFilter = "all" | "active" | "feedback" | "completed";

export const ASSIGNMENT_LIST_FILTERS: readonly AssignmentListFilter[] = [
  "all",
  "active",
  "feedback",
  "completed",
];

const dashboard = colors.dashboard;

interface AssignmentFilterChipsProps {
  gradeBand: GradeBand;
  onSelect: (filter: AssignmentListFilter) => void;
  selected: AssignmentListFilter;
}

export function AssignmentFilterChips({
  gradeBand,
  onSelect,
  selected,
}: AssignmentFilterChipsProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const accent = settings.highContrast
    ? accessibleColors.actionBackground
    : dashboard.primary;

  return (
    <ScrollView
      accessibilityRole="tablist"
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
    >
      {ASSIGNMENT_LIST_FILTERS.map((filter) => {
        const isSelected = selected === filter;

        return (
          <Pressable
            accessibilityLabel={t("assignments.history.filters.accessibility", {
              filter: t(`assignments.history.filters.${filter}`),
            })}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            hitSlop={getAccessibleHitSlop(settings)}
            key={filter}
            onPress={() => onSelect(filter)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isSelected ? accent : dashboard.card,
                borderColor: isSelected ? accent : dashboard.outlineVariant,
              },
              pressed && !isSelected ? styles.chipPressed : null,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(type.label, settings),
                styles.chipText,
                {
                  color: isSelected
                    ? dashboard.onPrimary
                    : dashboard.onSurfaceVariant,
                },
              ]}
            >
              {t(`assignments.history.filters.${filter}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  chipPressed: {
    backgroundColor: dashboard.surfaceContainerLow,
  },
  chipText: {
    fontWeight: "600",
  },
  content: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  scroll: {
    marginHorizontal: -spacing.xxs,
  },
});
