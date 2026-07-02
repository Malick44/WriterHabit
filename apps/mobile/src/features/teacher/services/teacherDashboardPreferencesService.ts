import { z } from "zod";

import { supabase } from "@/core/supabase/supabaseClient";
import { preferencesStorage } from "@/services/storage/preferencesStorage";
import { storageKeys } from "@/services/storage/storageKeys";

const dashboardPreferencesSchema = z.object({
  insightDismissed: z.boolean().catch(false),
});

type TeacherDashboardPreferences = z.infer<typeof dashboardPreferencesSchema>;

const defaultDashboardPreferences: TeacherDashboardPreferences = {
  insightDismissed: false,
};

function parsePreferences(value: unknown): TeacherDashboardPreferences {
  const parsed = dashboardPreferencesSchema.safeParse(value);

  return parsed.success ? parsed.data : defaultDashboardPreferences;
}

async function getRemotePreferences(userId: string): Promise<TeacherDashboardPreferences | null> {
  const { data: authData } = await supabase.auth.getSession();

  if (authData.session?.user.id !== userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("teacher_profiles")
    .select("dashboard_preferences")
    .eq("user_id", userId)
    .maybeSingle<{ dashboard_preferences: unknown }>();

  if (error || !data) {
    return null;
  }

  return parsePreferences(data.dashboard_preferences);
}

async function updateRemotePreferences(
  userId: string,
  preferences: TeacherDashboardPreferences,
): Promise<TeacherDashboardPreferences | null> {
  const { data: authData } = await supabase.auth.getSession();

  if (authData.session?.user.id !== userId) {
    return null;
  }

  const { error } = await supabase
    .from("teacher_profiles")
    .update({
      dashboard_preferences: preferences,
    })
    .eq("user_id", userId);

  if (error) {
    return null;
  }

  return preferences;
}

export const teacherDashboardPreferencesService = {
  async getInsightDismissed(userId: string): Promise<boolean> {
    const key = storageKeys.teacherDashboardInsightDismissed(userId);
    const localDismissed = await preferencesStorage.getPreference<boolean>(key, false);
    const remotePreferences = await getRemotePreferences(userId);

    if (remotePreferences) {
      await preferencesStorage.setPreference(key, remotePreferences.insightDismissed);
      return remotePreferences.insightDismissed;
    }

    return localDismissed;
  },

  async setInsightDismissed(userId: string, dismissed: boolean): Promise<void> {
    const key = storageKeys.teacherDashboardInsightDismissed(userId);
    await preferencesStorage.setPreference(key, dismissed);
    const remotePreferences = await getRemotePreferences(userId);

    await updateRemotePreferences(userId, {
      ...(remotePreferences ?? defaultDashboardPreferences),
      insightDismissed: dismissed,
    });
  },
};
