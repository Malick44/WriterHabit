import { Text } from "react-native";

import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { TeacherClassSummary } from "../types";

interface TeacherClassCardProps {
  classSummary: TeacherClassSummary;
  gradeBand?: GradeBand;
  onPress?: () => void;
}

export function TeacherClassCard({
  classSummary,
  gradeBand = "middle",
  onPress,
}: TeacherClassCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];

  return (
    <Card
      accessibilityHint={onPress ? t("teacher.classCard.openHint") : undefined}
      accessibilityLabel={t("teacher.classCard.accessibility", { name: classSummary.name })}
      gradeBand={gradeBand}
      onPress={onPress}
      title={classSummary.name}
    >
      <Stack gap="sm">
        <Inline gap="sm">
          <Text
            selectable
            style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.text }]}
          >
            {t("teacher.classCard.grade", { grade: classSummary.gradeLevel })}
          </Text>
          <Text
            selectable
            style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.text }]}
          >
            {t("teacher.classCard.students", { count: classSummary.studentCount })}
          </Text>
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.bodySmall, settings),
              {
                color:
                  classSummary.submissionsNeedingReview > 0
                    ? colors.feedback.warning.text
                    : accessibleColors.text,
              },
            ]}
          >
            {t("teacher.classCard.reviewQueue", { count: classSummary.submissionsNeedingReview })}
          </Text>
        </Inline>
        <ProgressBar
          gradeBand={gradeBand}
          label={t("teacher.classCard.completionAccessibility", { name: classSummary.name })}
          showValue
          value={classSummary.averageCompletionPercent / 100}
        />
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
        >
          {classSummary.trendLabel}
        </Text>
      </Stack>
    </Card>
  );
}
