import { Stack } from "expo-router";

import { RouteGate } from "@/core/navigation/RouteGate";
import { useI18n } from "@/i18n";

export default function AuthLayout() {
  const { t } = useI18n();

  return (
    <RouteGate
      area="auth"
      loadingDescription={t("navigation.loading.description")}
      loadingLabel={t("navigation.loading.title")}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGate>
  );
}
