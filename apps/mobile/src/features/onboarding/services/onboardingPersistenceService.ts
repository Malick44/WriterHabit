import { preferencesStorage } from "@/services/storage/preferencesStorage";

import {
  defaultOnboardingProgress,
  onboardingProgressSchema,
  type OnboardingProgress,
} from "../types";

const ONBOARDING_PROGRESS_PREFIX = "onboarding.progress.";

function getProgressKey(userId: string) {
  return `${ONBOARDING_PROGRESS_PREFIX}${userId}`;
}

export function parseOnboardingProgress(value: unknown): OnboardingProgress {
  const parsed = onboardingProgressSchema.safeParse(value);

  if (!parsed.success) {
    return defaultOnboardingProgress;
  }

  return {
    ...defaultOnboardingProgress,
    ...parsed.data,
    writingGoals: parsed.data.writingGoals ?? [],
  };
}

export const onboardingPersistenceService = {
  async loadProgress(userId: string): Promise<OnboardingProgress> {
    const storedProgress = await preferencesStorage.getPreference<unknown>(getProgressKey(userId), null);
    return parseOnboardingProgress(storedProgress);
  },

  async saveProgress(userId: string, progress: OnboardingProgress): Promise<void> {
    const parsedProgress = parseOnboardingProgress({
      ...progress,
      updatedAt: new Date().toISOString(),
    });

    await preferencesStorage.setPreference(getProgressKey(userId), parsedProgress);
  },

  async clearProgress(userId: string): Promise<void> {
    await preferencesStorage.removePreference(getProgressKey(userId));
  },
};
