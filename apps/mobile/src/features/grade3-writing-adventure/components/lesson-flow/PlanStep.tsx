import { View } from "react-native";

import { spacing } from "@/design/tokens";
import { TextField } from "@/shared/components";
import { useI18n } from "@/i18n";

import { Grade3AdventureCard } from "../Grade3AdventureCard";
import { Grade3WorksheetPreview } from "../Grade3WorksheetPreview";
import { WordBankChips } from "../WordBankChips";
import type { Grade3PlanningState, Grade3WritingDay } from "../../types";

type PlanStepProps = {
  lesson: Grade3WritingDay;
  onPlanningChange: (next: Grade3PlanningState) => void;
  planning: Grade3PlanningState;
};

export function PlanStep({ lesson, onPlanningChange, planning }: PlanStepProps) {
  const { t } = useI18n();

  return (
    <View style={{ gap: spacing.md }}>
      <Grade3AdventureCard
        icon="3"
        subtitle={t("grade3WritingAdventure.lessonFlow.plan.subtitle")}
        title={t("grade3WritingAdventure.lessonFlow.plan.title")}
        variant="peach"
      >
        <View style={{ gap: spacing.md }}>
          <TextField
            gradeBand="elementary"
            label={t("grade3WritingAdventure.lessonFlow.plan.beginningLabel")}
            onChangeText={(beginning) => onPlanningChange({ ...planning, beginning })}
            placeholder={t("grade3WritingAdventure.lessonFlow.plan.beginningPlaceholder")}
            value={planning.beginning}
          />
          <TextField
            gradeBand="elementary"
            label={t("grade3WritingAdventure.lessonFlow.plan.middleLabel")}
            onChangeText={(middle) => onPlanningChange({ ...planning, middle })}
            placeholder={t("grade3WritingAdventure.lessonFlow.plan.middlePlaceholder")}
            value={planning.middle}
          />
          <TextField
            gradeBand="elementary"
            label={t("grade3WritingAdventure.lessonFlow.plan.endLabel")}
            onChangeText={(end) => onPlanningChange({ ...planning, end })}
            placeholder={t("grade3WritingAdventure.lessonFlow.plan.endPlaceholder")}
            value={planning.end}
          />
        </View>
      </Grade3AdventureCard>
      <Grade3AdventureCard
        icon="🔤"
        subtitle={t("grade3WritingAdventure.lessonFlow.plan.wordBankSubtitle")}
        title={t("grade3WritingAdventure.lessonFlow.plan.wordBankTitle")}
        variant="cream"
      >
        <WordBankChips words={lesson.wordBank} />
      </Grade3AdventureCard>
      <Grade3AdventureCard
        icon={lesson.visualPrompt.emoji}
        subtitle={lesson.visualPrompt.drawingTask}
        title={lesson.visualPrompt.scene}
        variant="sky"
      >
        <Grade3WorksheetPreview emoji={lesson.visualPrompt.emoji} scene={lesson.visualPrompt.scene} />
      </Grade3AdventureCard>
    </View>
  );
}
