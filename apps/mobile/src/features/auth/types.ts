import { z } from "zod";

import type {
  AuthErrorCode,
  AuthSignInInput,
  AuthSignUpInput,
  MockSessionRole,
} from "@/core/auth/authTypes";
import type { TranslationKey } from "@/i18n";

export const AUTH_ROLE_OPTIONS = ["student", "parent", "teacher"] as const satisfies readonly MockSessionRole[];

const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "auth.errors.emailRequired" })
  .email({ message: "auth.errors.emailInvalid" });

export const signInInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "auth.errors.passwordRequired" }),
}) satisfies z.ZodType<AuthSignInInput>;

export const signUpInputSchema = z.object({
  displayName: z.string().trim().min(1, { message: "auth.errors.displayNameRequired" }),
  email: emailSchema,
  password: z.string().min(8, { message: "auth.errors.passwordTooShort" }),
  role: z.enum(AUTH_ROLE_OPTIONS),
}) satisfies z.ZodType<AuthSignUpInput>;

export const signUpFormSchema = signUpInputSchema
  .extend({
    confirmPassword: z.string().min(1, { message: "auth.errors.confirmPasswordRequired" }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "auth.errors.passwordMismatch",
    path: ["confirmPassword"],
  });

export type SignInFormValues = z.infer<typeof signInInputSchema>;
export type SignUpInputValues = z.infer<typeof signUpInputSchema>;
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export const authErrorMessageKeys: Record<AuthErrorCode, TranslationKey> = {
  complete_onboarding_failed: "auth.errors.completeOnboardingFailed",
  restore_failed: "auth.errors.restoreFailed",
  sign_in_failed: "auth.errors.signInFailed",
  sign_up_failed: "auth.errors.signUpFailed",
};

export function toSignUpInput(values: SignUpFormValues): AuthSignUpInput {
  return {
    displayName: values.displayName,
    email: values.email,
    password: values.password,
    role: values.role,
  };
}
