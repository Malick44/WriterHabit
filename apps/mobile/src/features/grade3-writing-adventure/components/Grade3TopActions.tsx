import { View } from "react-native";
import { useRouter } from "expo-router";

import { Button } from "@/shared/components";
import { spacing } from "@/design/tokens";
import { useI18n } from "@/i18n";

export function Grade3TopActions() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      <Button
        gradeBand="elementary"
        label={t("grade3WritingAdventure.nav.map")}
        onPress={() => router.push("/(student)/grade3-writing")}
        size="sm"
        variant="secondary"
      />
      <Button
        gradeBand="elementary"
        label={t("grade3WritingAdventure.nav.progress")}
        onPress={() => router.push("/(student)/grade3-writing/progress")}
        size="sm"
        variant="secondary"
      />
      <Button
        gradeBand="elementary"
        label={t("grade3WritingAdventure.nav.library")}
        onPress={() => router.push("/(student)/grade3-writing/library")}
        size="sm"
        variant="secondary"
      />
    </View>
  );
}
