import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { ChoiceCard } from "@/shared/components/forms";
import { LoadingState } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout/Stack";

import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import { onboardingErrorMessageKeys } from "../types";

export function RoleSelectionScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();

  if (!onboarding.hydrated) {
    return (
      <LoadingState
        description={t("onboarding.loading.description")}
        label={t("onboarding.loading.title")}
      />
    );
  }

  const errorMessage = onboarding.errorCode ? t(onboardingErrorMessageKeys[onboarding.errorCode]) : null;

  return (
    <OnboardingStepFrame
      errorMessage={errorMessage}
      onPrimaryPress={() => {
        router.push(routes.onboardingGradeSelection);
      }}
      onSecondaryPress={() => {
        void onboarding.signOut();
      }}
      primaryDisabled={!onboarding.progress.role}
      primaryLabel={t("common.continue")}
      secondaryLabel={t("navigation.onboarding.signOutCta")}
      step="role"
      subtitle={t("onboarding.roleSelection.description")}
      title={t("onboarding.roleSelection.title")}
    >
      <Stack gap="md">
        <ChoiceCard
          accessibilityHint={t("onboarding.roleSelection.studentAccessibilityHint")}
          description={t("onboarding.roleSelection.studentDescription")}
          label={t("onboarding.roleSelection.studentLabel")}
          onPress={() => {
            void onboarding.setRole("student");
          }}
          selected={onboarding.progress.role === "student"}
        />
      </Stack>
    </OnboardingStepFrame>
  );
}
