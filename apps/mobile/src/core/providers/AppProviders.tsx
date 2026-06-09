import { type PropsWithChildren } from "react";

import { AuthSessionProvider } from "@/core/auth/AuthSessionProvider";
import { AccessibilitySettingsProvider } from "@/features/profile-settings/accessibility";
import { I18nProvider } from "@/i18n";
import { QueryProvider } from "@/shared/query/QueryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <I18nProvider>
      <AccessibilitySettingsProvider>
        <AuthSessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthSessionProvider>
      </AccessibilitySettingsProvider>
    </I18nProvider>
  );
}
