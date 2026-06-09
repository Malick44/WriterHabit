import { Text } from "react-native";

import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { FeedbackRubricLevel, FeedbackRubricScore } from "../types";

interface RubricScoreCardProps {
  gradeBand: GradeBand;
  score: FeedbackRubricScore;
}

function getLevelKey(level: FeedbackRubricLevel): TranslationKey {
  switch (level) {
    case "building":
      return "feedbackReview.rubric.levels.building";
    case "meeting":
      return "feedbackReview.rubric.levels.meeting";
    case "starting":
      return "feedbackReview.rubric.levels.starting";
    case "strong":
      return "feedbackReview.rubric.levels.strong";
  }
}

export function RubricScoreCard({ gradeBand, score }: RubricScoreCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const progress = score.score / score.maxScore;

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("feedbackReview.rubric.cardAccessibility"),
        score.label,
        t("feedbackReview.rubric.scoreLabel", { max: score.maxScore, score: score.score }),
      ])}
      gradeBand={gradeBand}
      testID={`rubric-score-${score.criterionId}`}
      title={score.label}
    >
      <Stack gap="sm">
        <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.link }]}>
          {t(getLevelKey(score.level))}
        </Text>
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
          {score.description}
        </Text>
        <ProgressBar
          gradeBand={gradeBand}
          label={t("feedbackReview.rubric.progressAccessibility", { label: score.label })}
          showValue
          value={progress}
        />
        <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
          {score.coachingNote}
        </Text>
      </Stack>
    </Card>
  );
}
