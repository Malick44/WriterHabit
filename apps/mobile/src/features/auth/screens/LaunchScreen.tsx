import { Redirect } from "expo-router";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { getLaunchRoute } from "@/core/navigation/roleRouter";
import { useI18n } from "@/i18n";
import { LoadingState } from "@/shared/components/feedback";

export function LaunchScreen() {
  const { t } = useI18n();
  const { status, session } = useAuthSession();

  if (status === "hydrating") {
    return (
      <LoadingState
        description={t("navigation.loading.description")}
        label={t("navigation.loading.title")}
      />
    );
  }

  return <Redirect href={getLaunchRoute(session)} />;
}
