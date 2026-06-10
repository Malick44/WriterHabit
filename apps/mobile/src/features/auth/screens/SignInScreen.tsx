import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { useI18n, type TranslationKey } from "@/i18n";
import { StatusState } from "@/shared/components/feedback";
import { useTopAlert } from "@/shared/components/feedback/top-alert";

import {
  AuthFooterLink,
  AuthScreenFrame,
  AuthSeparator,
  AuthSocialButton,
  AuthSubmitButton,
  AuthTextField,
  authScreenStyles,
  type AuthSocialProvider,
} from "../components";
import { useAuth } from "../hooks/useAuth";
import { authErrorMessageKeys, loginLinkInputSchema } from "../types";

function getValidationMessageKey(message: string | undefined): TranslationKey {
  return message?.startsWith("auth.") ? (message as TranslationKey) : "auth.errors.validation";
}

export function SignInScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const topAlert = useTopAlert();
  const { clearError, errorCode, isBusy, signInWithEmailLink } = useAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [loginLinkSent, setLoginLinkSent] = useState(false);

  const showSocialUnavailableAlert = (provider: AuthSocialProvider) => {
    topAlert.show({
      descriptionKey:
        provider === "google"
          ? "auth.signIn.googleUnavailableDescription"
          : "auth.signIn.appleUnavailableDescription",
      iconName: provider === "google" ? "logo-google" : "logo-apple",
      titleKey: "auth.signIn.socialUnavailableTitle",
      type: "info",
    });
  };

  const handleSubmit = async () => {
    const result = loginLinkInputSchema.safeParse({ email });

    if (!result.success) {
      setEmailError(t(getValidationMessageKey(result.error.issues[0]?.message)));
      return;
    }

    setEmailError(undefined);
    const actionResult = await signInWithEmailLink(result.data);

    if (!actionResult.errorCode) {
      setLoginLinkSent(true);
    }
  };

  return (
    <AuthScreenFrame
      heroImageAccessibilityLabel={t("auth.signIn.heroImageAccessibility")}
      supportBadgeAccessibilityLabel={t("auth.signIn.helpBadgeAccessibility")}
      supportBadgeLabel={t("auth.signIn.helpBadge")}
      subtitle={t("auth.signIn.subtitle")}
      testID="sign-in-screen"
      title={t("auth.signIn.title")}
      footer={
        <AuthFooterLink
          linkLabel={t("auth.signIn.switchCta")}
          onPress={() => {
            clearError();
            router.push(routes.authSignUp);
          }}
          prompt={t("auth.signIn.noAccountPrompt")}
        />
      }
    >
      {errorCode ? (
        <StatusState
          description={t(authErrorMessageKeys[errorCode])}
          title={t("auth.errors.title")}
          tone="error"
        />
      ) : null}

      <View style={authScreenStyles.socialStack}>
        <AuthSocialButton
          disabled={isBusy}
          label={t("auth.signIn.googleCta")}
          onPress={() => {
            showSocialUnavailableAlert("google");
          }}
          provider="google"
        />
        <AuthSocialButton
          disabled={isBusy}
          label={t("auth.signIn.appleCta")}
          onPress={() => {
            showSocialUnavailableAlert("apple");
          }}
          provider="apple"
        />
      </View>

      <AuthSeparator label={t("auth.signIn.emailSeparator")} />

      <View style={authScreenStyles.form}>
        <AuthTextField
          accessibilityLabel={t("auth.fields.emailAccessibility")}
          autoCapitalize="none"
          autoComplete="email"
          editable={!isBusy && !loginLinkSent}
          error={emailError}
          iconName="mail-outline"
          keyboardType="email-address"
          label={t("auth.fields.emailLabel")}
          onChangeText={(value) => {
            setEmail(value);
            setEmailError(undefined);
            setLoginLinkSent(false);
            clearError();
          }}
          onSubmitEditing={() => {
            void handleSubmit();
          }}
          placeholder={t("auth.fields.emailPlaceholder")}
          returnKeyType="send"
          textContentType="emailAddress"
          value={email}
        />

        <View style={authScreenStyles.submitStack}>
          <AuthSubmitButton
            accessibilityLabel={loginLinkSent ? t("auth.signIn.linkSentCta") : t("auth.signIn.submitCta")}
            disabled={isBusy || loginLinkSent}
            iconName={loginLinkSent ? "checkmark-circle" : "sparkles"}
            label={loginLinkSent ? t("auth.signIn.linkSentCta") : t("auth.signIn.submitCta")}
            onPress={() => {
              void handleSubmit();
            }}
            tone={loginLinkSent ? "success" : "primary"}
          />
          <Text style={authScreenStyles.helperText}>
            {loginLinkSent ? t("auth.signIn.linkSentHelper") : t("auth.signIn.helper")}
          </Text>
        </View>
      </View>
    </AuthScreenFrame>
  );
}
