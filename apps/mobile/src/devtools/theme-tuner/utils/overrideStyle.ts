import type { ImageStyle, TextStyle, ViewStyle } from "react-native";

/**
 * Builds a style object from possibly-undefined override values, dropping
 * undefined entries. Returns null when nothing is overridden so it can be
 * placed in a style array with zero effect (the production path).
 */
export function overrideStyle<TStyle extends ViewStyle | TextStyle | ImageStyle>(
  style: TStyle,
): TStyle | null {
  const pruned = {} as TStyle;
  let hasValue = false;

  for (const key of Object.keys(style) as (keyof TStyle)[]) {
    const value = style[key];

    if (value !== undefined) {
      pruned[key] = value;
      hasValue = true;
    }
  }

  return hasValue ? pruned : null;
}

/**
 * Same pruning for plain prop records (e.g. a component's color-override
 * prop). Returns undefined when nothing is overridden so memoized components
 * keep their fast path in production.
 */
export function overrideRecord<T extends Record<string, unknown>>(
  values: { [K in keyof T]: T[K] | undefined },
): Partial<T> | undefined {
  const pruned: Partial<T> = {};
  let hasValue = false;

  for (const key of Object.keys(values) as (keyof T)[]) {
    const value = values[key];

    if (value !== undefined) {
      pruned[key] = value;
      hasValue = true;
    }
  }

  return hasValue ? pruned : undefined;
}
