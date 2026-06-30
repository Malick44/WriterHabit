import { Text } from "react-native";

import { typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { Grade3AdventureCard } from "../components/Grade3AdventureCard";
import { Grade3Screen } from "../components/Grade3Screen";
import { Grade3TopActions } from "../components/Grade3TopActions";

export function Grade3ParentGuideScreen() {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const guideItems = [
    t("grade3WritingAdventure.parentGuide.itemRead"),
    t("grade3WritingAdventure.parentGuide.itemTalk"),
    t("grade3WritingAdventure.parentGuide.itemWait"),
    t("grade3WritingAdventure.parentGuide.itemCelebrate"),
  ];

  return (
    <Grade3Screen
      subtitle={t("grade3WritingAdventure.parentGuide.subtitle")}
      title={t("grade3WritingAdventure.parentGuide.title")}
    >
      <Grade3TopActions />
      <Grade3AdventureCard
        icon="👨‍👩‍👧"
        subtitle={t("grade3WritingAdventure.parentGuide.cardSubtitle")}
        title={t("grade3WritingAdventure.parentGuide.cardTitle")}
        variant="mint"
      >
        {guideItems.map((item) => (
          <Text
            key={item}
            selectable
            style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}
          >
            {item}
          </Text>
        ))}
      </Grade3AdventureCard>
      <Grade3AdventureCard
        icon="🛡️"
        subtitle={t("grade3WritingAdventure.parentGuide.safetySubtitle")}
        title={t("grade3WritingAdventure.parentGuide.safetyTitle")}
        variant="peach"
      >
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
          {t("grade3WritingAdventure.parentGuide.safetyBody")}
        </Text>
      </Grade3AdventureCard>
    </Grade3Screen>
  );
}
