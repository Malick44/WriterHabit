import { useState } from "react";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { ChoiceCard } from "@/shared/components/forms";
import { LoadingState } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout/Stack";
import { useGlacierThemeStore } from "@/shared/theme/glacierThemeStore";

import { confidenceCopyKeys } from "../constants";
import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import {
  CONFIDENCE_OPTIONS,
  onboardingErrorMessageKeys,
  onboardingValidationMessageKeys,
} from "../types";

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function WritingConfidenceScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();
  const [showValidationError, setShowValidationError] = useState(false);
  const { primaryColor } = useGlacierThemeStore();

  const gradeBand = onboarding.progress.gradeLevel
    ? "middle"
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
    showValidationError && !onboarding.progress.confidenceLevel
      ? t(onboardingValidationMessageKeys.confidence_required)
      : null;
  const errorMessage = validationMessage ?? (onboarding.errorCode ? t(onboardingErrorMessageKeys[onboarding.errorCode]) : null);

  return (
    <OnboardingStepFrame
      errorMessage={errorMessage}
      gradeBand={gradeBand}
      onPrimaryPress={() => {
        if (!onboarding.progress.confidenceLevel) {
          setShowValidationError(true);
          return;
        }

        router.push(routes.onboardingDailyPracticeGoal);
      }}
      onSecondaryPress={() => {
        router.back();
      }}
      primaryLabel={t("common.continue")}
      secondaryLabel={t("common.back")}
      step="confidence"
      subtitle={t("onboarding.confidence.description")}
      title={t("onboarding.confidence.title")}
    >
      <Stack gap="sm">
        {CONFIDENCE_OPTIONS.map((confidenceLevel) => {
          const isSelected = onboarding.progress.confidenceLevel === confidenceLevel;
          return (
            <ChoiceCard
              accessibilityHint={t("onboarding.confidence.confidenceAccessibilityHint")}
              gradeBand={gradeBand}
              key={confidenceLevel}
              label={t(confidenceCopyKeys[confidenceLevel].label)}
              description={t(confidenceCopyKeys[confidenceLevel].description)}
              onPress={() => {
                setShowValidationError(false);
                void onboarding.setConfidenceLevel(confidenceLevel);
              }}
              selected={isSelected}
              style={{
                backgroundColor: isSelected
                  ? hexToRgba(primaryColor, 0.15)
                  : "rgba(255, 255, 255, 0.03)",
                borderColor: isSelected
                  ? primaryColor
                  : "rgba(255, 255, 255, 0.08)",
              }}
            />
          );
        })}
      </Stack>
    </OnboardingStepFrame>
  );
}
