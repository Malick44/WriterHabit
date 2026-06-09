import { Stack } from "expo-router";

import { RouteGate } from "@/core/navigation/RouteGate";
import { useI18n } from "@/i18n";

export default function OnboardingLayout() {
  const { t } = useI18n();

  return (
    <RouteGate
      area="onboarding"
      loadingDescription={t("navigation.loading.description")}
      loadingLabel={t("navigation.loading.title")}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGate>
  );
}
