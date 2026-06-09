import { Text } from "react-native";

import { useI18n } from "@/i18n";
import { Screen } from "@/shared/components/layout/Screen";

export function StudentProfileScreen() {
  const { t } = useI18n();

  return (
    <Screen title={t("profileSettings.studentProfileTitle")}>
      <Text>{t("profileSettings.studentProfilePlaceholderDescription")}</Text>
    </Screen>
  );
}
