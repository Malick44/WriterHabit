import { Text } from "react-native";

import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { TeacherSkillTrend } from "../types";

interface TeacherSkillTrendCardProps {
  gradeBand?: GradeBand;
  trend: TeacherSkillTrend;
}

export function TeacherSkillTrendCard({ gradeBand = "middle", trend }: TeacherSkillTrendCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];

  return (
    <Card
      accessibilityLabel={t("teacher.classProgress.skillAccessibility", { skill: trend.label })}
      gradeBand={gradeBand}
    >
      <Stack gap="sm">
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}
        >
          {trend.label}
        </Text>
        <ProgressBar
          gradeBand={gradeBand}
          label={t("teacher.classProgress.skillScoreAccessibility", { skill: trend.label })}
          showValue
          value={trend.averageScore / 100}
        />
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: colors.feedback.success.text }]}
        >
          {trend.changeLabel}
        </Text>
        <Text
          selectable
          style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}
        >
          {t("teacher.classProgress.studentCount", { count: trend.studentCount })}
        </Text>
      </Stack>
    </Card>
  );
}
