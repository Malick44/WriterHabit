import { Text, View } from "react-native";

import { spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { Grade3AdventureCard } from "../Grade3AdventureCard";
import type { Grade3WritingDay } from "../../types";

type SubmitStepProps = {
  draft: string;
  favoriteSentence: string;
  lesson: Grade3WritingDay;
};

export function SubmitStep({ draft, favoriteSentence, lesson }: SubmitStepProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;

  return (
    <View style={{ gap: spacing.md }}>
      <Grade3AdventureCard
        icon="6"
        subtitle={t("grade3WritingAdventure.lessonFlow.submit.subtitle")}
        title={t("grade3WritingAdventure.lessonFlow.submit.title")}
        variant="success"
      >
        <Text style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
          {t("grade3WritingAdventure.lessonFlow.submit.confirmation")}
        </Text>
      </Grade3AdventureCard>
      <Grade3AdventureCard
        icon="📝"
        subtitle={t("grade3WritingAdventure.lesson.title", { day: lesson.day, title: lesson.title })}
        title={t("grade3WritingAdventure.lessonFlow.submit.previewTitle")}
        variant="cream"
      >
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
          {draft}
        </Text>
        {favoriteSentence.trim() ? (
          <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
            {t("grade3WritingAdventure.lessonFlow.submit.favoritePreview", { sentence: favoriteSentence })}
          </Text>
        ) : null}
      </Grade3AdventureCard>
    </View>
  );
}
