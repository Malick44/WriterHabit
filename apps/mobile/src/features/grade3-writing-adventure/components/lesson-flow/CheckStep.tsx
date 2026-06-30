import { Text, View } from "react-native";

import { spacing, typography } from "@/design/tokens";
import { TextField } from "@/shared/components";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { Grade3AdventureCard } from "../Grade3AdventureCard";
import { Grade3ChecklistCard } from "../Grade3ChecklistCard";
import type { Grade3ChecklistState, Grade3WritingDay } from "../../types";

type CheckStepProps = {
  checklist: Grade3ChecklistState;
  favoriteSentence: string;
  lesson: Grade3WritingDay;
  onChecklistChange: (next: Grade3ChecklistState) => void;
  onFavoriteSentenceChange: (next: string) => void;
  onStrongerSentenceChange: (next: string) => void;
  strongerSentence: string;
};

export function CheckStep({
  checklist,
  favoriteSentence,
  lesson,
  onChecklistChange,
  onFavoriteSentenceChange,
  onStrongerSentenceChange,
  strongerSentence,
}: CheckStepProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;

  return (
    <View style={{ gap: spacing.md }}>
      <Grade3AdventureCard
        icon="5"
        subtitle={t("grade3WritingAdventure.lessonFlow.check.subtitle")}
        title={t("grade3WritingAdventure.lessonFlow.check.title")}
        variant="peach"
      >
        <View style={{ gap: spacing.md }}>
          <Text style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
            {lesson.makeItStronger}
          </Text>
          <View style={{ gap: spacing.xs }}>
            <Text style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
              {t("grade3WritingAdventure.lessonFlow.check.simpleExample")}
            </Text>
            <Text style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
              {t("grade3WritingAdventure.lessonFlow.check.simpleSentence")}
            </Text>
            <Text style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
              {t("grade3WritingAdventure.lessonFlow.check.strongerExample")}
            </Text>
            <Text style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
              {t("grade3WritingAdventure.lessonFlow.check.strongerSentence")}
            </Text>
          </View>
          <Text style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
            {t("grade3WritingAdventure.lessonFlow.microcopy.oneSentence")}
          </Text>
          <TextField
            gradeBand="elementary"
            label={t("grade3WritingAdventure.lessonFlow.check.strongerLabel")}
            multiline
            onChangeText={onStrongerSentenceChange}
            placeholder={t("grade3WritingAdventure.lessonFlow.check.strongerPlaceholder")}
            scrollEnabled={false}
            value={strongerSentence}
          />
          <TextField
            gradeBand="elementary"
            label={t("grade3WritingAdventure.lessonFlow.check.favoriteLabel")}
            onChangeText={onFavoriteSentenceChange}
            placeholder={t("grade3WritingAdventure.lessonFlow.check.favoritePlaceholder")}
            value={favoriteSentence}
          />
        </View>
      </Grade3AdventureCard>
      <Grade3ChecklistCard checklist={lesson.checklist} onChange={onChecklistChange} value={checklist} />
    </View>
  );
}
