import { Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
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

import type { ParentGradeAdaptation, ParentWeeklyProgress } from "../types";

interface WeeklyViewModel {
  assignmentCompletionValue?: number;
  gradeAdaptation: ParentGradeAdaptation;
  weeklyProgress: ParentWeeklyProgress | null;
  weeklyProgressValue: number;
}

interface ParentWeeklySnapshotCardProps {
  gradeBand: GradeBand;
  viewModel: WeeklyViewModel;
}

export function ParentWeeklySnapshotCard({ gradeBand, viewModel }: ParentWeeklySnapshotCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const weeklyProgress = viewModel.weeklyProgress;

  if (!weeklyProgress) {
    return null;
  }

  const metrics = [
    {
      id: "streak",
      label: t("parent.metrics.streak"),
      value: t("parent.metrics.streakValue", { count: weeklyProgress.streakDays }),
    },
    {
      id: "completed",
      label: t("parent.metrics.completed"),
      value: t("parent.metrics.completedValue", {
        completed: weeklyProgress.completedAssignments,
        total: weeklyProgress.assignedAssignments,
      }),
    },
    {
      id: "skills",
      label: t("parent.metrics.skillImprovement"),
      value: t("parent.metrics.skillImprovementValue", {
        count: weeklyProgress.skillImprovementPercent,
      }),
    },
    {
      id: "sessions",
      label: t("parent.metrics.sessions"),
      value: t("parent.metrics.sessionsValue", { count: weeklyProgress.sessionsCompleted }),
    },
  ].slice(0, viewModel.gradeAdaptation.visibleMetricCount);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("parent.weekly.accessibility"),
        weeklyProgress.weekLabel,
        weeklyProgress.minutesCompleted,
        weeklyProgress.minutesGoal,
      ])}
      gradeBand={gradeBand}
      testID="parent-weekly-snapshot"
      variant="accent"
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}>
            {weeklyProgress.weekLabel}
          </Text>
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.metric, settings),
              { color: colors.gradeBand[gradeBand].accentStrong, fontVariant: ["tabular-nums"] },
            ]}
          >
            {t("parent.weekly.minutesValue", {
              completed: weeklyProgress.minutesCompleted,
              goal: weeklyProgress.minutesGoal,
            })}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
            {weeklyProgress.celebration}
          </Text>
        </Stack>

        <ProgressBar
          gradeBand={gradeBand}
          label={t("parent.weekly.progressAccessibility")}
          showValue={gradeBand !== "elementary"}
          value={viewModel.weeklyProgressValue}
        />

        {typeof viewModel.assignmentCompletionValue === "number" ? (
          <ProgressBar
            gradeBand={gradeBand}
            label={t("parent.weekly.assignmentProgressAccessibility")}
            showValue={gradeBand !== "elementary"}
            value={viewModel.assignmentCompletionValue}
          />
        ) : null}

        <Inline align="stretch" gap="sm">
          {metrics.map((metric) => (
            <View key={metric.id} style={{ flex: 1, minWidth: gradeBand === "elementary" ? "100%" : 140 }}>
              <Stack
                gap="xs"
                style={{
                  backgroundColor: colors.background.surface,
                  borderColor: colors.border.default,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  padding: spacing.md,
                }}
              >
                <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
                  {metric.label}
                </Text>
                <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
                  {metric.value}
                </Text>
              </Stack>
            </View>
          ))}
        </Inline>
      </Stack>
    </Card>
  );
}
