import { Image, Text, View } from "react-native";

import { spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { Grade3AdventureCard } from "../Grade3AdventureCard";
import { Grade3WorksheetPreview } from "../Grade3WorksheetPreview";
import { ReadAloudCard } from "../ReadAloudCard";
import type { Grade3WritingDay } from "../../types";

const cloudRainbow = require("../../../../../assets/images/writerhabit-child-home/03_cloud_rainbow.png");

type ReadStepProps = {
  lesson: Grade3WritingDay;
};

export function ReadStep({ lesson }: ReadStepProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;

  return (
    <View style={{ gap: spacing.md }}>
      <Grade3AdventureCard
        icon="1"
        subtitle={t("grade3WritingAdventure.lessonFlow.read.subtitle")}
        title={t("grade3WritingAdventure.lessonFlow.read.title")}
        variant="peach"
      >
        <View style={{ alignItems: "center", flexDirection: "row", gap: spacing.md }}>
          <Text style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text, flex: 1 }]}>
            {t("grade3WritingAdventure.lessonFlow.microcopy.ideasMatter")}
          </Text>
          <Image
            accessibilityIgnoresInvertColors
            source={cloudRainbow}
            style={{ height: 76, resizeMode: "contain", width: 96 }}
          />
        </View>
      </Grade3AdventureCard>
      <ReadAloudCard reading={lesson.reading} title={t("grade3WritingAdventure.lessonFlow.read.storyTitle")} />
      <Grade3AdventureCard
        icon={lesson.visualPrompt.emoji}
        subtitle={lesson.visualPrompt.scene}
        title={t("grade3WritingAdventure.lessonFlow.read.pictureTitle")}
        variant="sky"
      >
        <Grade3WorksheetPreview emoji={lesson.visualPrompt.emoji} scene={lesson.visualPrompt.scene} />
      </Grade3AdventureCard>
    </View>
  );
}
