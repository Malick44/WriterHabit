import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { getGradeBandForGrade, palette, radius, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { LoadingState, ProgressBar } from "@/shared/components/feedback";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import {
  type ThemeTuningColorPreset,
  type ThemeTuningScreenConfig,
  useScreenThemeValues,
  useThemeTuningScreen,
} from "@/shared/theme";

import { OnboardingStepFrame } from "../components";
import { dailyPracticeCopyKeys } from "../constants";
import { useOnboarding } from "../hooks/useOnboarding";
import {
  type DailyPracticeMinutes,
  onboardingErrorMessageKeys,
  onboardingValidationMessageKeys,
} from "../types";

type DailyPracticeThemeValues = {
  accentColor: string;
  bodyScale: number;
  iconColor: string;
  iconScale: number;
  iconSurfaceColor: string;
  mutedTextColor: string;
  optionCardRadius: number;
  optionGap: number;
  optionSurfaceColor: string;
  progressTrackColor: string;
  screenBackgroundColor: string;
  selectedOptionColor: string;
  summarySurfaceColor: string;
  textColor: string;
  titleScale: number;
};

const DAILY_PRACTICE_SCREEN_ID = "onboarding.dailyPracticeGoal";

const DAILY_PRACTICE_THEME_DEFAULTS: DailyPracticeThemeValues = {
  accentColor: palette.blue[700],
  bodyScale: 1,
  iconColor: palette.blue[700],
  iconScale: 1,
  iconSurfaceColor: palette.blue[100],
  mutedTextColor: palette.slate[600],
  optionCardRadius: 18,
  optionGap: 12,
  optionSurfaceColor: palette.white,
  progressTrackColor: palette.slate[200],
  screenBackgroundColor: palette.paper[50],
  selectedOptionColor: palette.blue[50],
  summarySurfaceColor: palette.white,
  textColor: palette.slate[900],
  titleScale: 1,
};

const DAILY_PRACTICE_SCREEN_PRESETS = [
  { labelKey: "themeTuner.presets.dailyPractice.paper", value: "#F4F8FF" },
  { labelKey: "themeTuner.presets.dailyPractice.sky", value: "#EAF4FF" },
  { labelKey: "themeTuner.presets.dailyPractice.mint", value: "#ECFDF5" },
  { labelKey: "themeTuner.presets.dailyPractice.night", value: "#101827" },
] satisfies readonly ThemeTuningColorPreset[];

const DAILY_PRACTICE_ACCENT_PRESETS = [
  { labelKey: "themeTuner.presets.primary.iceBlue", value: "#0EA5E9" },
  { labelKey: "themeTuner.presets.primary.emerald", value: "#0F766E" },
  { labelKey: "themeTuner.presets.primary.cyberPurple", value: "#7C3AED" },
  { labelKey: "themeTuner.presets.primary.ruby", value: "#BE123C" },
] satisfies readonly ThemeTuningColorPreset[];

const DAILY_PRACTICE_SURFACE_PRESETS = [
  { labelKey: "themeTuner.presets.dailyPractice.white", value: "#FFFFFF" },
  { labelKey: "themeTuner.presets.dailyPractice.softBlue", value: "#EAF2FF" },
  { labelKey: "themeTuner.presets.dailyPractice.warm", value: "#FFF7ED" },
  { labelKey: "themeTuner.presets.dailyPractice.slate", value: "#1E293B" },
] satisfies readonly ThemeTuningColorPreset[];

const DAILY_PRACTICE_TEXT_PRESETS = [
  { labelKey: "themeTuner.presets.dailyPractice.ink", value: "#0F172A" },
  { labelKey: "themeTuner.presets.dailyPractice.slateText", value: "#334155" },
  { labelKey: "themeTuner.presets.dailyPractice.whiteText", value: "#F8FAFC" },
] satisfies readonly ThemeTuningColorPreset[];

const DAILY_PRACTICE_MUTED_TEXT_PRESETS = [
  { labelKey: "themeTuner.presets.dailyPractice.slateText", value: "#475569" },
  { labelKey: "themeTuner.presets.dailyPractice.blueText", value: "#3B5B8F" },
  { labelKey: "themeTuner.presets.dailyPractice.softWhiteText", value: "#CBD5E1" },
] satisfies readonly ThemeTuningColorPreset[];

const DAILY_PRACTICE_ICON_SURFACE_PRESETS = [
  { labelKey: "themeTuner.presets.dailyPractice.softBlue", value: "#DBEAFE" },
  { labelKey: "themeTuner.presets.dailyPractice.mint", value: "#CCFBF1" },
  { labelKey: "themeTuner.presets.dailyPractice.warm", value: "#FED7AA" },
  { labelKey: "themeTuner.presets.dailyPractice.slate", value: "#334155" },
] satisfies readonly ThemeTuningColorPreset[];

const DAILY_PRACTICE_TUNING_CONFIG = {
  controls: [
    {
      id: "daily-screen-background",
      kind: "color",
      labelKey: "themeTuner.controls.dailyPracticeGoal.screenBackground",
      param: "screenBackgroundColor",
      presets: DAILY_PRACTICE_SCREEN_PRESETS,
      scope: "screen",
    },
    {
      id: "daily-accent",
      kind: "color",
      labelKey: "themeTuner.controls.dailyPracticeGoal.accent",
      param: "accentColor",
      presets: DAILY_PRACTICE_ACCENT_PRESETS,
      scope: "screen",
    },
    {
      id: "daily-summary-surface",
      kind: "color",
      labelKey: "themeTuner.controls.dailyPracticeGoal.summarySurface",
      param: "summarySurfaceColor",
      presets: DAILY_PRACTICE_SURFACE_PRESETS,
      scope: "component",
    },
    {
      id: "daily-option-surface",
      kind: "color",
      labelKey: "themeTuner.controls.dailyPracticeGoal.optionSurface",
      param: "optionSurfaceColor",
      presets: DAILY_PRACTICE_SURFACE_PRESETS,
      scope: "component",
    },
    {
      id: "daily-selected-option",
      kind: "color",
      labelKey: "themeTuner.controls.dailyPracticeGoal.selectedOption",
      param: "selectedOptionColor",
      presets: DAILY_PRACTICE_SURFACE_PRESETS,
      scope: "component",
    },
    {
      id: "daily-progress-track",
      kind: "color",
      labelKey: "themeTuner.controls.dailyPracticeGoal.progressTrack",
      param: "progressTrackColor",
      presets: DAILY_PRACTICE_SCREEN_PRESETS,
      scope: "component",
    },
    {
      id: "daily-option-radius",
      kind: "range",
      labelKey: "themeTuner.controls.dailyPracticeGoal.optionRadius",
      max: 30,
      min: 8,
      param: "optionCardRadius",
      scope: "component",
      step: 2,
      valueFormat: "number",
    },
    {
      id: "daily-option-gap",
      kind: "range",
      labelKey: "themeTuner.controls.dailyPracticeGoal.optionGap",
      max: 24,
      min: 6,
      param: "optionGap",
      scope: "component",
      step: 2,
      valueFormat: "number",
    },
    {
      id: "daily-text-color",
      kind: "color",
      labelKey: "themeTuner.controls.dailyPracticeGoal.textColor",
      param: "textColor",
      presets: DAILY_PRACTICE_TEXT_PRESETS,
      scope: "text",
    },
    {
      id: "daily-muted-text-color",
      kind: "color",
      labelKey: "themeTuner.controls.dailyPracticeGoal.mutedTextColor",
      param: "mutedTextColor",
      presets: DAILY_PRACTICE_MUTED_TEXT_PRESETS,
      scope: "text",
    },
    {
      id: "daily-title-scale",
      kind: "range",
      labelKey: "themeTuner.controls.dailyPracticeGoal.titleScale",
      max: 1.35,
      min: 0.8,
      param: "titleScale",
      scope: "text",
      step: 0.05,
      valueFormat: "scale",
    },
    {
      id: "daily-body-scale",
      kind: "range",
      labelKey: "themeTuner.controls.dailyPracticeGoal.bodyScale",
      max: 1.35,
      min: 0.8,
      param: "bodyScale",
      scope: "text",
      step: 0.05,
      valueFormat: "scale",
    },
    {
      id: "daily-icon-color",
      kind: "color",
      labelKey: "themeTuner.controls.dailyPracticeGoal.iconColor",
      param: "iconColor",
      presets: DAILY_PRACTICE_ACCENT_PRESETS,
      scope: "icon",
    },
    {
      id: "daily-icon-surface",
      kind: "color",
      labelKey: "themeTuner.controls.dailyPracticeGoal.iconSurface",
      param: "iconSurfaceColor",
      presets: DAILY_PRACTICE_ICON_SURFACE_PRESETS,
      scope: "icon",
    },
    {
      id: "daily-icon-scale",
      kind: "range",
      labelKey: "themeTuner.controls.dailyPracticeGoal.iconScale",
      max: 1.45,
      min: 0.75,
      param: "iconScale",
      scope: "icon",
      step: 0.05,
      valueFormat: "scale",
    },
  ],
  defaultValues: { ...DAILY_PRACTICE_THEME_DEFAULTS },
  descriptionKey: "themeTuner.screens.dailyPracticeGoal.description",
  id: DAILY_PRACTICE_SCREEN_ID,
  routePattern: "/(onboarding)/daily-practice-goal",
  titleKey: "themeTuner.screens.dailyPracticeGoal.title",
} satisfies ThemeTuningScreenConfig;

const visibleDailyPracticeOptions = [5, 10, 15, 20] as const satisfies readonly DailyPracticeMinutes[];

const iconByMinutes: Record<DailyPracticeMinutes, keyof typeof Ionicons.glyphMap> = {
  5: "flash-outline",
  10: "leaf-outline",
  15: "trail-sign-outline",
  20: "trophy-outline",
  30: "time-outline",
};

function getReadableControlColor(hexColor: string) {
  const normalized = hexColor.replace("#", "");

  if (normalized.length !== 6) {
    return palette.slate[900];
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.56 ? palette.slate[900] : palette.white;
}

export function DailyPracticeGoalScreen() {
  useThemeTuningScreen(DAILY_PRACTICE_TUNING_CONFIG);

  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();
  const theme = useScreenThemeValues<DailyPracticeThemeValues>(
    DAILY_PRACTICE_SCREEN_ID,
    DAILY_PRACTICE_THEME_DEFAULTS,
  );
  const [showValidationError, setShowValidationError] = useState(false);
  const { settings } = useAccessibilityContext();

  const gradeBand = getGradeBandForGrade(onboarding.progress.gradeLevel ?? 7);
  const type = typography.gradeBands[gradeBand];
  const selectedMinutes = onboarding.progress.dailyPracticeMinutes ?? 10;
  const selectedOption = dailyPracticeCopyKeys[selectedMinutes];
  const visibleSelectedOptionIndex = visibleDailyPracticeOptions.findIndex((minutes) => minutes === selectedMinutes);
  const selectedOptionIndex = Math.max(visibleSelectedOptionIndex, 0);
  const selectedProgressValue = (selectedOptionIndex + 1) / visibleDailyPracticeOptions.length;
  const readableAccentTextColor = getReadableControlColor(theme.accentColor);

  if (!onboarding.hydrated) {
    return (
      <LoadingState
        description={t("onboarding.loading.description")}
        label={t("onboarding.loading.title")}
      />
    );
  }

  const validationMessage =
    showValidationError && !onboarding.progress.dailyPracticeMinutes
      ? t(onboardingValidationMessageKeys.daily_practice_required)
      : null;

  const errorMessage =
    validationMessage ??
    (onboarding.errorCode ? t(onboardingErrorMessageKeys[onboarding.errorCode]) : null);

  return (
    <OnboardingStepFrame
      backIconColor={theme.textColor}
      backgroundColor={theme.screenBackgroundColor}
      contentStyle={styles.frameContent}
      errorMessage={errorMessage}
      footerStyle={{ backgroundColor: theme.screenBackgroundColor }}
      gradeBand={gradeBand}
      onPrimaryPress={() => {
        void (async () => {
          if (!selectedMinutes) {
            setShowValidationError(true);
            return;
          }

          await onboarding.setDailyPracticeMinutes(selectedMinutes);
          router.push(routes.onboardingPlanSummary);
        })();
      }}
      onSecondaryPress={() => router.back()}
      primaryButtonStyle={{
        backgroundColor: theme.accentColor,
        borderColor: theme.accentColor,
        borderRadius: radius.full,
        minHeight: 62,
      }}
      primaryLabel={t("common.continue")}
      progressActiveColor={theme.accentColor}
      progressInactiveColor={theme.progressTrackColor}
      secondaryLabel={t("common.back")}
      showProgressDots
      step="dailyPractice"
      subtitle={t("onboarding.dailyPracticeGoal.description")}
      subtitleStyle={[
        styles.subtitle,
        {
          color: theme.mutedTextColor,
          fontSize: type.body.fontSize * theme.bodyScale,
          lineHeight: type.body.lineHeight * theme.bodyScale,
        },
      ]}
      title={t("onboarding.dailyPracticeGoal.title")}
      titleStyle={[
        styles.title,
        {
          color: theme.textColor,
          fontSize: type.heading.fontSize * theme.titleScale,
          lineHeight: type.heading.lineHeight * theme.titleScale,
        },
      ]}
    >
      <View style={styles.contentStack}>
        <View
          accessibilityLabel={t("onboarding.dailyPracticeGoal.selectedSummaryAccessibility", {
            minutes: selectedMinutes,
          })}
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.summarySurfaceColor,
              borderColor: `${theme.accentColor}2E`,
              borderRadius: theme.optionCardRadius + 6,
            },
          ]}
        >
          <View style={styles.summaryHeader}>
            <View
              style={[
                styles.summaryIcon,
                {
                  backgroundColor: theme.iconSurfaceColor,
                },
              ]}
            >
              <Ionicons
                color={theme.iconColor}
                name={iconByMinutes[selectedMinutes]}
                size={34 * theme.iconScale}
              />
            </View>

            <View style={styles.summaryCopy}>
              <Text
                style={getAccessibleTextStyle(
                  {
                    ...styles.eyebrow,
                    color: theme.accentColor,
                    fontSize: type.caption.fontSize * theme.bodyScale,
                    lineHeight: type.caption.lineHeight * theme.bodyScale,
                  },
                  settings,
                )}
              >
                {t("onboarding.dailyPracticeGoal.summaryEyebrow")}
              </Text>
              <Text
                accessibilityRole="header"
                style={getAccessibleTextStyle(
                  {
                    ...styles.summaryTitle,
                    color: theme.textColor,
                    fontSize: type.title.fontSize * theme.titleScale,
                    lineHeight: type.title.lineHeight * theme.titleScale,
                  },
                  settings,
                )}
              >
                {t("onboarding.dailyPracticeGoal.summaryTitle", { minutes: selectedMinutes })}
              </Text>
            </View>
          </View>

          <Text
            style={getAccessibleTextStyle(
              {
                ...styles.summaryDescription,
                color: theme.mutedTextColor,
                fontSize: type.bodySmall.fontSize * theme.bodyScale,
                lineHeight: type.bodySmall.lineHeight * theme.bodyScale,
              },
              settings,
            )}
          >
            {t(selectedOption.description)}
          </Text>

          <ProgressBar
            gradeBand={gradeBand}
            label={t("onboarding.dailyPracticeGoal.progressLabel")}
            progressColor={theme.accentColor}
            value={selectedProgressValue}
          />
        </View>

        <View style={styles.optionsHeader}>
          <Text
            style={getAccessibleTextStyle(
              {
                ...styles.optionsTitle,
                color: theme.textColor,
                fontSize: type.label.fontSize * theme.bodyScale,
                lineHeight: type.label.lineHeight * theme.bodyScale,
              },
              settings,
            )}
          >
            {t("onboarding.dailyPracticeGoal.choosePaceTitle")}
          </Text>
          <Text
            style={getAccessibleTextStyle(
              {
                ...styles.flexibilityNote,
                color: theme.mutedTextColor,
                fontSize: type.caption.fontSize * theme.bodyScale,
                lineHeight: type.caption.lineHeight * theme.bodyScale,
              },
              settings,
            )}
          >
            {t("onboarding.dailyPracticeGoal.flexibilityNote")}
          </Text>
        </View>

        <View style={[styles.options, { gap: theme.optionGap }]}>
          {visibleDailyPracticeOptions.map((minutes) => {
            const isSelected = selectedMinutes === minutes;
            const iconName = iconByMinutes[minutes];

            return (
              <Pressable
                accessibilityHint={t("onboarding.dailyPracticeGoal.dailyGoalAccessibilityHint")}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                key={minutes}
                onPress={() => {
                  setShowValidationError(false);
                  void onboarding.setDailyPracticeMinutes(minutes);
                }}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    backgroundColor: isSelected ? theme.selectedOptionColor : theme.optionSurfaceColor,
                    borderColor: isSelected ? theme.accentColor : `${theme.accentColor}24`,
                    borderRadius: theme.optionCardRadius,
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    {
                      backgroundColor: theme.iconSurfaceColor,
                    },
                  ]}
                >
                  <Ionicons color={theme.iconColor} name={iconName} size={24 * theme.iconScale} />
                </View>

                <View style={styles.optionCopy}>
                  <View style={styles.optionTitleRow}>
                    <Text
                      style={getAccessibleTextStyle(
                        {
                          ...styles.optionTitle,
                          color: theme.textColor,
                          fontSize: type.bodyStrong.fontSize * theme.bodyScale,
                          lineHeight: type.bodyStrong.lineHeight * theme.bodyScale,
                        },
                        settings,
                      )}
                    >
                      {t(dailyPracticeCopyKeys[minutes].label)}
                    </Text>
                  </View>
                  <Text
                    style={getAccessibleTextStyle(
                      {
                        ...styles.optionDescription,
                        color: theme.mutedTextColor,
                        fontSize: type.bodySmall.fontSize * theme.bodyScale,
                        lineHeight: type.bodySmall.lineHeight * theme.bodyScale,
                      },
                      settings,
                    )}
                  >
                    {t(dailyPracticeCopyKeys[minutes].description)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    {
                      backgroundColor: isSelected ? theme.accentColor : "transparent",
                      borderColor: isSelected ? theme.accentColor : `${theme.accentColor}66`,
                    },
                  ]}
                >
                  {isSelected ? (
                    <Ionicons name="checkmark" size={16} color={readableAccentTextColor} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </OnboardingStepFrame>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 14,
  },
  contentStack: {
    gap: spacing.xl,
  },
  eyebrow: {
    fontWeight: "800",
    textTransform: "uppercase",
  },
  flexibilityNote: {
    flexShrink: 1,
  },
  frameContent: {
    gap: 0,
  },
  optionCard: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 68,
    paddingHorizontal: spacing.xs,
    paddingVertical: 8,
    shadowColor: palette.slate[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  optionCopy: {
    flex: 1,
    gap: 1,
    marginLeft: spacing.xs,
  },
  optionDescription: {
    fontWeight: "500",
  },
  optionIcon: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  optionTitle: {
    flexShrink: 1,
    fontWeight: "800",
  },
  optionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  options: {
    gap: spacing.md,
  },
  optionsHeader: {
    gap: spacing.xs,
  },
  optionsTitle: {
    fontWeight: "800",
  },
  radioOuter: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    marginLeft: 6,
    width: 28,
  },
  subtitle: {
    fontWeight: "500",
  },
  summaryCard: {
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: palette.slate[900],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  summaryCopy: {
    flex: 1,
    gap: 2,
  },
  summaryDescription: {
    fontWeight: "500",
  },
  summaryHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  summaryIcon: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  summaryTitle: {
    fontWeight: "800",
  },
  title: {
    fontWeight: "800",
  },
});
