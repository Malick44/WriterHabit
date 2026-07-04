import { type PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthSessionProvider } from "@/core/auth/AuthSessionProvider";
import { useAuthSession } from "@/core/auth/useAuthSession";
import { shouldHideDevTools } from "@/core/config/devtoolsConfig";
import { NotificationResponseHandler } from "@/core/notifications/NotificationResponseHandler";
import { ReadAloudVoiceBootstrap } from "@/core/speech/ReadAloudVoiceBootstrap";
import { typography } from "@/design/tokens";
import { DevPanelFloatingLauncher } from "@/features/auth/components";
import { AccessibilitySettingsProvider } from "@/features/profile-settings/accessibility";
import { I18nProvider } from "@/i18n";
import { ModalProvider } from "@/shared/components/modals";
import { TopAlertProvider } from "@/shared/components/feedback/top-alert";
import { GradeBandProvider } from "@/shared/utils/gradeBand";
import { QueryProvider } from "@/shared/query/QueryProvider";

function SessionGradeBandProvider({ children }: PropsWithChildren) {
  const { session } = useAuthSession();
  const gradeLevel = session?.user.gradeLevel;
  const gradeBand = gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : undefined;

  return <GradeBandProvider gradeBand={gradeBand}>{children}</GradeBandProvider>;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <AccessibilitySettingsProvider>
          <ModalProvider>
            <TopAlertProvider>
              <AuthSessionProvider>
                <SessionGradeBandProvider>
                  <QueryProvider>
                    <NotificationResponseHandler />
                    <ReadAloudVoiceBootstrap />
                    {children}
                    {__DEV__ && !shouldHideDevTools ? <DevPanelFloatingLauncher /> : null}
                  </QueryProvider>
                </SessionGradeBandProvider>
              </AuthSessionProvider>
            </TopAlertProvider>
          </ModalProvider>
        </AccessibilitySettingsProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
