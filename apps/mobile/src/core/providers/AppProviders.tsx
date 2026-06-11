import { type PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthSessionProvider } from "@/core/auth/AuthSessionProvider";
import { shouldHideDevTools } from "@/core/config/devtoolsConfig";
import { NotificationResponseHandler } from "@/core/notifications/NotificationResponseHandler";
import { DevPanelFloatingLauncher } from "@/features/auth/components";
import { AccessibilitySettingsProvider } from "@/features/profile-settings/accessibility";
import { I18nProvider } from "@/i18n";
import { ModalProvider } from "@/shared/components/modals";
import { TopAlertProvider } from "@/shared/components/feedback/top-alert";
import { QueryProvider } from "@/shared/query/QueryProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <AccessibilitySettingsProvider>
          <ModalProvider>
            <TopAlertProvider>
              <AuthSessionProvider>
                <QueryProvider>
                  <NotificationResponseHandler />
                  {children}
                  {__DEV__ && !shouldHideDevTools ? <DevPanelFloatingLauncher /> : null}
                </QueryProvider>
              </AuthSessionProvider>
            </TopAlertProvider>
          </ModalProvider>
        </AccessibilitySettingsProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
