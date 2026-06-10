import { useThemeTunerStore } from "../store/themeTunerStore";
import type { TunableScreenConfig } from "../types";

export function registerTunableScreen<TPath extends string>(config: TunableScreenConfig<TPath>): void {
  if (!__DEV__) {
    return;
  }

  useThemeTunerStore.getState().registerScreen(config as TunableScreenConfig);
}

export function unregisterTunableScreen(screenId: string): void {
  if (!__DEV__) {
    return;
  }

  useThemeTunerStore.getState().unregisterScreen(screenId);
}

export function getRegisteredScreens(): readonly TunableScreenConfig[] {
  return Object.values(useThemeTunerStore.getState().screens);
}

export function useRegisteredScreens(): Record<string, TunableScreenConfig> {
  return useThemeTunerStore((state) => state.screens);
}
