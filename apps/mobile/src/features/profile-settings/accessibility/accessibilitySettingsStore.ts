import { z } from "zod";
import { create } from "zustand";

import { supabase } from "@/core/supabase/supabaseClient";
import { preferencesStorage } from "@/services/storage/preferencesStorage";
import { storageKeys } from "@/services/storage/storageKeys";
import {
  defaultAccessibilitySettings,
  type AccessibilitySettings,
  type AccessibilitySettingsError,
  type AccessibilityTextSize,
} from "@/shared/utils/accessibility";

const accessibilitySettingsSchema = z.object({
  textSize: z.enum(["default", "large", "extraLarge"]).catch(defaultAccessibilitySettings.textSize),
  dyslexiaFriendlyFont: z.boolean().catch(defaultAccessibilitySettings.dyslexiaFriendlyFont),
  highContrast: z.boolean().catch(defaultAccessibilitySettings.highContrast),
  reducedMotion: z.boolean().catch(defaultAccessibilitySettings.reducedMotion),
  textToSpeech: z.boolean().catch(defaultAccessibilitySettings.textToSpeech),
  speechToText: z.boolean().catch(defaultAccessibilitySettings.speechToText),
  simplifiedUi: z.boolean().catch(defaultAccessibilitySettings.simplifiedUi),
});

type AccessibilitySettingsStore = {
  settings: AccessibilitySettings;
  hydrated: boolean;
  error: AccessibilitySettingsError;
  hydrateSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AccessibilitySettings>) => Promise<void>;
  setTextSize: (textSize: AccessibilityTextSize) => Promise<void>;
  resetSettings: () => Promise<void>;
};

function parseAccessibilitySettings(value: unknown): AccessibilitySettings {
  const parsed = accessibilitySettingsSchema.safeParse(value);

  if (!parsed.success) {
    return defaultAccessibilitySettings;
  }

  return {
    ...defaultAccessibilitySettings,
    ...parsed.data,
  };
}

async function persistSettings(settings: AccessibilitySettings): Promise<void> {
  await preferencesStorage.setPreference(storageKeys.accessibilitySettings, settings);
}

async function getRemoteAccessibilitySettings(): Promise<AccessibilitySettings | null> {
  const { data: authData } = await supabase.auth.getSession();
  const session = authData.session;

  if (!session) {
    return null;
  }

  const { data, error } = await supabase
    .from("student_profiles")
    .select("accessibility_settings")
    .eq("user_id", session.user.id)
    .maybeSingle<{ accessibility_settings: unknown }>();

  if (error || !data) {
    return null;
  }

  return parseAccessibilitySettings(data.accessibility_settings);
}

async function persistRemoteAccessibilitySettings(settings: AccessibilitySettings): Promise<void> {
  const { data: authData } = await supabase.auth.getSession();
  const session = authData.session;

  if (!session) {
    return;
  }

  const { error } = await supabase
    .from("student_profiles")
    .update({
      accessibility_settings: settings,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", session.user.id);

  if (error) {
    throw error;
  }
}

export const useAccessibilitySettingsStore = create<AccessibilitySettingsStore>()((set, get) => ({
  settings: defaultAccessibilitySettings,
  hydrated: false,
  error: null,
  hydrateSettings: async () => {
    if (get().hydrated) {
      return;
    }

    try {
      const storedSettings = await preferencesStorage.getPreference<unknown>(
        storageKeys.accessibilitySettings,
        defaultAccessibilitySettings,
      );
      const localSettings = parseAccessibilitySettings(storedSettings);
      const remoteSettings = await getRemoteAccessibilitySettings();
      const settings = remoteSettings ?? localSettings;

      if (remoteSettings) {
        await persistSettings(remoteSettings);
      }

      set({
        error: null,
        hydrated: true,
        settings,
      });
    } catch {
      set({
        error: "read_failed",
        hydrated: true,
        settings: defaultAccessibilitySettings,
      });
    }
  },
  updateSettings: async (settingsPatch) => {
    const nextSettings = {
      ...get().settings,
      ...settingsPatch,
    };

    set({
      error: null,
      settings: nextSettings,
    });

    try {
      await persistSettings(nextSettings);
      await persistRemoteAccessibilitySettings(nextSettings);
    } catch {
      set({ error: "write_failed" });
    }
  },
  setTextSize: async (textSize) => {
    await get().updateSettings({ textSize });
  },
  resetSettings: async () => {
    set({
      error: null,
      settings: defaultAccessibilitySettings,
    });

    try {
      await preferencesStorage.removePreference(storageKeys.accessibilitySettings);
      await persistRemoteAccessibilitySettings(defaultAccessibilitySettings);
    } catch {
      set({ error: "write_failed" });
    }
  },
}));

export { parseAccessibilitySettings };
