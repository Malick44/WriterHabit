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

import type { GrammarSuggestion } from "../types";

interface GrammarSuggestionCardProps {
  gradeBand: GradeBand;
  suggestion: GrammarSuggestion;
}

export function GrammarSuggestionCard({ gradeBand, suggestion }: GrammarSuggestionCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([t("feedbackReview.grammar.cardAccessibility"), suggestion.title])}
      gradeBand={gradeBand}
      testID={`grammar-suggestion-${suggestion.id}`}
      title={suggestion.title}
      variant="warning"
    >
      <Stack gap="sm">
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
          {suggestion.explanation}
        </Text>
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: colors.text.primary }]}>
            {t("feedbackReview.grammar.studentAction")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
            {suggestion.studentAction}
          </Text>
        </Stack>
        <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
          {t("feedbackReview.grammar.excerpt", { excerpt: suggestion.originalExcerpt })}
        </Text>
      </Stack>
    </Card>
  );
}
