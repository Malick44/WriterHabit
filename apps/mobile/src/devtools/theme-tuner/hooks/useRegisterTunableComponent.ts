import { useEffect } from "react";

import { registerTunableComponent } from "../registry/componentRegistry";
import type { TunableComponentConfig } from "../types";

/**
 * Registers a single component with the dev theme tuner. Define the config at
 * module scope so the effect does not re-run on every render. No-op in
 * production builds.
 */
export function useRegisterTunableComponent<TPath extends string>(
  config: TunableComponentConfig<TPath>,
): void {
  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    registerTunableComponent(config);
  }, [config]);
}

/**
 * Registers a fixed list of components in one effect. Useful when a screen
 * owns several tunable sections that render conditionally.
 */
export function useRegisterTunableComponents<TPath extends string>(
  configs: readonly TunableComponentConfig<TPath>[],
): void {
  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    for (const config of configs) {
      registerTunableComponent(config);
    }
  }, [configs]);
}
