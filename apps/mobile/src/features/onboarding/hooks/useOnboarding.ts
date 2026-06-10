import { useEffect } from "react";

import type { AuthOnboardingCompletionInput } from "@/core/auth/authTypes";
import { useAuthSession } from "@/core/auth/useAuthSession";

import { useOnboardingStore } from "../stores/onboardingStore";
import {
  getCompletedOnboardingProfile,
  getFirstIncompleteOnboardingStep,
  getOnboardingValidationError,
  onboardingStepRoutes,
  type OnboardingRole,
} from "../types";

export function useOnboarding() {
  const auth = useAuthSession();
  const onboarding = useOnboardingStore();
  const session = auth.session;
  const userId = session?.user.id;
  const userRole = session?.user.role;
  const hydrateProgress = onboarding.hydrateProgress;

  useEffect(() => {
    if (!userId || !userRole) {
      return;
    }

    void hydrateProgress(userId, {
      defaultRole: userRole === "admin" ? undefined : userRole,
    });
  }, [hydrateProgress, userRole, userId]);

  const validationError = getOnboardingValidationError(onboarding.progress);
  const firstIncompleteStep = getFirstIncompleteOnboardingStep(onboarding.progress);

  return {
    ...onboarding,
    authOperationStatus: auth.operationStatus,
    signOut: auth.signOut,
    completeRoleOnlyOnboarding: async (role: OnboardingRole) => {
      await onboarding.setRole(role);

      const result = await auth.completeOnboarding({ role });

      if (result.errorCode) {
        onboarding.setErrorCode("completion_failed");
        return {
          ok: false as const,
        };
      }

      if (userId) {
        await onboarding.resetProgress();
      }

      return {
        ok: true as const,
      };
    },
    completeOnboarding: async () => {
      const profile = getCompletedOnboardingProfile(onboarding.progress);

      if (!profile.success) {
        onboarding.setErrorCode("validation_failed");
        return {
          ok: false as const,
          redirectTo: firstIncompleteStep ? onboardingStepRoutes[firstIncompleteStep] : onboardingStepRoutes.role,
        };
      }

      const input: AuthOnboardingCompletionInput = profile.data;
      const result = await auth.completeOnboarding(input);

      if (result.errorCode) {
        onboarding.setErrorCode("completion_failed");
        return {
          ok: false as const,
          redirectTo: null,
        };
      }

      if (userId) {
        await onboarding.resetProgress();
      }

      return {
        ok: true as const,
        redirectTo: null,
      };
    },
    firstIncompleteStep,
    session,
    validationError,
  };
}
