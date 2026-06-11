import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { ZodError, ZodIssue } from "zod";

import { routes } from "@/core/navigation/routeNames";
import { useI18n, type TranslationKey } from "@/i18n";
import { StatusState } from "@/shared/components/feedback";
import { useTopAlert } from "@/shared/components/feedback/top-alert";
import {
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

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
import {
  authErrorMessageKeys,
  signUpFormSchema,
  toSignUpInput,
  type SignUpFormValues,
} from "../types";

type SignUpFieldKey = keyof SignUpFormValues;
type FieldErrors = Partial<Record<SignUpFieldKey, string>>;

function getValidationMessageKey(issue: ZodIssue): TranslationKey {
  return issue.message.startsWith("auth.") ? (issue.message as TranslationKey) : "auth.errors.validation";
}

function getFieldErrors(error: ZodError<SignUpFormValues>, t: (key: TranslationKey) => string): FieldErrors {
  return error.issues.reduce<FieldErrors>((errors, issue) => {
    const field = issue.path[0];

    if (typeof field !== "string" || errors[field as SignUpFieldKey]) {
      return errors;
    }

    return {
      ...errors,
      [field]: t(getValidationMessageKey(issue)),
    };
  }, {});
}

export function SignUpScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const topAlert = useTopAlert();
  const { clearError, errorCode, isBusy, signUpWithEmail } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);

  const clearFieldError = (field: SignUpFieldKey) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    clearError();
  };

  const showSocialUnavailableAlert = (provider: AuthSocialProvider) => {
    topAlert.show({
      descriptionKey:
        provider === "google"
          ? "auth.signUp.googleUnavailableDescription"
          : "auth.signUp.appleUnavailableDescription",
      iconName: provider === "google" ? "logo-google" : "logo-apple",
      titleKey: "auth.signUp.socialUnavailableTitle",
      type: "info",
    });
  };

  const handleSubmit = async () => {
    const result = signUpFormSchema.safeParse({
      confirmPassword,
      displayName,
      email,
      password,
    } satisfies SignUpFormValues);

    if (!result.success) {
      setFieldErrors(getFieldErrors(result.error, t));
      return;
    }

    setFieldErrors({});
    const actionResult = await signUpWithEmail(toSignUpInput(result.data));
    setRequiresEmailConfirmation(Boolean(actionResult.requiresEmailConfirmation));
  };

  return (
    <AuthScreenFrame
      heroIconName="person-add"
      heroImageAccessibilityLabel={t("auth.signUp.heroImageAccessibility")}
      supportBadgeAccessibilityLabel={t("auth.signUp.helpBadgeAccessibility")}
      supportBadgeLabel={t("auth.signUp.helpBadge")}
      subtitle={t("auth.signUp.subtitle")}
      testID="sign-up-screen"
      title={t("auth.signUp.title")}
      footer={
        <AuthFooterLink
          linkLabel={t("auth.signUp.switchCta")}
          onPress={() => {
            clearError();
            router.push(routes.authSignIn);
          }}
          prompt={t("auth.signUp.haveAccountPrompt")}
        />
      }
    >
      {requiresEmailConfirmation ? (
        <StatusState
          actionLabel={t("auth.signUp.confirmationAction")}
          description={t("auth.signUp.confirmationDescription")}
          onActionPress={() => {
            clearError();
            router.replace(routes.authSignIn);
          }}
          title={t("auth.signUp.confirmationTitle")}
          tone="success"
        />
      ) : (
        <>
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
              label={t("auth.signUp.googleCta")}
              onPress={() => {
                showSocialUnavailableAlert("google");
              }}
              provider="google"
            />
            <AuthSocialButton
              disabled={isBusy}
              label={t("auth.signUp.appleCta")}
              onPress={() => {
                showSocialUnavailableAlert("apple");
              }}
              provider="apple"
            />
          </View>

          <AuthSeparator label={t("auth.signUp.emailSeparator")} />

          <View style={authScreenStyles.form}>
            <AuthTextField
              accessibilityLabel={t("auth.fields.displayNameAccessibility")}
              autoCapitalize="words"
              editable={!isBusy}
              error={fieldErrors.displayName}
              iconName="person-outline"
              label={t("auth.fields.displayNameLabel")}
              onChangeText={(value) => {
                setDisplayName(value);
                clearFieldError("displayName");
              }}
              placeholder={t("auth.fields.displayNamePlaceholder")}
              returnKeyType="next"
              textContentType="name"
              value={displayName}
            />
            <AuthTextField
              accessibilityLabel={t("auth.fields.emailAccessibility")}
              autoCapitalize="none"
              autoComplete="email"
              editable={!isBusy}
              error={fieldErrors.email}
              iconName="mail-outline"
              keyboardType="email-address"
              label={t("auth.fields.emailLabel")}
              onChangeText={(value) => {
                setEmail(value);
                clearFieldError("email");
              }}
              placeholder={t("auth.fields.emailPlaceholder")}
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
            />
            <AuthTextField
              accessibilityLabel={t("auth.fields.passwordAccessibility")}
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!isBusy}
              error={fieldErrors.password}
              iconName="lock-closed-outline"
              label={t("auth.fields.passwordLabel")}
              onChangeText={(value) => {
                setPassword(value);
                clearFieldError("password");
              }}
              placeholder={t("auth.fields.passwordPlaceholder")}
              returnKeyType="next"
              secureTextEntry
              textContentType="newPassword"
              value={password}
            />
            <AuthTextField
              accessibilityLabel={t("auth.fields.confirmPasswordAccessibility")}
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!isBusy}
              error={fieldErrors.confirmPassword}
              iconName="lock-closed-outline"
              label={t("auth.fields.confirmPasswordLabel")}
              onChangeText={(value) => {
                setConfirmPassword(value);
                clearFieldError("confirmPassword");
              }}
              onSubmitEditing={() => {
                void handleSubmit();
              }}
              placeholder={t("auth.fields.confirmPasswordPlaceholder")}
              returnKeyType="done"
              secureTextEntry
              textContentType="newPassword"
              value={confirmPassword}
            />

            <View style={authScreenStyles.submitStack}>
              <AuthSubmitButton
                disabled={isBusy}
                iconName="sparkles"
                label={t("auth.signUp.submitCta")}
                onPress={() => {
                  void handleSubmit();
                }}
              />
              <Text style={getAccessibleTextStyle(authScreenStyles.helperText, settings)}>{t("auth.signUp.helper")}</Text>
            </View>
          </View>
        </>
      )}
    </AuthScreenFrame>
  );
}
