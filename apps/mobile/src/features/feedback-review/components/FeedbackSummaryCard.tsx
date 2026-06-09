import { Text } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { FeedbackReview } from "../types";

interface FeedbackSummaryCardProps {
  gradeBand: GradeBand;
  onRevisionPress: () => void;
  onRubricPress: () => void;
  progressValue: number;
  review: FeedbackReview;
}

export function FeedbackSummaryCard({
  gradeBand,
  onRevisionPress,
  onRubricPress,
  progressValue,
  review,
}: FeedbackSummaryCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("feedbackReview.summary.cardAccessibility"),
        review.assignmentTitle,
      ])}
      gradeBand={gradeBand}
      testID="feedback-summary-card"
      title={review.assignmentTitle}
      variant="success"
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: colors.text.success }]}>
            {t("feedbackReview.strengthLabel")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
            {review.summary.strength}
          </Text>
        </Stack>

        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: colors.text.primary }]}>
            {t("feedbackReview.improvementLabel")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
            {review.summary.improvement}
          </Text>
        </Stack>

        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: colors.text.primary }]}>
            {t("feedbackReview.nextStepLabel")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
            {review.summary.nextRevisionTask}
          </Text>
        </Stack>

        <ProgressBar
          gradeBand={gradeBand}
          label={t("feedbackReview.summary.progressAccessibility")}
          showValue
          value={progressValue}
        />

        <Button
          accessibilityHint={t("feedbackReview.summary.rubricHint")}
          accessibilityLabel={t("feedbackReview.summary.rubricAccessibility")}
          gradeBand={gradeBand}
          label={t("feedbackReview.summary.rubricCta")}
          onPress={onRubricPress}
          size={gradeBand === "elementary" ? "lg" : "md"}
          variant="secondary"
        />
        <Button
          accessibilityHint={t("feedbackReview.summary.revisionHint")}
          accessibilityLabel={t("feedbackReview.summary.revisionAccessibility")}
          gradeBand={gradeBand}
          label={t("feedbackReview.summary.revisionCta")}
          onPress={onRevisionPress}
          size={gradeBand === "elementary" ? "lg" : "md"}
        />
      </Stack>
    </Card>
  );
}
