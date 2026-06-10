import { useMemo } from "react";

import { EMPTY_TOKEN_OVERRIDES, useThemeTunerStore } from "../store/themeTunerStore";
import type { TokenOverrides, TokenValue } from "../types";

/** Single merged token value: dev override when present, otherwise fallback. */
export function useTunableToken<TPath extends string>(
  screenId: string,
  path: TPath,
  fallback: TokenValue,
): TokenValue {
  return useThemeTunerStore((state) => state.overrides[screenId]?.[path] ?? fallback);
}

/**
 * Raw dev overrides for one screen. Returns a stable empty object (always in
 * production) so callers can cheaply skip style work when nothing is tuned.
 */
export function useTunableTokenOverrides<TPath extends string>(screenId: string): TokenOverrides<TPath> {
  return useThemeTunerStore(
    (state) => (state.overrides[screenId] ?? EMPTY_TOKEN_OVERRIDES) as TokenOverrides<TPath>,
  );
}

/**
 * Base token values merged with dev overrides. Returns the defaults object
 * itself (identity-stable) when no overrides exist, which is always the case
 * in production builds.
 */
export function useTunableTokens<TDefaults extends Record<string, TokenValue>>(
  screenId: string,
  defaults: TDefaults,
): TDefaults {
  const overrides = useTunableTokenOverrides(screenId);

  return useMemo(() => {
    if (Object.keys(overrides).length === 0) {
      return defaults;
    }

    return { ...defaults, ...overrides } as TDefaults;
  }, [defaults, overrides]);
}
