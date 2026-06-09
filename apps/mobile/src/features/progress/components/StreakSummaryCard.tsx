import { Text } from "react-native";

import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { ProgressStreakSummary } from "../types";

interface StreakSummaryCardProps {
  gradeBand: GradeBand;
  streak: ProgressStreakSummary;
}

export function StreakSummaryCard({ gradeBand, streak }: StreakSummaryCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const statusText = streak.practicedToday
    ? t("progress.streak.practicedToday")
    : streak.requiresPracticeToday
      ? t("progress.streak.practiceToday")
      : t("progress.streak.startAgain");

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("progress.streak.accessibility"),
        t("progress.streak.currentValue", { count: streak.currentDays }),
      ])}
      gradeBand={gradeBand}
      testID="progress-streak-card"
      variant={streak.practicedToday ? "success" : streak.currentDays > 0 ? "warning" : "default"}
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}>
            {t("progress.streak.title")}
          </Text>
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.metric, settings),
              { color: colors.gradeBand[gradeBand].accentStrong, fontVariant: ["tabular-nums"] },
            ]}
          >
            {t("progress.streak.currentValue", { count: streak.currentDays })}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
            {statusText}
          </Text>
        </Stack>

        <ProgressBar
          gradeBand={gradeBand}
          label={t("progress.streak.milestoneAccessibility")}
          showValue={gradeBand !== "elementary"}
          value={streak.progressValue}
        />

        <Inline align="stretch" gap="md">
          <Stack gap="xs" style={{ flex: 1, minWidth: 140 }}>
            <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
              {t("progress.streak.bestLabel")}
            </Text>
            <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
              {t("progress.streak.bestValue", { count: streak.bestDays })}
            </Text>
          </Stack>
          <Stack gap="xs" style={{ flex: 1, minWidth: 140 }}>
            <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
              {t("progress.streak.nextMilestoneLabel")}
            </Text>
            <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
              {t("progress.streak.nextMilestoneValue", { count: streak.daysUntilNextMilestone })}
            </Text>
          </Stack>
        </Inline>
      </Stack>
    </Card>
  );
}
