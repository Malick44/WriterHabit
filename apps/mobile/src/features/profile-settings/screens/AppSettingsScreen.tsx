import { Text } from "react-native";

import { useI18n } from "@/i18n";
import { Screen } from "@/shared/components/layout/Screen";

export function AppSettingsScreen() {
  const { t } = useI18n();

  return (
    <Screen title={t("profileSettings.appSettingsTitle")}>
      <Text>{t("profileSettings.appSettingsPlaceholderDescription")}</Text>
    </Screen>
  );
}
