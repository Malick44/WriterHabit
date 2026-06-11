import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { WritingGoal } from "@WriterHabit/shared";

import { routes } from "@/core/navigation/routeNames";
import { colors, getGradeBandForGrade, palette } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { LoadingState } from "@/shared/components/feedback";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { writingGoalCopyKeys } from "../constants";
import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import {
  MAX_WRITING_GOALS,
  onboardingErrorMessageKeys,
  onboardingValidationMessageKeys,
} from "../types";

const NAVY = colors.onboarding.navy;
const GREEN = colors.onboarding.success;
const SCREEN_BACKGROUND = colors.onboarding.screenBackground;

const visibleWritingGoals = [
  "improve_grammar",
  "write_paragraphs",
  "creative_writing",
  "improve_handwriting",
] as const satisfies readonly WritingGoal[];

const goalIconByGoal = {
  creative_writing: "bulb-outline",
  improve_grammar: "text",
  improve_handwriting: "pencil",
  write_paragraphs: "list",
} as const satisfies Record<(typeof visibleWritingGoals)[number], keyof typeof Ionicons.glyphMap>;

const goalIconColorByGoal = {
  creative_writing: palette.amber[500],
  improve_grammar: NAVY,
  improve_handwriting: NAVY,
  write_paragraphs: NAVY,
} as const satisfies Record<(typeof visibleWritingGoals)[number], string>;

export function WritingGoalsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();
  const [showValidationError, setShowValidationError] = useState(false);
  const { settings } = useAccessibilityContext();

  const gradeBand = getGradeBandForGrade(onboarding.progress.gradeLevel ?? 7);

  const selectedGoalCount = onboarding.progress.writingGoals.length;
  const hasReachedGoalLimit = selectedGoalCount >= MAX_WRITING_GOALS;

  if (!onboarding.hydrated) {
    return (
      <LoadingState
        description={t("onboarding.loading.description")}
        label={t("onboarding.loading.title")}
      />
    );
  }

  const validationMessage =
    showValidationError && selectedGoalCount === 0
      ? t(onboardingValidationMessageKeys.goals_required)
      : null;
  const errorMessage = validationMessage ?? (onboarding.errorCode ? t(onboardingErrorMessageKeys[onboarding.errorCode]) : null);

  return (
    <OnboardingStepFrame
      errorMessage={errorMessage}
      gradeBand={gradeBand}
      onPrimaryPress={() => {
        void (async () => {
          if (selectedGoalCount === 0) {
            setShowValidationError(true);
            return;
          }

          await onboarding.setConfidenceLevel(onboarding.progress.confidenceLevel ?? "steady");
          router.push(routes.onboardingDailyPracticeGoal);
        })();
      }}
      onSecondaryPress={() => {
        router.back();
      }}
      backgroundColor={SCREEN_BACKGROUND}
      footerStyle={{ backgroundColor: SCREEN_BACKGROUND }}
      headerAlign="center"
      primaryLabel={t("common.continue")}
      secondaryLabel={t("common.back")}
      showProgressDots
      step="goals"
      subtitle={t("onboarding.writingGoals.description")}
      title={t("onboarding.writingGoals.title")}
      titleStyle={styles.title}
    >
      <View style={styles.goals}>
        {visibleWritingGoals.map((goal) => {
          const selected = onboarding.progress.writingGoals.includes(goal);
          const disabled = !selected && hasReachedGoalLimit;

          return (
            <Pressable
              accessibilityHint={t("onboarding.writingGoals.goalAccessibilityHint")}
              accessibilityLabel={t(writingGoalCopyKeys[goal].label)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              key={goal}
              onPress={() => {
                setShowValidationError(false);
                void onboarding.toggleWritingGoal(goal);
              }}
              style={({ pressed }) => [
                styles.goalCard,
                selected ? styles.goalCardSelected : null,
                disabled ? styles.goalCardDisabled : null,
                pressed && !disabled ? styles.goalCardPressed : null,
              ]}
            >
              <View style={styles.goalIcon}>
                <Ionicons
                  name={goalIconByGoal[goal]}
                  size={34}
                  color={goalIconColorByGoal[goal]}
                />
              </View>

              <View style={styles.goalCopy}>
                <Text style={getAccessibleTextStyle(styles.goalTitle, settings)}>
                  {t(writingGoalCopyKeys[goal].label)}
                </Text>
                <Text style={getAccessibleTextStyle(styles.goalDescription, settings)}>
                  {t(writingGoalCopyKeys[goal].description)}
                </Text>
              </View>

              <View style={[styles.checkOuter, selected ? styles.checkOuterSelected : null]}>
                {selected ? <Ionicons name="checkmark" size={25} color={palette.white} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingStepFrame>
  );
}

const styles = StyleSheet.create({
  checkOuter: {
    alignItems: "center",
    borderColor: colors.onboarding.checkBorder,
    borderRadius: 23,
    borderWidth: 3,
    height: 46,
    justifyContent: "center",
    marginLeft: 16,
    width: 46,
  },
  checkOuterSelected: {
    backgroundColor: GREEN,
    borderColor: colors.onboarding.checkBorderSelected,
  },
  goalCard: {
    alignItems: "center",
    backgroundColor: colors.onboarding.surface,
    borderColor: colors.onboarding.cardBorder,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: "row",
    minHeight: 150,
    paddingHorizontal: 30,
    paddingVertical: 26,
  },
  goalCardDisabled: {
    opacity: 0.42,
  },
  goalCardPressed: {
    opacity: 0.78,
  },
  goalCardSelected: {
    backgroundColor: colors.onboarding.selectedBackground,
    borderColor: NAVY,
    borderWidth: 2,
  },
  goalCopy: {
    flex: 1,
    gap: 8,
    marginLeft: 30,
  },
  goalDescription: {
    color: colors.onboarding.subtitle,
    fontSize: 24,
    lineHeight: 33,
  },
  goalIcon: {
    alignItems: "center",
    backgroundColor: colors.onboarding.iconBubble,
    borderRadius: 44,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  goalTitle: {
    color: colors.onboarding.ink,
    fontSize: 33,
    fontWeight: "800",
    lineHeight: 42,
  },
  goals: {
    gap: 28,
  },
  title: {
    fontSize: 36,
    lineHeight: 44,
  },
});
