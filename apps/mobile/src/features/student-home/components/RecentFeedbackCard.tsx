import { Text } from "react-native";

import { Button } from "@/shared/components/buttons";
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

import type { StudentHomeFeedback, StudentHomeGradeAdaptation } from "../types";

interface RecentFeedbackCardProps {
  feedback: StudentHomeFeedback;
  gradeAdaptation: StudentHomeGradeAdaptation;
  gradeBand: GradeBand;
  onReviewPress: () => void;
}

export function RecentFeedbackCard({
  feedback,
  gradeAdaptation,
  gradeBand,
  onReviewPress,
}: RecentFeedbackCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([t("studentHome.feedback.accessibility"), feedback.title])}
      gradeBand={gradeBand}
      testID="student-home-feedback"
      title={t("studentHome.feedback.title")}
      variant="success"
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
            {feedback.title}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {feedback.createdLabel}
          </Text>
        </Stack>

        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: colors.text.success }]}>
            {t("feedbackReview.strengthLabel")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
            {feedback.strength}
          </Text>
        </Stack>

        {gradeAdaptation.showDetailedFeedback ? (
          <Stack gap="xs">
            <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: colors.text.primary }]}>
              {t("feedbackReview.improvementLabel")}
            </Text>
            <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
              {feedback.improvement}
            </Text>
          </Stack>
        ) : null}

        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: colors.text.primary }]}>
            {t("feedbackReview.nextStepLabel")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
            {feedback.revisionTask}
          </Text>
        </Stack>

        <Button
          accessibilityHint={t("studentHome.feedback.hint")}
          accessibilityLabel={t("studentHome.feedback.ctaAccessibility")}
          gradeBand={gradeBand}
          label={t("studentHome.feedback.cta")}
          onPress={onReviewPress}
          size={gradeBand === "elementary" ? "lg" : "md"}
          variant="secondary"
        />
      </Stack>
    </Card>
  );
}
