import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing, typography } from "@/design/tokens";
import { readAloud, stopReadAloud } from "@/services/speech/readAloudService";
import {
  getPreferredSpeakerId,
  getPreferredSpeechRate,
  getWordHighlightEnabled,
  setPreferredSpeakerId,
  setPreferredSpeechRate,
  setWordHighlightEnabled,
  SPEECH_RATE_OPTIONS,
  type SpeechRateKey,
} from "@/services/speech/readAloudVoicePreference";
import { VOICE_STYLES } from "@/services/speech/sherpa/catalog";
import { ChoiceCard, SettingsToggleRow } from "@/shared/components/forms";
import { LoadingState } from "@/shared/components/feedback";
import { AccordionSection } from "@/shared/components/layout/AccordionSection";
import { Inline } from "@/shared/components/layout/Inline";
import { Screen } from "@/shared/components/layout/Screen";
import { Stack } from "@/shared/components/layout/Stack";
import { AppHeader } from "@/shared/components/navigation";
import { Pill } from "@/shared/components/pills";
import type { TranslationKey } from "@/shared/i18n";
import { useT } from "@/shared/i18n/useT";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";
import { useGradeBand } from "@/shared/utils/gradeBand";

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

const rateLabelKeys: Record<SpeechRateKey, TranslationKey> = {
  slow: "readAloudVoice.speed.slow",
  normal: "readAloudVoice.speed.normal",
  fast: "readAloudVoice.speed.fast",
};

interface LoadedPreferences {
  speakerId: number;
  rate: number;
  wordHighlight: boolean;
}

function getVoiceLabelKey(speakerId: number): TranslationKey {
  const style = VOICE_STYLES.find((voice) => voice.speakerId === speakerId);
  return (style ? voiceLabelKeys[style.key] : undefined) ?? "readAloudVoice.styles.coachBlend";
}

export function ReadAloudVoiceSettingsScreen() {
  const t = useT();
  const { settings } = useAccessibilityContext();
  const gradeBand = useGradeBand();
  const type = typography.gradeBands[gradeBand];
  const backgroundColor = getAccessibleColors(settings).background;
  const [preferences, setPreferences] = useState<LoadedPreferences | null>(null);

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      getPreferredSpeakerId(),
      getPreferredSpeechRate(),
      getWordHighlightEnabled(),
    ]).then(([speakerId, rate, wordHighlight]) => {
      if (mounted) {
        setPreferences({ rate, speakerId, wordHighlight });
      }
    });
    return () => {
      mounted = false;
      stopReadAloud();
    };
  }, []);

  const playPreview = () => {
    // The facade reads every preference per utterance, so the preview always
    // reflects what was just saved.
    readAloud(t("readAloudVoice.previewLine"), { language: "en-US" });
  };

  const selectVoice = (speakerId: number) => {
    setPreferences((current) => (current ? { ...current, speakerId } : current));
    void setPreferredSpeakerId(speakerId).then(playPreview);
  };

  const selectRate = (rate: number) => {
    setPreferences((current) => (current ? { ...current, rate } : current));
    void setPreferredSpeechRate(rate).then(playPreview);
  };

  const toggleWordHighlight = (enabled: boolean) => {
    setPreferences((current) =>
      current ? { ...current, wordHighlight: enabled } : current,
    );
    void setWordHighlightEnabled(enabled);
  };

  return (
    <View style={{ backgroundColor, flex: 1 }}>
      <SafeAreaView edges={["top"]}>
        <AppHeader
          leftAction={{
            accessibilityLabelKey: "common.back",
            type: "back",
          }}
          showSafeArea={false}
          style={[styles.header, { backgroundColor }]}
          titleKey="readAloudVoice.screen.title"
          variant="compact"
        />
      </SafeAreaView>

      <Screen backgroundColor={backgroundColor} contentPaddingTop={spacing.md}>
        {preferences === null ? (
          <LoadingState label={t("readAloudVoice.screen.loading")} />
        ) : (
          <Stack gap="md">
            <AccordionSection
              accessibilityHint={t("readAloudVoice.screen.voiceHint")}
              label={t("readAloudVoice.screen.voiceLabel")}
              testID="read-aloud-voice-accordion"
              value={t(getVoiceLabelKey(preferences.speakerId))}
            >
              <Stack gap="sm">
                {VOICE_STYLES.map((style) => (
                  <ChoiceCard
                    accessibilityHint={t("readAloudVoice.screen.choiceHint")}
                    key={style.key}
                    label={t(voiceLabelKeys[style.key] ?? "readAloudVoice.styles.coachBlend")}
                    onPress={() => selectVoice(style.speakerId)}
                    selected={preferences.speakerId === style.speakerId}
                    testID={`read-aloud-voice-${style.key}`}
                  />
                ))}
              </Stack>
            </AccordionSection>

            <View style={styles.settingRow}>
              <Text
                numberOfLines={1}
                style={[getAccessibleTextStyle(type.body, settings), styles.settingRowLabel]}
              >
                {t("readAloudVoice.speed.label")}
              </Text>
              <Inline gap="xs" justify="flex-end">
                {SPEECH_RATE_OPTIONS.map((option) => (
                  <Pill
                    accessibilityHint={t("readAloudVoice.speed.choiceHint")}
                    key={option.key}
                    label={t(rateLabelKeys[option.key])}
                    onPress={() => selectRate(option.rate)}
                    size="sm"
                    testID={`read-aloud-rate-${option.key}`}
                    tone={preferences.rate === option.rate ? "primary" : "neutral"}
                  />
                ))}
              </Inline>
            </View>

            <SettingsToggleRow
              label={t("readAloudVoice.wordHighlight.label")}
              onValueChange={toggleWordHighlight}
              testID="read-aloud-word-highlight-toggle"
              value={preferences.wordHighlight}
              variant="outlined"
            />
          </Stack>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 0,
  },
  settingRow: {
    alignItems: "center",
    backgroundColor: colors.dashboard.surfaceLowest,
    borderColor: colors.dashboard.outlineVariant,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  settingRowLabel: {
    color: colors.dashboard.onSurface,
    flexShrink: 1,
  },
});
