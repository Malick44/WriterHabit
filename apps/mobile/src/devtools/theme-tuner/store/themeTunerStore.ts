import { create } from "zustand";

import { localJsonStorage } from "@/services/storage/localJsonStorage";

import type {
  ThemeTunerOverrides,
  TokenOverrides,
  TokenValue,
  TunableComponentConfig,
  TunableScreenConfig,
} from "../types";

const OVERRIDES_STORAGE_KEY = "devtools.themeTuner.overrides.v1";
const PERSIST_DELAY_MS = 400;

/** Stable empty record so selectors do not create new references per render. */
export const EMPTY_TOKEN_OVERRIDES: TokenOverrides = Object.freeze({});

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let hydrationStarted = false;

function schedulePersist() {
  if (!__DEV__) {
    return;
  }

  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(() => {
    persistTimer = null;
    void localJsonStorage.setItem(OVERRIDES_STORAGE_KEY, useThemeTunerStore.getState().overrides);
  }, PERSIST_DELAY_MS);
}

export interface ThemeTunerState {
  activeScreenId: string | null;
  components: Record<string, TunableComponentConfig>;
  hasHydrated: boolean;
  isPanelOpen: boolean;
  overrides: ThemeTunerOverrides;
  screens: Record<string, TunableScreenConfig>;
  selectedComponentId: string | null;
  selectedScreenId: string | null;
  clearActiveScreen: (screenId: string) => void;
  closePanel: () => void;
  openPanel: () => void;
  registerComponent: (config: TunableComponentConfig) => void;
  registerScreen: (config: TunableScreenConfig) => void;
  resetAllOverrides: () => void;
  resetScreenOverrides: (screenId: string) => void;
  resetTokenOverride: (screenId: string, path: string) => void;
  selectComponent: (componentId: string | null) => void;
  selectScreen: (screenId: string | null) => void;
  setActiveScreen: (screenId: string) => void;
  setTokenOverride: (screenId: string, path: string, value: TokenValue) => void;
  unregisterComponent: (componentId: string) => void;
  unregisterScreen: (screenId: string) => void;
}

export const useThemeTunerStore = create<ThemeTunerState>((set) => ({
  activeScreenId: null,
  components: {},
  hasHydrated: false,
  isPanelOpen: false,
  overrides: {},
  screens: {},
  selectedComponentId: null,
  selectedScreenId: null,
  clearActiveScreen: (screenId) =>
    set((state) => (state.activeScreenId === screenId ? { activeScreenId: null } : state)),
  closePanel: () => set({ isPanelOpen: false }),
  openPanel: () =>
    set((state) => ({
      isPanelOpen: true,
      selectedComponentId: null,
      selectedScreenId: state.selectedScreenId ?? state.activeScreenId,
    })),
  registerComponent: (config) =>
    set((state) =>
      state.components[config.id] === config
        ? state
        : { components: { ...state.components, [config.id]: config } },
    ),
  registerScreen: (config) =>
    set((state) =>
      state.screens[config.id] === config ? state : { screens: { ...state.screens, [config.id]: config } },
    ),
  resetAllOverrides: () => {
    set({ overrides: {} });
    schedulePersist();
  },
  resetScreenOverrides: (screenId) => {
    set((state) => {
      if (!state.overrides[screenId]) {
        return state;
      }

      const { [screenId]: _removed, ...remaining } = state.overrides;

      return { overrides: remaining };
    });
    schedulePersist();
  },
  resetTokenOverride: (screenId, path) => {
    set((state) => {
      const screenOverrides = state.overrides[screenId];

      if (!screenOverrides || !(path in screenOverrides)) {
        return state;
      }

      const { [path]: _removed, ...remaining } = screenOverrides;

      if (Object.keys(remaining).length === 0) {
        const { [screenId]: _removedScreen, ...remainingScreens } = state.overrides;

        return { overrides: remainingScreens };
      }

      return { overrides: { ...state.overrides, [screenId]: remaining } };
    });
    schedulePersist();
  },
  selectComponent: (componentId) => set({ selectedComponentId: componentId }),
  selectScreen: (screenId) => set({ selectedComponentId: null, selectedScreenId: screenId }),
  setActiveScreen: (screenId) =>
    set((state) => (state.activeScreenId === screenId ? state : { activeScreenId: screenId })),
  setTokenOverride: (screenId, path, value) => {
    set((state) => {
      const screenOverrides = state.overrides[screenId] ?? {};

      if (screenOverrides[path] === value) {
        return state;
      }

      return {
        overrides: {
          ...state.overrides,
          [screenId]: { ...screenOverrides, [path]: value },
        },
      };
    });
    schedulePersist();
  },
  unregisterComponent: (componentId) =>
    set((state) => {
      if (!state.components[componentId]) {
        return state;
      }

      const { [componentId]: _removed, ...remaining } = state.components;

      return {
        components: remaining,
        selectedComponentId: state.selectedComponentId === componentId ? null : state.selectedComponentId,
      };
    }),
  unregisterScreen: (screenId) =>
    set((state) => {
      if (!state.screens[screenId]) {
        return state;
      }

      const { [screenId]: _removed, ...remaining } = state.screens;

      return {
        activeScreenId: state.activeScreenId === screenId ? null : state.activeScreenId,
        screens: remaining,
        selectedScreenId: state.selectedScreenId === screenId ? null : state.selectedScreenId,
      };
    }),
}));

/**
 * Loads persisted dev overrides once per app session. No-op in production
 * builds and safe to call from multiple mount points.
 */
export async function hydrateThemeTunerStore(): Promise<void> {
  if (!__DEV__ || hydrationStarted) {
    return;
  }

  hydrationStarted = true;

  const persisted = await localJsonStorage.getItem<ThemeTunerOverrides>(OVERRIDES_STORAGE_KEY, {});

  useThemeTunerStore.setState((state) => ({
    hasHydrated: true,
    // In-session edits win over persisted values.
    overrides: { ...persisted, ...state.overrides },
  }));
}
