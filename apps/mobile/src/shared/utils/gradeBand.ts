import { createContext, createElement, useContext, type ReactNode } from "react";

import type { GradeBand } from "@/design/tokens";

const defaultGradeBand: GradeBand = "middle";

const GradeBandContext = createContext<GradeBand | null>(null);

export function GradeBandProvider({
  children,
  gradeBand,
}: {
  children: ReactNode;
  gradeBand?: GradeBand;
}) {
  return createElement(GradeBandContext.Provider, { value: gradeBand ?? null }, children);
}

/**
 * Resolves the effective grade band for shared primitives:
 * an explicit `gradeBand` prop wins, then the nearest `GradeBandProvider`,
 * then the `"middle"` default.
 */
export function useGradeBand(gradeBand?: GradeBand): GradeBand {
  const contextGradeBand = useContext(GradeBandContext);

  return gradeBand ?? contextGradeBand ?? defaultGradeBand;
}
