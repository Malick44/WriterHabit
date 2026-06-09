import { useState } from "react";
import type { KeyboardTypeOptions } from "react-native";
import type { z, ZodIssue } from "zod";

import type { AuthErrorCode, AuthSignInInput, AuthSignUpInput, MockSessionRole } from "@/core/auth/authTypes";
import { useI18n, type TranslationKey } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { StatusState } from "@/shared/components/feedback";
import { ChoiceCard, FormField, TextField } from "@/shared/components/forms";
import { Stack } from "@/shared/components/layout/Stack";

import {
  AUTH_ROLE_OPTIONS,
  authErrorMessageKeys,
  signInInputSchema,
  signUpFormSchema,
  toSignUpInput,
  type SignInFormValues,
  type SignUpFormValues,
} from "../types";

type AuthFormMode = "signIn" | "signUp";
type AuthFieldKey = keyof SignInFormValues | keyof SignUpFormValues;
type FieldErrors = Partial<Record<AuthFieldKey, string>>;

type AuthFormProps =
  | {
      mode: "signIn";
      loading?: boolean;
      errorCode?: AuthErrorCode | null;
      onSubmit: (input: AuthSignInInput) => Promise<void> | void;
    }
  | {
      mode: "signUp";
      loading?: boolean;
      errorCode?: AuthErrorCode | null;
      onSubmit: (input: AuthSignUpInput) => Promise<void> | void;
    };

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

function getIssueMessageKey(issue: ZodIssue): TranslationKey {
  if (issue.message.startsWith("auth.")) {
    return issue.message as TranslationKey;
  }

  return "auth.errors.validation";
}

function getFieldErrors(error: z.ZodError, t: (key: TranslationKey) => string): FieldErrors {
  return error.issues.reduce<FieldErrors>((errors, issue) => {
    const field = issue.path[0];

    if (typeof field !== "string") {
      return errors;
    }

    if (errors[field as AuthFieldKey]) {
      return errors;
    }

    return {
      ...errors,
      [field]: t(getIssueMessageKey(issue)),
    };
  }, {});
}

function getKeyboardType(field: "email" | "default"): KeyboardTypeOptions {
  return field === "email" ? "email-address" : "default";
}

export function AuthForm(props: AuthFormProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<MockSessionRole>("student");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearFieldError = (field: AuthFieldKey) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (props.mode === "signIn") {
      const result = signInInputSchema.safeParse({ email, password } satisfies SignInFormValues);

      if (!result.success) {
        setFieldErrors(getFieldErrors(result.error, t));
        return;
      }

      setFieldErrors({});
      await props.onSubmit(result.data);
      return;
    }

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
    await props.onSubmit(toSignUpInput(result.data));
  };

  return (
    <Stack gap="md">
      {props.errorCode ? (
        <StatusState
          description={t(authErrorMessageKeys[props.errorCode])}
          title={t("auth.errors.title")}
          tone="error"
        />
      ) : null}

      {props.mode === "signUp" ? (
        <TextField
          accessibilityLabel={t("auth.fields.displayNameAccessibility")}
          autoCapitalize="words"
          editable={!props.loading}
          error={fieldErrors.displayName}
          label={t("auth.fields.displayNameLabel")}
          onChangeText={(value) => {
            setDisplayName(value);
            clearFieldError("displayName");
          }}
          placeholder={t("auth.fields.displayNamePlaceholder")}
          required
          returnKeyType="next"
          textContentType="name"
          value={displayName}
        />
      ) : null}

      <TextField
        accessibilityLabel={t("auth.fields.emailAccessibility")}
        autoCapitalize="none"
        autoComplete="email"
        editable={!props.loading}
        error={fieldErrors.email}
        keyboardType={getKeyboardType("email")}
        label={t("auth.fields.emailLabel")}
        onChangeText={(value) => {
          setEmail(value);
          clearFieldError("email");
        }}
        placeholder={t("auth.fields.emailPlaceholder")}
        required
        returnKeyType="next"
        textContentType="emailAddress"
        value={email}
      />

      <TextField
        accessibilityLabel={t("auth.fields.passwordAccessibility")}
        autoCapitalize="none"
        autoComplete={props.mode === "signIn" ? "current-password" : "new-password"}
        editable={!props.loading}
        error={fieldErrors.password}
        label={t("auth.fields.passwordLabel")}
        onChangeText={(value) => {
          setPassword(value);
          clearFieldError("password");
        }}
        placeholder={t("auth.fields.passwordPlaceholder")}
        required
        returnKeyType={props.mode === "signIn" ? "done" : "next"}
        secureTextEntry
        textContentType={props.mode === "signIn" ? "password" : "newPassword"}
        value={password}
      />

      {props.mode === "signUp" ? (
        <>
          <TextField
            accessibilityLabel={t("auth.fields.confirmPasswordAccessibility")}
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!props.loading}
            error={fieldErrors.confirmPassword}
            label={t("auth.fields.confirmPasswordLabel")}
            onChangeText={(value) => {
              setConfirmPassword(value);
              clearFieldError("confirmPassword");
            }}
            placeholder={t("auth.fields.confirmPasswordPlaceholder")}
            required
            returnKeyType="done"
            secureTextEntry
            textContentType="newPassword"
            value={confirmPassword}
          />

          <FormField
            error={fieldErrors.role}
            hint={t("auth.fields.roleHint")}
            label={t("auth.fields.roleLabel")}
            required
          >
            <Stack gap="sm">
              {AUTH_ROLE_OPTIONS.map((roleOption) => (
                <ChoiceCard
                  accessibilityHint={t("auth.fields.roleAccessibility")}
                  disabled={props.loading}
                  key={roleOption}
                  label={t(roleCopyKeys[roleOption].label)}
                  description={t(roleCopyKeys[roleOption].description)}
                  onPress={() => {
                    setRole(roleOption);
                    clearFieldError("role");
                  }}
                  selected={roleOption === role}
                />
              ))}
            </Stack>
          </FormField>
        </>
      ) : null}

      <Button
        fullWidth
        label={props.mode === "signIn" ? t("auth.signIn.submitCta") : t("auth.signUp.submitCta")}
        loading={props.loading}
        onPress={() => {
          void handleSubmit();
        }}
      />
    </Stack>
  );
}
