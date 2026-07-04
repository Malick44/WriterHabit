import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { readAloud, stopReadAloud } from "@/services/speech/readAloudService";
import { Button } from "@/shared/components";
import { spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { Grade3AdventureCard } from "./Grade3AdventureCard";

type ReadAloudCardProps = {
  reading: string;
  title: string;
};

export function ReadAloudCard({ reading, title }: ReadAloudCardProps) {
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const { t } = useI18n();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      stopReadAloud();
    };
  }, []);

  const toggleSpeech = () => {
    if (speaking) {
      stopReadAloud();
      setSpeaking(false);
      return;
    }

    setSpeaking(true);
    readAloud(reading, {
      language: "en-US",
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
      pitch: 1.05,
      rate: 0.88,
    });
  };

  return (
    <Grade3AdventureCard
      icon="📖"
      subtitle={t("grade3WritingAdventure.lesson.readSubtitle")}
      title={title}
      variant="sky"
    >
      <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
        {reading}
      </Text>
      <View style={{ alignItems: "flex-start", marginTop: spacing.xs }}>
        <Button
          gradeBand="elementary"
          label={
            speaking
              ? t("grade3WritingAdventure.lesson.stopReading")
              : t("grade3WritingAdventure.lesson.readAloud")
          }
          onPress={toggleSpeech}
          size="lg"
          variant={speaking ? "secondary" : "primary"}
        />
      </View>
    </Grade3AdventureCard>
  );
}
