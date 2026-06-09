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

interface RevisionComparisonCardProps {
  gradeBand: GradeBand;
  originalExcerpt: string;
  revisedText: string;
}

export function RevisionComparisonCard({
  gradeBand,
  originalExcerpt,
  revisedText,
}: RevisionComparisonCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([t("feedbackReview.revision.compareAccessibility")])}
      gradeBand={gradeBand}
      testID="revision-comparison-card"
      title={t("feedbackReview.revision.compareTitle")}
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: colors.text.primary }]}>
            {t("feedbackReview.revision.beforeLabel")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
            {originalExcerpt}
          </Text>
        </Stack>

        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: colors.text.primary }]}>
            {t("feedbackReview.revision.afterLabel")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
            {revisedText.trim() ? revisedText.trim() : t("feedbackReview.revision.afterEmpty")}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}
