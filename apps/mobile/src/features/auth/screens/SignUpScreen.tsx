import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ZodError, ZodIssue } from "zod";

import type { MockSessionRole } from "@/core/auth/authTypes";
import { routes } from "@/core/navigation/routeNames";
import { useI18n, type TranslationKey } from "@/i18n";
import { StatusState } from "@/shared/components/feedback";
import { useTopAlert } from "@/shared/components/feedback/top-alert";
import {
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import {
  AuthFooterLink,
  AuthScreenFrame,
  AuthSeparator,
  AuthSocialButton,
  AuthSubmitButton,
  AuthTextField,
  authScreenColors,
  authScreenStyles,
  type AuthSocialProvider,
} from "../components";
import { useAuth } from "../hooks/useAuth";
import {
  AUTH_ROLE_OPTIONS,
  authErrorMessageKeys,
  signUpFormSchema,
  toSignUpInput,
  type SignUpFormValues,
} from "../types";

type SignUpFieldKey = keyof SignUpFormValues;
type FieldErrors = Partial<Record<SignUpFieldKey, string>>;

const roleCopyKeys: Record<MockSessionRole, { label: TranslationKey; description: TranslationKey }> = {
  parent: {
    description: "auth.roles.parent.description",
    label: "auth.roles.parent.label",
  },
  student: {
    description: "auth.roles.student.description",
    label: "auth.roles.student.label",
  },
  teacher: {
    description: "auth.roles.teacher.description",
    label: "auth.roles.teacher.label",
  },
};

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

function RoleOption({
  accessibilityLabel,
  description,
  disabled,
  label,
  onPress,
  selected,
}: {
  accessibilityLabel: string;
  description: string;
  disabled: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const { settings } = useAccessibilityContext();
  const minimumTouchTarget = getMinimumTouchTarget(settings);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      hitSlop={getAccessibleHitSlop(settings)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleOption,
        {
          borderColor: selected ? authScreenColors.primary : authScreenColors.border,
          minHeight: Math.max(48, minimumTouchTarget),
        },
        selected ? styles.roleOptionSelected : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <View style={[styles.roleCheck, selected ? styles.roleCheckSelected : null]}>
        {selected ? (
          <Ionicons
            accessible={false}
            color="#FFFFFF"
            importantForAccessibility="no"
            name="checkmark"
            size={15}
          />
        ) : null}
      </View>
      <View style={styles.roleCopy}>
        <Text style={getAccessibleTextStyle(styles.roleLabel, settings)}>{label}</Text>
        <Text style={getAccessibleTextStyle(styles.roleDescription, settings)}>{description}</Text>
      </View>
    </Pressable>
  );
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
  const [role, setRole] = useState<MockSessionRole>("student");
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
      role,
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

            <View style={styles.roleSection}>
              <Text style={getAccessibleTextStyle(styles.roleSectionLabel, settings)}>
                {t("auth.fields.roleLabel")}
              </Text>
              <View style={authScreenStyles.roleList}>
                {AUTH_ROLE_OPTIONS.map((roleOption) => (
                  <RoleOption
                    accessibilityLabel={t(roleCopyKeys[roleOption].label)}
                    description={t(roleCopyKeys[roleOption].description)}
                    disabled={isBusy}
                    key={roleOption}
                    label={t(roleCopyKeys[roleOption].label)}
                    onPress={() => {
                      setRole(roleOption);
                      clearFieldError("role");
                    }}
                    selected={roleOption === role}
                  />
                ))}
              </View>
              {fieldErrors.role ? (
                <Text
                  accessibilityLiveRegion="polite"
                  accessibilityRole="alert"
                  style={getAccessibleTextStyle(styles.roleError, settings)}
                >
                  {fieldErrors.role}
                </Text>
              ) : null}
            </View>

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

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
  roleCheck: {
    alignItems: "center",
    borderColor: authScreenColors.border,
    borderRadius: 999,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  roleCheckSelected: {
    backgroundColor: authScreenColors.primary,
    borderColor: authScreenColors.primary,
  },
  roleCopy: {
    flex: 1,
    gap: 3,
  },
  roleDescription: {
    color: authScreenColors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  roleError: {
    color: authScreenColors.danger,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginLeft: 4,
  },
  roleLabel: {
    color: authScreenColors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  roleOption: {
    alignItems: "center",
    backgroundColor: authScreenColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  roleOptionSelected: {
    backgroundColor: authScreenColors.inputBackground,
  },
  roleSection: {
    gap: 8,
  },
  roleSectionLabel: {
    color: authScreenColors.muted,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginLeft: 4,
  },
});
