import { useEffect, useMemo, type ReactNode } from "react";

import { AccessibilityContextProvider, type AccessibilityContextValue } from "@/shared/utils/accessibility";

import { useAccessibilitySettingsStore } from "./accessibilitySettingsStore";

export function AccessibilitySettingsProvider({ children }: { children: ReactNode }) {
  const { error, hydrateSettings, hydrated, settings } = useAccessibilitySettingsStore();

  useEffect(() => {
    void hydrateSettings();
  }, [hydrateSettings]);

  const contextValue = useMemo<AccessibilityContextValue>(
    () => ({
      error,
      hydrated,
      settings,
    }),
    [error, hydrated, settings],
  );

  return <AccessibilityContextProvider value={contextValue}>{children}</AccessibilityContextProvider>;
}
