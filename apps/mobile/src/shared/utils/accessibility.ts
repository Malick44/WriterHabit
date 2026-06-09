import { createContext, createElement, useContext, type ReactNode } from "react";
import type { AccessibilityState, Insets, TextStyle } from "react-native";

import { colors, layout, palette } from "@/design/tokens";

export type AccessibilityTextSize = "default" | "large" | "extraLarge";

export type AccessibilitySettings = {
  textSize: AccessibilityTextSize;
  dyslexiaFriendlyFont: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  textToSpeech: boolean;
  speechToText: boolean;
  simplifiedUi: boolean;
};

export type AccessibilitySettingsError = "read_failed" | "write_failed" | null;

export type AccessibilityContextValue = {
  settings: AccessibilitySettings;
  hydrated: boolean;
  error: AccessibilitySettingsError;
};

export const defaultAccessibilitySettings: AccessibilitySettings = {
  textSize: "default",
  dyslexiaFriendlyFont: false,
  highContrast: false,
  reducedMotion: false,
  textToSpeech: false,
  speechToText: false,
  simplifiedUi: false,
};

const defaultAccessibilityContext: AccessibilityContextValue = {
  settings: defaultAccessibilitySettings,
  hydrated: true,
  error: null,
};

const AccessibilityContext = createContext<AccessibilityContextValue>(defaultAccessibilityContext);

export function AccessibilityContextProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AccessibilityContextValue;
}) {
  return createElement(AccessibilityContext.Provider, { value }, children);
}

export function useAccessibilityContext() {
  return useContext(AccessibilityContext);
}

export function getTextScaleMultiplier(textSize: AccessibilityTextSize): number {
  switch (textSize) {
    case "large":
      return 1.14;
    case "extraLarge":
      return 1.28;
    case "default":
      return 1;
  }
}

export function getMinimumTouchTarget(settings: AccessibilitySettings): number {
  if (settings.textSize === "extraLarge" || settings.simplifiedUi) {
    return 56;
  }

  if (settings.textSize === "large") {
    return layout.touchTargetLarge;
  }

  return layout.touchTarget;
}

export function getAccessibleHitSlop(settings: AccessibilitySettings): Insets {
  if (settings.textSize === "extraLarge" || settings.simplifiedUi) {
    return {
      top: 12,
      right: 12,
      bottom: 12,
      left: 12,
    };
  }

  return layout.hitSlop;
}

export function getAccessibleTextStyle<T extends TextStyle>(
  baseStyle: T,
  settings: AccessibilitySettings,
): TextStyle {
  const multiplier = getTextScaleMultiplier(settings.textSize);
  const fontSize = typeof baseStyle.fontSize === "number" ? Math.round(baseStyle.fontSize * multiplier) : undefined;
  const lineHeight =
    typeof baseStyle.lineHeight === "number"
      ? Math.round(baseStyle.lineHeight * multiplier * (settings.dyslexiaFriendlyFont ? 1.08 : 1))
      : undefined;
  const baseLetterSpacing = typeof baseStyle.letterSpacing === "number" ? baseStyle.letterSpacing : 0;

  return {
    ...baseStyle,
    fontFamily: settings.dyslexiaFriendlyFont ? "System" : baseStyle.fontFamily,
    fontSize,
    letterSpacing: settings.dyslexiaFriendlyFont ? Math.max(baseLetterSpacing, 0.3) : baseStyle.letterSpacing,
    lineHeight,
  };
}

export function getAccessibleColors(settings: AccessibilitySettings) {
  if (!settings.highContrast) {
    return {
      background: colors.background.app,
      surface: colors.background.surface,
      text: colors.text.primary,
      mutedText: colors.text.secondary,
      border: colors.border.strong,
      actionBackground: colors.action.primary.background,
      actionForeground: colors.action.primary.foreground,
      focus: colors.border.focus,
    };
  }

  return {
    background: palette.white,
    surface: palette.white,
    text: palette.black,
    mutedText: palette.slate[900],
    border: palette.black,
    actionBackground: palette.black,
    actionForeground: palette.white,
    focus: palette.black,
  };
}

export function getMotionDuration(settings: AccessibilitySettings, durationMs: number): number {
  return settings.reducedMotion ? 0 : durationMs;
}

export function buildAccessibilityLabel(parts: Array<string | number | null | undefined>): string {
  return parts
    .filter((part): part is string | number => part !== null && part !== undefined && String(part).trim().length > 0)
    .map((part) => String(part).trim())
    .join(", ");
}

export function mergeAccessibilityState(
  ...states: Array<AccessibilityState | null | undefined>
): AccessibilityState {
  return states.reduce<AccessibilityState>((merged, state) => {
    if (!state) {
      return merged;
    }

    return {
      ...merged,
      ...state,
    };
  }, {});
}
