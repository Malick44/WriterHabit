import { useState } from "react";
import { useRouter } from "expo-router";

import { typography } from "@/design/tokens";
import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { ChoiceCard } from "@/shared/components/forms";
import { LoadingState } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout/Stack";

import { dailyPracticeCopyKeys } from "../constants";
import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import {
  DAILY_PRACTICE_OPTIONS,
  onboardingErrorMessageKeys,
  onboardingValidationMessageKeys,
} from "../types";

export function DailyPracticeGoalScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();
  const [showValidationError, setShowValidationError] = useState(false);
  const gradeBand = onboarding.progress.gradeLevel
    ? typography.getGradeBandForGrade(onboarding.progress.gradeLevel)
    : "middle";

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
  const errorMessage = validationMessage ?? (onboarding.errorCode ? t(onboardingErrorMessageKeys[onboarding.errorCode]) : null);

  return (
    <OnboardingStepFrame
      errorMessage={errorMessage}
      gradeBand={gradeBand}
      onPrimaryPress={() => {
        if (!onboarding.progress.dailyPracticeMinutes) {
          setShowValidationError(true);
          return;
        }

        router.push(routes.onboardingPlanSummary);
      }}
      onSecondaryPress={() => {
        router.back();
      }}
      primaryLabel={t("common.continue")}
      secondaryLabel={t("common.back")}
      step="dailyPractice"
      subtitle={t("onboarding.dailyPracticeGoal.description")}
      title={t("onboarding.dailyPracticeGoal.title")}
    >
      <Stack gap="sm">
        {DAILY_PRACTICE_OPTIONS.map((minutes) => (
          <ChoiceCard
            accessibilityHint={t("onboarding.dailyPracticeGoal.dailyGoalAccessibilityHint")}
            gradeBand={gradeBand}
            key={minutes}
            label={t(dailyPracticeCopyKeys[minutes].label)}
            description={t(dailyPracticeCopyKeys[minutes].description)}
            onPress={() => {
              setShowValidationError(false);
              void onboarding.setDailyPracticeMinutes(minutes);
            }}
            selected={onboarding.progress.dailyPracticeMinutes === minutes}
          />
        ))}
      </Stack>
    </OnboardingStepFrame>
  );
}
