import { z } from "zod";
import { create } from "zustand";

import { preferencesStorage } from "@/services/storage/preferencesStorage";
import {
  defaultAccessibilitySettings,
  type AccessibilitySettings,
  type AccessibilitySettingsError,
  type AccessibilityTextSize,
} from "@/shared/utils/accessibility";

const ACCESSIBILITY_SETTINGS_KEY = "profile-settings.accessibility";

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
  await preferencesStorage.setPreference(ACCESSIBILITY_SETTINGS_KEY, settings);
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
        ACCESSIBILITY_SETTINGS_KEY,
        defaultAccessibilitySettings,
      );
      set({
        error: null,
        hydrated: true,
        settings: parseAccessibilitySettings(storedSettings),
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
      await preferencesStorage.removePreference(ACCESSIBILITY_SETTINGS_KEY);
    } catch {
      set({ error: "write_failed" });
    }
  },
}));

export { parseAccessibilitySettings };
