import { Text } from "react-native";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { StatusState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout/Screen";
import { Stack } from "@/shared/components/layout/Stack";

import { useAuth } from "../hooks/useAuth";

export function WelcomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { clearError, isBusy, signInWithMockRole } = useAuth();

  return (
    <Screen
      subtitle={t("auth.welcome.description")}
      title={t("auth.welcome.title")}
    >
      <Stack gap="lg">
        <StatusState
          description={t("auth.welcome.positioningDescription")}
          title={t("auth.welcome.positioningTitle")}
          tone="info"
        />
        <Stack gap="sm">
          <Button
            disabled={isBusy}
            label={t("auth.welcome.signInCta")}
            onPress={() => {
              clearError();
              router.push(routes.authSignIn);
            }}
          />
          <Button
            disabled={isBusy}
            label={t("auth.welcome.signUpCta")}
            onPress={() => {
              clearError();
              router.push(routes.authSignUp);
            }}
            variant="secondary"
          />
        </Stack>
        <StatusState
          description={t("auth.welcome.demoDescription")}
          title={t("auth.welcome.demoTitle")}
          tone="neutral"
        />
        <Stack gap="sm">
          <Button
            disabled={isBusy}
            label={t("auth.welcome.demoStudentCta")}
            onPress={() => {
              void signInWithMockRole("student", { onboardingComplete: true });
            }}
            variant="secondary"
          />
          <Button
            disabled={isBusy}
            label={t("auth.welcome.demoStudentOnboardingCta")}
            onPress={() => {
              void signInWithMockRole("student", { onboardingComplete: false });
            }}
            variant="secondary"
          />
          <Button
            disabled={isBusy}
            label={t("auth.welcome.demoParentCta")}
            onPress={() => {
              void signInWithMockRole("parent", { onboardingComplete: true });
            }}
            variant="secondary"
          />
          <Button
            disabled={isBusy}
            label={t("auth.welcome.demoTeacherCta")}
            onPress={() => {
              void signInWithMockRole("teacher", { onboardingComplete: true });
            }}
            variant="secondary"
          />
        </Stack>
        <Text selectable>
          {t("auth.welcome.safetyNote")}
        </Text>
      </Stack>
    </Screen>
  );
}
