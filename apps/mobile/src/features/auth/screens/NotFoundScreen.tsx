import { useRouter } from "expo-router";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { getLaunchRoute } from "@/core/navigation/roleRouter";
import { routes } from "@/core/navigation/routeNames";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { ErrorState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout/Screen";

export function NotFoundScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { signOut, status, session } = useAuthSession();

  const route = status === "ready" ? getLaunchRoute(session) : routes.launch;

  return (
    <Screen
      subtitle={t("navigation.fallback.description")}
      title={t("navigation.fallback.title")}
    >
      <ErrorState
        actionLabel={t("navigation.fallback.goHome")}
        description={t("navigation.fallback.recovery")}
        onActionPress={() => router.replace(route)}
        title={t("navigation.fallback.cardTitle")}
      />
      <Button
        label={t("navigation.fallback.signOut")}
        onPress={() => {
          void signOut().finally(() => {
            router.replace(routes.authWelcome);
          });
        }}
        variant="ghost"
      />
    </Screen>
  );
}
