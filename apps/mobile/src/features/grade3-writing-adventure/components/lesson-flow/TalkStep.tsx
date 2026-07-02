import { Text, View } from "react-native";

import { spacing, typography } from "@/design/tokens";
import { TextField } from "@/shared/components";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { Grade3AdventureCard } from "../Grade3AdventureCard";
import { StarterChip } from "../StarterChip";
import type { Grade3PlanningState, Grade3WritingDay } from "../../types";

type TalkStepProps = {
  lesson: Grade3WritingDay;
  onPlanningChange: (next: Grade3PlanningState) => void;
  planning: Grade3PlanningState;
};

export function TalkStep({ lesson, onPlanningChange, planning }: TalkStepProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const starters = [
    t("grade3WritingAdventure.lessonFlow.talk.starterMaybe"),
    t("grade3WritingAdventure.lessonFlow.talk.starterThink"),
    t("grade3WritingAdventure.lessonFlow.talk.starterProblem"),
  ];

  const appendStarter = (starter: string) => {
    onPlanningChange({
      ...planning,
      talkIdea: planning.talkIdea.trim() ? `${planning.talkIdea} ${starter}` : starter,
    });
  };

  return (
    <View style={{ gap: spacing.md }}>
      <Grade3AdventureCard
        icon="2"
        subtitle={t("grade3WritingAdventure.lessonFlow.talk.subtitle")}
        title={t("grade3WritingAdventure.lessonFlow.talk.title")}
        variant="mint"
      >
        <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
          {lesson.talkQuestion}
        </Text>
        <Text style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
          {t("grade3WritingAdventure.lessonFlow.microcopy.firstDraft")}
        </Text>
      </Grade3AdventureCard>
      <Grade3AdventureCard
        icon="💬"
        subtitle={t("grade3WritingAdventure.lessonFlow.talk.ideaSubtitle")}
        title={t("grade3WritingAdventure.lessonFlow.talk.ideaTitle")}
        variant="cream"
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {starters.map((starter) => (
            <StarterChip
              accessibilityHint={t("grade3WritingAdventure.lessonFlow.talk.starterHint")}
              key={starter}
              label={starter}
              onPress={() => appendStarter(starter)}
            />
          ))}
        </View>
        <TextField
          gradeBand="elementary"
          label={t("grade3WritingAdventure.lessonFlow.talk.inputLabel")}
          multiline
          onChangeText={(talkIdea) => onPlanningChange({ ...planning, talkIdea })}
          placeholder={t("grade3WritingAdventure.lessonFlow.talk.inputPlaceholder")}
          scrollEnabled={false}
          value={planning.talkIdea}
        />
      </Grade3AdventureCard>
    </View>
  );
}
