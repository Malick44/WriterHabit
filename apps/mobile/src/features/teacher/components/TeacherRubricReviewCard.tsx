import { Text } from "react-native";

import { typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { TeacherSubmissionRubricRow } from "../types";

interface TeacherRubricReviewCardProps {
  gradeBand?: GradeBand;
  row: TeacherSubmissionRubricRow;
}

export function TeacherRubricReviewCard({ gradeBand = "middle", row }: TeacherRubricReviewCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];

  return (
    <Card
      accessibilityLabel={t("teacher.review.rubricRowAccessibility", { label: row.label })}
      gradeBand={gradeBand}
    >
      <Stack gap="sm">
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}
        >
          {row.label}
        </Text>
        <ProgressBar
          gradeBand={gradeBand}
          label={t("teacher.review.rubricProgressAccessibility", { label: row.label })}
          showValue
          value={row.score / row.maxScore}
        />
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.text }]}
        >
          {t("teacher.review.scoreLabel", { max: row.maxScore, score: row.score })}
        </Text>
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
        >
          {row.coachingNote}
        </Text>
      </Stack>
    </Card>
  );
}
