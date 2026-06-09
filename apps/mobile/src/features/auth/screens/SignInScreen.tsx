import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Screen } from "@/shared/components/layout/Screen";
import { Stack } from "@/shared/components/layout/Stack";

import { AuthForm } from "../components";
import { useAuth } from "../hooks/useAuth";
import type { SignInFormValues } from "../types";

export function SignInScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { clearError, errorCode, isBusy, signInWithEmail } = useAuth();

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
      </Stack>
    </Screen>
  );
}
