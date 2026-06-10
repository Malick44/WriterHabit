import { create } from "zustand";

import type { TranslationKey } from "@/i18n";

export type ThemeTuningControlScope = "screen" | "component" | "text" | "icon";
export type ThemeTuningValue = string | number;
export type ThemeTuningValues = Record<string, ThemeTuningValue>;

export type ThemeTuningColorPreset = {
  labelKey: TranslationKey;
  value: string;
};

export type ThemeTuningColorControl = {
  kind: "color";
  id: string;
  labelKey: TranslationKey;
  param: string;
  presets: readonly ThemeTuningColorPreset[];
  scope: ThemeTuningControlScope;
};

export type ThemeTuningRangeControl = {
  kind: "range";
  id: string;
  labelKey: TranslationKey;
  max: number;
  min: number;
  param: string;
  scope: ThemeTuningControlScope;
  step: number;
  valueFormat?: "number" | "percent" | "scale";
};

export type ThemeTuningControl = ThemeTuningColorControl | ThemeTuningRangeControl;

export type ThemeTuningScreenConfig = {
  controls: readonly ThemeTuningControl[];
  defaultValues: ThemeTuningValues;
  descriptionKey: TranslationKey;
  id: string;
  routePattern: string;
  titleKey: TranslationKey;
};

export type GlacierThemeParam =
  | "backgroundColor"
  | "borderOpacity"
  | "fontSizeScale"
  | "glassOpacity"
  | "glowIntensity"
  | "glowSize"
  | "iconSizeScale"
  | "primaryColor"
  | "tertiaryColor";

export interface GlacierThemeState {
  primaryColor: string;
  backgroundColor: string;
  tertiaryColor: string;
  glassOpacity: number;
  borderOpacity: number;
  glowIntensity: number;
  glowSize: number;
  fontSizeScale: number;
  iconSizeScale: number;
  activeTuningScreenId: string | null;
  isTuningPanelOpen: boolean;
  screenThemeOverrides: Record<string, ThemeTuningValues>;
  screenTuningRegistry: Record<string, ThemeTuningScreenConfig>;
  clearActiveTuningScreen: (screenId?: string) => void;
  registerTuningScreen: (config: ThemeTuningScreenConfig) => void;
  resetScreenTheme: (screenId: string) => void;
  resetTheme: () => void;
  setActiveTuningScreen: (screenId: string) => void;
  setScreenThemeParam: (screenId: string, param: string, value: ThemeTuningValue) => void;
  setThemeParam: (param: GlacierThemeParam, value: ThemeTuningValue) => void;
  toggleTuningPanel: () => void;
  unregisterTuningScreen: (screenId: string) => void;
}

const DEFAULT_THEME_VALUES = {
  primaryColor: "#7dd3fc", // Ice-blue
  backgroundColor: "#0a0e1a", // Deep navy-black base
  tertiaryColor: "#c8a0f0", // Soft lavender
  glassOpacity: 0.6,
  borderOpacity: 0.15,
  glowIntensity: 0.05,
  glowSize: 30,
  fontSizeScale: 1.0,
  iconSizeScale: 1.0,
};

const DEFAULT_THEME = {
  ...DEFAULT_THEME_VALUES,
  activeTuningScreenId: null,
  isTuningPanelOpen: false,
  screenThemeOverrides: {},
  screenTuningRegistry: {},
};

export const useGlacierThemeStore = create<GlacierThemeState>((set) => ({
  ...DEFAULT_THEME,
  clearActiveTuningScreen: (screenId) =>
    set((state) => {
      if (screenId && state.activeTuningScreenId !== screenId) {
        return state;
      }

      return { activeTuningScreenId: null };
    }),
  registerTuningScreen: (config) =>
    set((state) => {
      if (state.screenTuningRegistry[config.id] === config) {
        return state;
      }

      return {
        screenTuningRegistry: {
          ...state.screenTuningRegistry,
          [config.id]: config,
        },
      };
    }),
  resetScreenTheme: (screenId) =>
    set((state) => {
      if (!state.screenThemeOverrides[screenId]) {
        return state;
      }

      const { [screenId]: _removed, ...remainingOverrides } = state.screenThemeOverrides;

      return {
        screenThemeOverrides: remainingOverrides,
      };
    }),
  resetTheme: () =>
    set((state) => ({
      ...DEFAULT_THEME_VALUES,
      activeTuningScreenId: state.activeTuningScreenId,
      isTuningPanelOpen: state.isTuningPanelOpen,
      screenThemeOverrides: {},
      screenTuningRegistry: state.screenTuningRegistry,
    })),
  setActiveTuningScreen: (screenId) =>
    set((state) => (state.activeTuningScreenId === screenId ? state : { activeTuningScreenId: screenId })),
  setScreenThemeParam: (screenId, param, value) =>
    set((state) => {
      const currentScreenOverrides = state.screenThemeOverrides[screenId] ?? {};

      if (currentScreenOverrides[param] === value) {
        return state;
      }

      return {
        screenThemeOverrides: {
          ...state.screenThemeOverrides,
          [screenId]: {
            ...currentScreenOverrides,
            [param]: value,
          },
        },
      };
    }),
  setThemeParam: (param, value) =>
    set((state) => (state[param] === value ? state : { [param]: value })),
  toggleTuningPanel: () => set((state) => ({ isTuningPanelOpen: !state.isTuningPanelOpen })),
  unregisterTuningScreen: (screenId) =>
    set((state) => {
      if (!state.screenTuningRegistry[screenId] && state.activeTuningScreenId !== screenId) {
        return state;
      }

      const { [screenId]: _removed, ...remainingRegistry } = state.screenTuningRegistry;

      return {
        activeTuningScreenId: state.activeTuningScreenId === screenId ? null : state.activeTuningScreenId,
        screenTuningRegistry: remainingRegistry,
      };
    }),
}));
