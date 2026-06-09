import { RouteGate } from "@/core/navigation/RouteGate";
import { useI18n } from "@/i18n";

import { PaywallScreen } from "./PaywallScreen";

export function PaywallRouteScreen() {
  const { t } = useI18n();

  return (
    <RouteGate
      area="paywall"
      loadingDescription={t("navigation.loading.description")}
      loadingLabel={t("navigation.loading.title")}
    >
      <PaywallScreen />
    </RouteGate>
  );
}
