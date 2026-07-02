import { preferencesStorage } from "@/services/storage/preferencesStorage";
import { supabase } from "@/core/supabase/supabaseClient";
import { storageKeys } from "@/services/storage/storageKeys";

import {
  defaultOnboardingProgress,
  onboardingProgressSchema,
  type OnboardingProgress,
} from "../types";

function getProgressKey(userId: string) {
  return storageKeys.onboardingProgress(userId);
}

type StudentProfileOnboardingRow = {
  daily_goal_minutes: number | null;
  grade_level: number | null;
  onboarding_completed_at?: string | null;
  updated_at: string | null;
  user_id: string;
  writing_goals: string[] | null;
  writing_level: string | null;
};

type UserOnboardingProgressRow = {
  onboarding_progress: unknown;
};

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
    const { data: authData } = await supabase.auth.getSession();
    const session = authData.session;

    if (session?.user.id === userId) {
      const profileProgress = await loadSupabaseProgress(userId);

      if (profileProgress) {
        return profileProgress;
      }

      const userProgress = await loadSupabaseUserProgress(userId);

      if (userProgress) {
        return userProgress;
      }
    }

    const storedProgress = await preferencesStorage.getPreference<unknown>(getProgressKey(userId), null);
    return parseOnboardingProgress(storedProgress);
  },

  async saveProgress(userId: string, progress: OnboardingProgress): Promise<void> {
    const parsedProgress = parseOnboardingProgress({
      ...progress,
      updatedAt: new Date().toISOString(),
    });

    await preferencesStorage.setPreference(getProgressKey(userId), parsedProgress);

    const { data: authData } = await supabase.auth.getSession();
    const session = authData.session;

    if (session?.user.id === userId && parsedProgress.gradeLevel) {
      await saveSupabaseProgress(userId, parsedProgress);
    } else if (session?.user.id === userId) {
      await saveSupabaseUserProgress(userId, parsedProgress);
    }
  },

  async clearProgress(userId: string): Promise<void> {
    await preferencesStorage.removePreference(getProgressKey(userId));

    const { data: authData } = await supabase.auth.getSession();
    const session = authData.session;

    if (session?.user.id === userId) {
      await saveSupabaseUserProgress(userId, defaultOnboardingProgress);
    }
  },
};

async function loadSupabaseUserProgress(userId: string): Promise<OnboardingProgress | null> {
  const { data, error } = await supabase
    .from("users")
    .select("onboarding_progress")
    .eq("id", userId)
    .maybeSingle<UserOnboardingProgressRow>();

  if (error || !data) {
    return null;
  }

  const parsed = onboardingProgressSchema.safeParse(data.onboarding_progress);

  if (!parsed.success) {
    return null;
  }

  return parseOnboardingProgress(parsed.data);
}

async function saveSupabaseUserProgress(userId: string, progress: OnboardingProgress): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({
      onboarding_progress: progress,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

async function loadSupabaseProgress(userId: string): Promise<OnboardingProgress | null> {
  const { data, error } = await supabase
    .from("student_profiles")
    .select("user_id, grade_level, writing_level, writing_goals, daily_goal_minutes, onboarding_completed_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle<StudentProfileOnboardingRow>();

  if (error || !data) {
    return null;
  }

  return parseOnboardingProgress({
    confidenceLevel: data.writing_level,
    dailyPracticeMinutes: data.daily_goal_minutes,
    gradeLevel: data.grade_level,
    role: "student",
    updatedAt: data.updated_at ?? data.onboarding_completed_at ?? undefined,
    writingGoals: data.writing_goals ?? [],
  });
}

async function saveSupabaseProgress(userId: string, progress: OnboardingProgress): Promise<void> {
  if (!progress.gradeLevel) {
    return;
  }

  await saveSupabaseUserProgress(userId, progress);

  const { error: ensureError } = await supabase.rpc("ensure_own_student_profile", {
    p_grade_level: progress.gradeLevel,
  });

  if (ensureError) {
    throw ensureError;
  }

  const patch: Record<string, unknown> = {
    grade_level: progress.gradeLevel,
    updated_at: new Date().toISOString(),
  };

  if (progress.confidenceLevel) {
    patch.writing_level = progress.confidenceLevel;
  }

  if (progress.dailyPracticeMinutes) {
    patch.daily_goal_minutes = progress.dailyPracticeMinutes;
  }

  if (progress.writingGoals) {
    patch.writing_goals = progress.writingGoals;
  }

  const { error: updateError } = await supabase.from("student_profiles").update(patch).eq("user_id", userId);

  if (updateError) {
    throw updateError;
  }
}
