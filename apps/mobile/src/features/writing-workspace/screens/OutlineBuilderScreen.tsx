import { Text } from "react-native";

import { useI18n } from "@/i18n";
import { Screen } from "@/shared/components/layout/Screen";

export function OutlineBuilderScreen() {
  const { t } = useI18n();

  return (
    <Screen title={t("writingWorkspace.outlineTitle")}>
      <Text>{t("writingWorkspace.outlinePlaceholderDescription")}</Text>
    </Screen>
  );
}
