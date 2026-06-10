import { StyleSheet } from "react-native";

import type { AccessibilityTextSize } from "@/shared/utils/accessibility";
import { Button } from "@/shared/components/buttons";
import { ErrorState, LoadingState, SuccessState } from "@/shared/components/feedback";
import { CheckboxRow, ChoiceCard } from "@/shared/components/forms";
import { Screen } from "@/shared/components/layout/Screen";
import { PageSection } from "@/shared/components/layout/PageSection";
import { Stack } from "@/shared/components/layout/Stack";
import { AppHeader } from "@/shared/components/navigation";
import { useT } from "@/shared/i18n/useT";

import { useAccessibilitySettingsStore } from "../accessibility";

const textSizeOptions: AccessibilityTextSize[] = ["default", "large", "extraLarge"];

function getTextSizeLabelKey(textSize: AccessibilityTextSize) {
  switch (textSize) {
    case "default":
      return "accessibility.textSize.defaultLabel";
    case "large":
      return "accessibility.textSize.largeLabel";
    case "extraLarge":
      return "accessibility.textSize.extraLargeLabel";
  }
}

function getTextSizeDescriptionKey(textSize: AccessibilityTextSize) {
  switch (textSize) {
    case "default":
      return "accessibility.textSize.defaultDescription";
    case "large":
      return "accessibility.textSize.largeDescription";
    case "extraLarge":
      return "accessibility.textSize.extraLargeDescription";
  }
}

export function AccessibilitySettingsScreen() {
  const t = useT();
  const { error, hydrated, resetSettings, setTextSize, settings, updateSettings } = useAccessibilitySettingsStore();

  if (!hydrated) {
    return (
      <Screen>
        <AppHeader
          showSafeArea={false}
          style={styles.header}
          titleKey="accessibility.screen.title"
          variant="transparent"
        />
        <LoadingState
          description={t("accessibility.screen.loadingDescription")}
          label={t("accessibility.screen.loadingTitle")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader
        showSafeArea={false}
        style={styles.header}
        subtitleKey="accessibility.screen.subtitle"
        titleKey="accessibility.screen.title"
        variant="transparent"
      />
      <Stack gap="lg">
        {error ? (
          <ErrorState
            description={t("accessibility.screen.errorDescription")}
            title={t("accessibility.screen.errorTitle")}
          />
        ) : (
          <SuccessState
            description={t("accessibility.screen.savedDescription")}
            title={t("accessibility.screen.savedTitle")}
          />
        )}

        <PageSection
          subtitle={t("accessibility.textSize.description")}
          title={t("accessibility.textSize.label")}
        >
          <Stack gap="sm">
            {textSizeOptions.map((textSize) => (
              <ChoiceCard
                key={textSize}
                description={t(getTextSizeDescriptionKey(textSize))}
                label={t(getTextSizeLabelKey(textSize))}
                onPress={() => {
                  void setTextSize(textSize);
                }}
                selected={settings.textSize === textSize}
              />
            ))}
          </Stack>
        </PageSection>

        <Stack gap="md">
          <CheckboxRow
            checked={settings.dyslexiaFriendlyFont}
            description={t("accessibility.toggles.dyslexiaFriendlyFont.description")}
            label={t("accessibility.toggles.dyslexiaFriendlyFont.label")}
            onPress={() => {
              void updateSettings({ dyslexiaFriendlyFont: !settings.dyslexiaFriendlyFont });
            }}
          />
          <CheckboxRow
            checked={settings.highContrast}
            description={t("accessibility.toggles.highContrast.description")}
            label={t("accessibility.toggles.highContrast.label")}
            onPress={() => {
              void updateSettings({ highContrast: !settings.highContrast });
            }}
          />
          <CheckboxRow
            checked={settings.reducedMotion}
            description={t("accessibility.toggles.reducedMotion.description")}
            label={t("accessibility.toggles.reducedMotion.label")}
            onPress={() => {
              void updateSettings({ reducedMotion: !settings.reducedMotion });
            }}
          />
          <CheckboxRow
            checked={settings.textToSpeech}
            description={t("accessibility.toggles.textToSpeech.description")}
            label={t("accessibility.toggles.textToSpeech.label")}
            onPress={() => {
              void updateSettings({ textToSpeech: !settings.textToSpeech });
            }}
          />
          <CheckboxRow
            checked={settings.speechToText}
            description={t("accessibility.toggles.speechToText.description")}
            label={t("accessibility.toggles.speechToText.label")}
            onPress={() => {
              void updateSettings({ speechToText: !settings.speechToText });
            }}
          />
          <CheckboxRow
            checked={settings.simplifiedUi}
            description={t("accessibility.toggles.simplifiedUi.description")}
            label={t("accessibility.toggles.simplifiedUi.label")}
            onPress={() => {
              void updateSettings({ simplifiedUi: !settings.simplifiedUi });
            }}
          />
        </Stack>

        <Button
          label={t("accessibility.screen.resetCta")}
          onPress={() => {
            void resetSettings();
          }}
          variant="secondary"
        />
      </Stack>
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
