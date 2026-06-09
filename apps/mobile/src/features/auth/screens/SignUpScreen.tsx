import { useState } from "react";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { SuccessState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout/Screen";
import { Stack } from "@/shared/components/layout/Stack";

import { AuthForm } from "../components";
import { useAuth } from "../hooks/useAuth";
import type { SignUpInputValues } from "../types";

export function SignUpScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { clearError, errorCode, isBusy, signUpWithEmail } = useAuth();
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);

  return (
    <Screen
      subtitle={t("auth.signUp.subtitle")}
      title={t("auth.signUp.title")}
    >
      <Stack gap="lg">
        {requiresEmailConfirmation ? (
          <SuccessState
            actionLabel={t("auth.signUp.confirmationAction")}
            description={t("auth.signUp.confirmationDescription")}
            onActionPress={() => {
              clearError();
              router.replace(routes.authSignIn);
            }}
            title={t("auth.signUp.confirmationTitle")}
          />
        ) : (
          <AuthForm
            errorCode={errorCode}
            loading={isBusy}
            mode="signUp"
            onSubmit={async (input: SignUpInputValues) => {
              const result = await signUpWithEmail(input);
              setRequiresEmailConfirmation(Boolean(result.requiresEmailConfirmation));
            }}
          />
        )}

        <Button
          label={t("auth.signUp.switchCta")}
          onPress={() => {
            clearError();
            router.push(routes.authSignIn);
          }}
          variant="ghost"
        />
      </Stack>
    </Screen>
  );
}
