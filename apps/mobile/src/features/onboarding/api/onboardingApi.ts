import type { CompletedOnboardingProfile, OnboardingProgress } from "../types";
import { onboardingPersistenceService } from "../services/onboardingPersistenceService";
import { personalizedPlanService } from "../services/personalizedPlanService";

export const onboardingApi = {
  async loadProgress(userId: string) {
    return onboardingPersistenceService.loadProgress(userId);
  },

  async saveProgress(userId: string, progress: OnboardingProgress) {
    return onboardingPersistenceService.saveProgress(userId, progress);
  },

  async createPersonalizedPlan(profile: CompletedOnboardingProfile) {
    return personalizedPlanService.createPlan(profile);
  },

  async clearProgress(userId: string) {
    return onboardingPersistenceService.clearProgress(userId);
  },
};
