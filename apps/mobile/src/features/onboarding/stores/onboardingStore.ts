import type { GradeLevel, WritingGoal } from "@WriterHabit/shared";
import { create } from "zustand";

import type { MockSessionRole } from "@/core/auth/authTypes";

import { onboardingApi } from "../api/onboardingApi";
import {
  DAILY_PRACTICE_OPTIONS,
  MAX_WRITING_GOALS,
  defaultOnboardingProgress,
  getCompletedOnboardingProfile,
  type DailyPracticeMinutes,
  type OnboardingErrorCode,
  type OnboardingProgress,
  type OnboardingRole,
  type OnboardingStatus,
  type PersonalizedPlan,
  type WritingConfidenceLevel,
} from "../types";

type HydrateOptions = {
  defaultRole?: MockSessionRole;
};

type OnboardingStore = {
  errorCode: OnboardingErrorCode | null;
  hydrated: boolean;
  plan: PersonalizedPlan | null;
  progress: OnboardingProgress;
  status: OnboardingStatus;
  userId: string | null;
  hydrateProgress: (userId: string, options?: HydrateOptions) => Promise<void>;
  setRole: (role: OnboardingRole) => Promise<void>;
  setGradeLevel: (gradeLevel: GradeLevel) => Promise<void>;
  toggleWritingGoal: (goal: WritingGoal) => Promise<void>;
  setConfidenceLevel: (confidenceLevel: WritingConfidenceLevel) => Promise<void>;
  setDailyPracticeMinutes: (dailyPracticeMinutes: DailyPracticeMinutes) => Promise<void>;
  createPlan: () => Promise<PersonalizedPlan | null>;
  setErrorCode: (errorCode: OnboardingErrorCode | null) => void;
  resetProgress: () => Promise<void>;
};

function getDefaultRole(role?: MockSessionRole): OnboardingRole | undefined {
  return role === "student" || role === "parent" || role === "teacher" ? role : undefined;
}

function mergeProgress(
  storedProgress: OnboardingProgress,
  options?: HydrateOptions,
): OnboardingProgress {
  return {
    ...defaultOnboardingProgress,
    ...storedProgress,
    role: storedProgress.role ?? getDefaultRole(options?.defaultRole),
    writingGoals: storedProgress.writingGoals ?? [],
  };
}

function getUpdatedProgress(progress: OnboardingProgress, patch: Partial<OnboardingProgress>): OnboardingProgress {
  return {
    ...progress,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export const useOnboardingStore = create<OnboardingStore>()((set, get) => ({
  errorCode: null,
  hydrated: false,
  plan: null,
  progress: defaultOnboardingProgress,
  status: "idle",
  userId: null,
  hydrateProgress: async (userId, options) => {
    const state = get();

    if ((state.hydrated || state.status === "loading") && state.userId === userId) {
      return;
    }

    set({ errorCode: null, status: "loading", userId });

    try {
      const storedProgress = await onboardingApi.loadProgress(userId);
      set({
        errorCode: null,
        hydrated: true,
        plan: null,
        progress: mergeProgress(storedProgress, options),
        status: "idle",
        userId,
      });
    } catch {
      set({
        errorCode: "read_failed",
        hydrated: true,
        plan: null,
        progress: mergeProgress(defaultOnboardingProgress, options),
        status: "error",
        userId,
      });
    }
  },
  setRole: async (role) => {
    await get().setErrorCode(null);
    await persistProgressPatch(set, get, { role });
  },
  setGradeLevel: async (gradeLevel) => {
    await get().setErrorCode(null);
    await persistProgressPatch(set, get, { gradeLevel });
  },
  toggleWritingGoal: async (goal) => {
    await get().setErrorCode(null);

    const currentGoals = get().progress.writingGoals;
    const nextGoals = currentGoals.includes(goal)
      ? currentGoals.filter((currentGoal) => currentGoal !== goal)
      : currentGoals.length >= MAX_WRITING_GOALS
        ? currentGoals
        : [...currentGoals, goal];

    await persistProgressPatch(set, get, { writingGoals: nextGoals });
  },
  setConfidenceLevel: async (confidenceLevel) => {
    await get().setErrorCode(null);
    await persistProgressPatch(set, get, { confidenceLevel });
  },
  setDailyPracticeMinutes: async (dailyPracticeMinutes) => {
    await get().setErrorCode(null);

    if (!DAILY_PRACTICE_OPTIONS.includes(dailyPracticeMinutes)) {
      set({ errorCode: "validation_failed", status: "error" });
      return;
    }

    await persistProgressPatch(set, get, { dailyPracticeMinutes });
  },
  createPlan: async () => {
    const profile = getCompletedOnboardingProfile(get().progress);

    if (!profile.success) {
      set({ errorCode: "validation_failed", plan: null, status: "error" });
      return null;
    }

    set({ errorCode: null, status: "loading" });

    try {
      const plan = await onboardingApi.createPersonalizedPlan(profile.data);
      set({ errorCode: null, plan, status: "success" });
      return plan;
    } catch {
      set({ errorCode: "plan_failed", plan: null, status: "error" });
      return null;
    }
  },
  setErrorCode: (errorCode) => {
    set({ errorCode, status: errorCode ? "error" : "idle" });
  },
  resetProgress: async () => {
    const userId = get().userId;
    set({
      errorCode: null,
      plan: null,
      progress: defaultOnboardingProgress,
      status: "idle",
    });

    if (!userId) {
      return;
    }

    try {
      await onboardingApi.clearProgress(userId);
    } catch {
      set({ errorCode: "write_failed", status: "error" });
    }
  },
}));

async function persistProgressPatch(
  set: (partial: Partial<OnboardingStore>) => void,
  get: () => OnboardingStore,
  patch: Partial<OnboardingProgress>,
) {
  const state = get();
  const nextProgress = getUpdatedProgress(state.progress, patch);

  set({
    errorCode: null,
    plan: null,
    progress: nextProgress,
    status: "idle",
  });

  if (!state.userId) {
    return;
  }

  try {
    await onboardingApi.saveProgress(state.userId, nextProgress);
  } catch {
    set({ errorCode: "write_failed", status: "error" });
  }
}
