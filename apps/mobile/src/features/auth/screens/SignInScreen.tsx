import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { onboardingPreviewTargets, prepareOnboardingPreview } from "@/features/onboarding";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Screen } from "@/shared/components/layout/Screen";
import { Stack } from "@/shared/components/layout/Stack";

import { AuthForm, DemoUserPanel } from "../components";
import { useAuth } from "../hooks/useAuth";
import type { SignInFormValues } from "../types";

export function SignInScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { clearError, errorCode, isBusy, signInWithDemoUser, signInWithEmail } = useAuth();

  return (
    <Screen
      subtitle={t("auth.signIn.subtitle")}
      title={t("auth.signIn.title")}
    >
      <Stack gap="lg">
        <AuthForm
          errorCode={errorCode}
          loading={isBusy}
          mode="signIn"
          onSubmit={async (input: SignInFormValues) => {
            await signInWithEmail(input);
          }}
        />
        <Button
          label={t("auth.signIn.switchCta")}
          onPress={() => {
            clearError();
            router.push(routes.authSignUp);
          }}
          variant="ghost"
        />
        <DemoUserPanel
          disabled={isBusy}
          onboardingPreviewOptions={onboardingPreviewTargets}
          onSelectDemoUser={async (demoUserId) => {
            await signInWithDemoUser(demoUserId);
          }}
          onSelectOnboardingPreview={async (targetId) => {
            clearError();
            const result = await signInWithDemoUser("student_needs_onboarding");
            const userId = result.session?.user.id;

            if (!userId) {
              return;
            }

            const route = await prepareOnboardingPreview(userId, targetId);
            router.replace(route);
          }}
        />
      </Stack>
    </Screen>
  );
}
