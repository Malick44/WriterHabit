import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import { readAloud, stopReadAloud } from "@/services/speech/readAloudService";
import { getPreferredSpeakerId, setPreferredSpeakerId } from "@/services/speech/readAloudVoicePreference";
import { VOICE_STYLES } from "@/services/speech/sherpa/catalog";
import { ChoiceCard } from "@/shared/components/forms";
import { LoadingState } from "@/shared/components/feedback";
import { PageSection } from "@/shared/components/layout/PageSection";
import { Screen } from "@/shared/components/layout/Screen";
import { Stack } from "@/shared/components/layout/Stack";
import { AppHeader } from "@/shared/components/navigation";
import type { TranslationKey } from "@/shared/i18n";
import { useT } from "@/shared/i18n/useT";

const voiceLabelKeys: Record<string, TranslationKey> = {
  female1: "readAloudVoice.styles.female1",
  female2: "readAloudVoice.styles.female2",
  female3: "readAloudVoice.styles.female3",
  female4: "readAloudVoice.styles.female4",
  female5: "readAloudVoice.styles.female5",
  male1: "readAloudVoice.styles.male1",
  male2: "readAloudVoice.styles.male2",
  male3: "readAloudVoice.styles.male3",
  male4: "readAloudVoice.styles.male4",
  male5: "readAloudVoice.styles.male5",
  coachBlend: "readAloudVoice.styles.coachBlend",
};

export function ReadAloudVoiceSettingsScreen() {
  const t = useT();
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    void getPreferredSpeakerId().then((speakerId) => {
      if (mounted) {
        setSelectedSpeakerId(speakerId);
      }
    });
    return () => {
      mounted = false;
      stopReadAloud();
    };
  }, []);

  const selectVoice = (speakerId: number) => {
    setSelectedSpeakerId(speakerId);
    void setPreferredSpeakerId(speakerId).then(() => {
      // Preview with the newly persisted voice so the student hears the
      // change immediately; the facade reads the preference per utterance.
      readAloud(t("readAloudVoice.previewLine"), { language: "en-US" });
    });
  };

  return (
    <Screen>
      <AppHeader
        leftAction={{
          accessibilityLabelKey: "common.back",
          type: "back",
        }}
        showSafeArea={false}
        style={styles.header}
        subtitleKey="readAloudVoice.screen.subtitle"
        titleKey="readAloudVoice.screen.title"
        variant="transparent"
      />
      {selectedSpeakerId === null ? (
        <LoadingState label={t("readAloudVoice.screen.loading")} />
      ) : (
        <PageSection
          subtitle={t("readAloudVoice.screen.sectionSubtitle")}
          title={t("readAloudVoice.screen.sectionTitle")}
        >
          <Stack gap="sm">
            {VOICE_STYLES.map((style) => (
              <ChoiceCard
                accessibilityHint={t("readAloudVoice.screen.choiceHint")}
                key={style.key}
                label={t(voiceLabelKeys[style.key] ?? "readAloudVoice.styles.coachBlend")}
                onPress={() => selectVoice(style.speakerId)}
                selected={selectedSpeakerId === style.speakerId}
                testID={`read-aloud-voice-${style.key}`}
              />
            ))}
          </Stack>
        </PageSection>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});
