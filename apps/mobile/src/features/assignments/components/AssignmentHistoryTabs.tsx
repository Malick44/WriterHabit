import { Pressable, Text, View } from "react-native";

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

import type { AssignmentHistoryTab } from "../types";

const tabs: AssignmentHistoryTab[] = ["all", "drafts", "submitted", "reviewed"];

interface AssignmentHistoryTabsProps {
  counts: Record<AssignmentHistoryTab, number>;
  gradeBand: GradeBand;
  onSelectTab: (tab: AssignmentHistoryTab) => void;
  selectedTab: AssignmentHistoryTab;
}

export function AssignmentHistoryTabs({
  counts,
  gradeBand,
  onSelectTab,
  selectedTab,
}: AssignmentHistoryTabsProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const accent = settings.highContrast
    ? accessibleColors.actionBackground
    : colors.gradeBand[gradeBand].accentStrong;

  return (
    <View
      accessibilityRole="tablist"
      style={{
        backgroundColor: accessibleColors.surface,
        borderColor: accessibleColors.border,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
        padding: spacing.xs,
      }}
    >
      {tabs.map((tab) => {
        const selected = selectedTab === tab;

        return (
          <Pressable
            accessibilityLabel={t("assignments.history.tabAccessibility", {
              count: counts[tab],
              tab: t(`assignments.history.tabs.${tab}`),
            })}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            hitSlop={getAccessibleHitSlop(settings)}
            key={tab}
            onPress={() => onSelectTab(tab)}
            style={({ pressed }) => [
              {
                backgroundColor: selected ? accent : "transparent",
                borderRadius: radius.sm,
                flexGrow: 1,
                minHeight: gradeBand === "elementary" ? 52 : 44,
                minWidth: gradeBand === "elementary" ? "45%" : 120,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                justifyContent: "center",
              },
              pressed && !selected
                ? { backgroundColor: colors.background.subtle }
                : null,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                getAccessibleTextStyle(type.label, settings),
                {
                  color: selected ? colors.text.inverse : accessibleColors.text,
                  textAlign: "center",
                },
              ]}
            >
              {t("assignments.history.tabLabel", {
                count: counts[tab],
                tab: t(`assignments.history.tabs.${tab}`),
              })}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
