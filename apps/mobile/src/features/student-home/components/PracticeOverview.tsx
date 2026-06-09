import { Text, View } from "react-native";

import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { StudentHomeViewModel } from "../types";
import { MetricCard } from "./MetricCard";

interface PracticeOverviewProps {
  gradeBand: GradeBand;
  viewModel: StudentHomeViewModel;
}

export function PracticeOverview({ gradeBand, viewModel }: PracticeOverviewProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const dailyValue = viewModel.dailyPractice.completedToday
    ? t("studentHome.practice.todayDone")
    : t("common.minutes", { count: viewModel.dailyPractice.minutesGoal });
  const weeklyDescription = viewModel.gradeAdaptation.showWeeklySessionCount
    ? t("studentHome.practice.weeklyDescriptionWithSessions", {
        count: viewModel.weeklyWriting.sessionsCompleted,
      })
    : t("studentHome.practice.weeklyDescription");

  return (
    <Stack gap="md" testID="student-home-practice-overview">
      <Inline align="stretch" gap="md">
        <View style={{ flex: 1, minWidth: gradeBand === "elementary" ? "100%" : 220 }}>
          <MetricCard
            accessibilityLabel={buildAccessibilityLabel([
              t("studentHome.practice.streakAccessibility"),
              viewModel.streak.currentDays,
            ])}
            description={t("studentHome.practice.streakDescription", {
              count: viewModel.streak.nextMilestoneDays,
            })}
            gradeBand={gradeBand}
            title={t("studentHome.practice.streakTitle")}
            value={t("studentHome.practice.streakValue", { count: viewModel.streak.currentDays })}
            variant={viewModel.streak.practicedToday ? "success" : "default"}
          />
        </View>
        <View style={{ flex: 1, minWidth: gradeBand === "elementary" ? "100%" : 220 }}>
          <MetricCard
            accessibilityLabel={buildAccessibilityLabel([
              t("studentHome.practice.dailyAccessibility"),
              viewModel.dailyPractice.minutesGoal,
            ])}
            description={viewModel.dailyPractice.nextPromptLabel}
            gradeBand={gradeBand}
            title={t("studentHome.practice.dailyTitle")}
            value={dailyValue}
            variant={viewModel.dailyPractice.completedToday ? "success" : "accent"}
          />
        </View>
      </Inline>

      <Card
        accessibilityLabel={buildAccessibilityLabel([
          t("studentHome.practice.weeklyAccessibility"),
          viewModel.weeklyWriting.minutesCompleted,
          viewModel.weeklyWriting.minutesGoal,
        ])}
        gradeBand={gradeBand}
        testID="student-home-weekly-minutes"
      >
        <Stack gap="md">
          <Stack gap="xs">
            <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}>
              {t("studentHome.practice.weeklyTitle")}
            </Text>
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.metric, settings),
                { color: colors.gradeBand[gradeBand].accentStrong },
              ]}
            >
              {t("studentHome.practice.weeklyValue", {
                completed: viewModel.weeklyWriting.minutesCompleted,
                goal: viewModel.weeklyWriting.minutesGoal,
              })}
            </Text>
            <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
              {weeklyDescription}
            </Text>
          </Stack>
          <ProgressBar
            gradeBand={gradeBand}
            label={t("studentHome.practice.weeklyProgressAccessibility")}
            showValue={gradeBand !== "elementary"}
            value={viewModel.weeklyProgressValue}
          />
        </Stack>
      </Card>
    </Stack>
  );
}
