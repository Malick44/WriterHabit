import { create } from "zustand";

export interface GlacierThemeState {
  primaryColor: string;
  backgroundColor: string;
  tertiaryColor: string;
  glassOpacity: number;
  borderOpacity: number;
  glowIntensity: number;
  glowSize: number;
  fontSizeScale: number;
  isTuningPanelOpen: boolean;
  setThemeParam: <K extends keyof Omit<GlacierThemeState, "setThemeParam" | "resetTheme" | "toggleTuningPanel">>(
    param: K,
    value: GlacierThemeState[K]
  ) => void;
  resetTheme: () => void;
  toggleTuningPanel: () => void;
}

const DEFAULT_THEME = {
  primaryColor: "#7dd3fc", // Ice-blue
  backgroundColor: "#0a0e1a", // Deep navy-black base
  tertiaryColor: "#c8a0f0", // Soft lavender
  glassOpacity: 0.6,
  borderOpacity: 0.15,
  glowIntensity: 0.05,
  glowSize: 30,
  fontSizeScale: 1.0,
  isTuningPanelOpen: false,
};

export const useGlacierThemeStore = create<GlacierThemeState>((set) => ({
  ...DEFAULT_THEME,
  setThemeParam: (param, value) => set(() => ({ [param]: value })),
  resetTheme: () => set(() => ({ ...DEFAULT_THEME })),
  toggleTuningPanel: () => set((state) => ({ isTuningPanelOpen: !state.isTuningPanelOpen })),
}));
