import { Text } from "react-native";

import { Card } from "@/shared/components/cards";
import { Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { FeedbackReviewProgress } from "../types";

interface ProgressEarnedCardProps {
  gradeBand: GradeBand;
  progress: FeedbackReviewProgress;
}

export function ProgressEarnedCard({ gradeBand, progress }: ProgressEarnedCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("feedbackReview.completion.progressAccessibility"),
        t("feedbackReview.completion.pointsEarned", { count: progress.points }),
      ])}
      gradeBand={gradeBand}
      testID="feedback-progress-earned-card"
      title={t("feedbackReview.completion.progressTitle")}
      variant="success"
    >
      <Stack gap="sm">
        <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: colors.text.success }]}>
          {t("feedbackReview.completion.pointsEarned", { count: progress.points })}
        </Text>
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
          {t("feedbackReview.completion.minutesEarned", { count: progress.minutes })}
        </Text>
        <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: colors.text.muted }]}>
          {t("feedbackReview.completion.progressPlaceholder")}
        </Text>
      </Stack>
    </Card>
  );
}
