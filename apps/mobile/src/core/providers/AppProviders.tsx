import { type PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthSessionProvider } from "@/core/auth/AuthSessionProvider";
import { DevPanelFloatingLauncher } from "@/features/auth/components";
import { AccessibilitySettingsProvider } from "@/features/profile-settings/accessibility";
import { I18nProvider } from "@/i18n";
import { ModalProvider } from "@/shared/components/modals";
import { QueryProvider } from "@/shared/query/QueryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <AccessibilitySettingsProvider>
          <ModalProvider>
            <AuthSessionProvider>
              <QueryProvider>
                {children}
                <DevPanelFloatingLauncher />
              </QueryProvider>
            </AuthSessionProvider>
          </ModalProvider>
        </AccessibilitySettingsProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
