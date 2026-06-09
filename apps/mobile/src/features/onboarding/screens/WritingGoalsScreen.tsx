import { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";

import { colors, typography } from "@/design/tokens";
import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { ChoiceCard } from "@/shared/components/forms";
import { LoadingState } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout/Stack";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { writingGoalCopyKeys } from "../constants";
import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import {
  MAX_WRITING_GOALS,
  WRITING_GOAL_OPTIONS,
  onboardingErrorMessageKeys,
  onboardingValidationMessageKeys,
} from "../types";

export function WritingGoalsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const onboarding = useOnboarding();
  const [showValidationError, setShowValidationError] = useState(false);
  const gradeBand = onboarding.progress.gradeLevel
    ? typography.getGradeBandForGrade(onboarding.progress.gradeLevel)
    : "middle";
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
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
        if (selectedGoalCount === 0) {
          setShowValidationError(true);
          return;
        }

        router.push(routes.onboardingWritingConfidence);
      }}
      onSecondaryPress={() => {
        router.back();
      }}
      primaryLabel={t("common.continue")}
      secondaryLabel={t("common.back")}
      step="goals"
      subtitle={t("onboarding.writingGoals.description")}
      title={t("onboarding.writingGoals.title")}
    >
      <Stack gap="md">
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
        >
          {t("onboarding.writingGoals.selectionCount", {
            count: selectedGoalCount,
            max: MAX_WRITING_GOALS,
          })}
        </Text>
        <Stack gap="sm">
          {WRITING_GOAL_OPTIONS.map((goal) => {
            const selected = onboarding.progress.writingGoals.includes(goal);

            return (
              <ChoiceCard
                accessibilityHint={t("onboarding.writingGoals.goalAccessibilityHint")}
                disabled={!selected && hasReachedGoalLimit}
                gradeBand={gradeBand}
                key={goal}
                label={t(writingGoalCopyKeys[goal].label)}
                description={t(writingGoalCopyKeys[goal].description)}
                onPress={() => {
                  setShowValidationError(false);
                  void onboarding.toggleWritingGoal(goal);
                }}
                selected={selected}
                style={!selected && hasReachedGoalLimit ? { borderColor: colors.border.default } : null}
              />
            );
          })}
        </Stack>
      </Stack>
    </OnboardingStepFrame>
  );
}
