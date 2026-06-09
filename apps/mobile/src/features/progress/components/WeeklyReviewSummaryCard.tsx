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

import type { ProgressWeeklyReviewViewModel } from "../types";

interface WeeklyReviewSummaryCardProps {
  gradeBand: GradeBand;
  onOpenWeeklyReview: () => void;
  weeklyReview: ProgressWeeklyReviewViewModel;
}

export function WeeklyReviewSummaryCard({
  gradeBand,
  onOpenWeeklyReview,
  weeklyReview,
}: WeeklyReviewSummaryCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const firstHighlight = weeklyReview.highlights[0] ?? t("progress.weeklyReview.emptyDescription");

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([t("progress.weeklyReview.cardAccessibility"), weeklyReview.weekLabel])}
      gradeBand={gradeBand}
      testID="progress-weekly-review-card"
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}>
            {weeklyReview.weekLabel}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
            {t("progress.weeklyReview.cardTitle")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
            {firstHighlight}
          </Text>
          {weeklyReview.nextFocusSkill ? (
            <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.secondary }]}>
              {t("progress.weeklyReview.nextFocusPreview", {
                skill: t(weeklyReview.nextFocusSkill.labelKey),
              })}
            </Text>
          ) : null}
        </Stack>

        <Button
          accessibilityHint={t("progress.weeklyReview.openHint")}
          accessibilityLabel={t("progress.weeklyReview.openAccessibility")}
          gradeBand={gradeBand}
          label={t("progress.weeklyReview.openCta")}
          onPress={onOpenWeeklyReview}
          size={gradeBand === "elementary" ? "lg" : "md"}
          variant="secondary"
        />
      </Stack>
    </Card>
  );
}
