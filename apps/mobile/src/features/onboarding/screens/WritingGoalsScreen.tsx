import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { WritingGoal } from "@writewise/shared";

import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { LoadingState } from "@/shared/components/feedback";

import { writingGoalCopyKeys } from "../constants";
import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import {
  MAX_WRITING_GOALS,
  onboardingErrorMessageKeys,
  onboardingValidationMessageKeys,
} from "../types";

const NAVY = "#083E8E";
const GREEN = "#087A58";
const SCREEN_BACKGROUND = "#F8FAFF";

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
  creative_writing: "#F59E0B",
  improve_grammar: NAVY,
  improve_handwriting: NAVY,
  write_paragraphs: NAVY,
} as const satisfies Record<(typeof visibleWritingGoals)[number], string>;

export function WritingGoalsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();
  const [showValidationError, setShowValidationError] = useState(false);

  const gradeBand = onboarding.progress.gradeLevel
    ? "middle"
    : "middle";

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
      progressActiveIndex={3}
      progressStepsCount={5}
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
              style={[
                styles.goalCard,
                selected ? styles.goalCardSelected : null,
                disabled ? styles.goalCardDisabled : null,
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
                <Text style={styles.goalTitle}>{t(writingGoalCopyKeys[goal].label)}</Text>
                <Text style={styles.goalDescription}>{t(writingGoalCopyKeys[goal].description)}</Text>
              </View>

              <View style={[styles.checkOuter, selected ? styles.checkOuterSelected : null]}>
                {selected ? <Ionicons name="checkmark" size={25} color="#FFFFFF" /> : null}
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
    borderColor: "#C7CBD7",
    borderRadius: 23,
    borderWidth: 3,
    height: 46,
    justifyContent: "center",
    marginLeft: 16,
    width: 46,
  },
  checkOuterSelected: {
    backgroundColor: GREEN,
    borderColor: "#A9BBC5",
  },
  goalCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#C5CBD8",
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
  goalCardSelected: {
    backgroundColor: "#EEF4FF",
    borderColor: NAVY,
    borderWidth: 2,
  },
  goalCopy: {
    flex: 1,
    gap: 8,
    marginLeft: 30,
  },
  goalDescription: {
    color: "#343949",
    fontSize: 24,
    lineHeight: 33,
  },
  goalIcon: {
    alignItems: "center",
    backgroundColor: "#D8E8FF",
    borderRadius: 44,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  goalTitle: {
    color: "#071426",
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
