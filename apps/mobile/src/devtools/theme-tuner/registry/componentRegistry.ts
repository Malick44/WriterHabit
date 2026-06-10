import { useMemo } from "react";

import { useThemeTunerStore } from "../store/themeTunerStore";
import type { TunableComponentConfig } from "../types";

export function registerTunableComponent<TPath extends string>(config: TunableComponentConfig<TPath>): void {
  if (!__DEV__) {
    return;
  }

  useThemeTunerStore.getState().registerComponent(config as TunableComponentConfig);
}

export function unregisterTunableComponent(componentId: string): void {
  if (!__DEV__) {
    return;
  }

  useThemeTunerStore.getState().unregisterComponent(componentId);
}

export function getRegisteredComponents(): readonly TunableComponentConfig[] {
  return Object.values(useThemeTunerStore.getState().components);
}

/** Components registered for a screen, sorted by display name. */
export function useScreenComponents(screenId: string | null): readonly TunableComponentConfig[] {
  const components = useThemeTunerStore((state) => state.components);

  return useMemo(() => {
    if (!screenId) {
      return [];
    }

    return Object.values(components)
      .filter((component) => component.screenId === screenId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [components, screenId]);
}
