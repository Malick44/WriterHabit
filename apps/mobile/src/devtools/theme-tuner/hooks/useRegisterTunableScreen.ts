import { useEffect } from "react";

import { registerTunableScreen } from "../registry/screenRegistry";
import { useThemeTunerStore } from "../store/themeTunerStore";
import type { TunableScreenConfig } from "../types";

/**
 * Registers a screen with the dev theme tuner and tracks it as the active
 * tuning target while mounted. Define the config at module scope so the
 * effect does not re-run on every render. No-op in production builds.
 *
 * Screens intentionally stay in the registry after unmount so their
 * overrides remain browsable from the panel; only the active marker is
 * cleared.
 */
export function useRegisterTunableScreen<TPath extends string>(config: TunableScreenConfig<TPath>): void {
  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    registerTunableScreen(config);
    useThemeTunerStore.getState().setActiveScreen(config.id);

    return () => {
      useThemeTunerStore.getState().clearActiveScreen(config.id);
    };
  }, [config]);
}
