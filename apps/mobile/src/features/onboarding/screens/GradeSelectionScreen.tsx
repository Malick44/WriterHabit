import { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";

import { colors, typography, type GradeBand } from "@/design/tokens";
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

import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import { GRADE_GROUPS, onboardingErrorMessageKeys, onboardingValidationMessageKeys } from "../types";

export function GradeSelectionScreen() {
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

  if (!onboarding.hydrated) {
    return (
      <LoadingState
        description={t("onboarding.loading.description")}
        label={t("onboarding.loading.title")}
      />
    );
  }

  const validationMessage =
    showValidationError && !onboarding.progress.gradeLevel
      ? t(onboardingValidationMessageKeys.grade_required)
      : null;
  const errorMessage = validationMessage ?? (onboarding.errorCode ? t(onboardingErrorMessageKeys[onboarding.errorCode]) : null);

  return (
    <OnboardingStepFrame
      errorMessage={errorMessage}
      gradeBand={gradeBand}
      onPrimaryPress={() => {
        if (!onboarding.progress.gradeLevel) {
          setShowValidationError(true);
          return;
        }

        router.push(routes.onboardingWritingGoals);
      }}
      onSecondaryPress={() => {
        router.back();
      }}
      primaryLabel={t("common.continue")}
      secondaryLabel={t("common.back")}
      step="grade"
      subtitle={t("onboarding.gradeSelection.description")}
      title={t("onboarding.gradeSelection.title")}
    >
      <Stack gap="lg">
        {GRADE_GROUPS.map((group) => (
          <Stack gap="sm" key={group.band}>
            <Text
              accessibilityRole="header"
              selectable
              style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}
            >
              {t(group.titleKey)}
            </Text>
            <Text
              selectable
              style={[getAccessibleTextStyle(type.bodySmall, settings), { color: colors.text.secondary }]}
            >
              {t(group.descriptionKey)}
            </Text>
            <Stack gap="sm">
              {group.grades.map((grade) => (
                <ChoiceCard
                  accessibilityHint={t("onboarding.gradeSelection.gradeAccessibilityHint", { grade })}
                  gradeBand={group.band}
                  key={grade}
                  label={t("onboarding.gradeSelection.gradeLabel", { grade })}
                  onPress={() => {
                    setShowValidationError(false);
                    void onboarding.setGradeLevel(grade);
                  }}
                  selected={onboarding.progress.gradeLevel === grade}
                />
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </OnboardingStepFrame>
  );
}
