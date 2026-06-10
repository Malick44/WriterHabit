import { useEffect, useMemo } from "react";

import {
  type ThemeTuningScreenConfig,
  useGlacierThemeStore,
} from "./glacierThemeStore";

export function useThemeTuningScreen(config: ThemeTuningScreenConfig) {
  const clearActiveTuningScreen = useGlacierThemeStore((state) => state.clearActiveTuningScreen);
  const registerTuningScreen = useGlacierThemeStore((state) => state.registerTuningScreen);
  const setActiveTuningScreen = useGlacierThemeStore((state) => state.setActiveTuningScreen);
  const unregisterTuningScreen = useGlacierThemeStore((state) => state.unregisterTuningScreen);

  useEffect(() => {
    registerTuningScreen(config);
    setActiveTuningScreen(config.id);

    return () => {
      clearActiveTuningScreen(config.id);
      unregisterTuningScreen(config.id);
    };
  }, [
    clearActiveTuningScreen,
    config,
    registerTuningScreen,
    setActiveTuningScreen,
    unregisterTuningScreen,
  ]);
}

export function useScreenThemeValues<T extends object>(screenId: string, defaultValues: T): T {
  const overrides = useGlacierThemeStore((state) => state.screenThemeOverrides[screenId]);

  return useMemo(
    () =>
      ({
        ...defaultValues,
        ...(overrides ?? {}),
      }) as T,
    [defaultValues, overrides],
  );
}
