import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "@/shared/components";
import { spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { Grade3AdventureCard } from "../components/Grade3AdventureCard";
import { Grade3Screen } from "../components/Grade3Screen";
import { Grade3TopActions } from "../components/Grade3TopActions";
import { grade3Theme } from "../theme/grade3Theme";

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
    <View style={{ backgroundColor: grade3Theme.screen.background, flex: 1 }}>
      {/* Fixed header above the scroll area, mirroring the dashboard layout. */}
      <SafeAreaView edges={["top"]}>
        <AppHeader
          gradeBand="elementary"
          leftAction={{
            accessibilityLabelKey: "common.back",
            type: "back",
          }}
          showSafeArea={false}
          style={{ backgroundColor: grade3Theme.screen.background }}
          subtitleKey="grade3WritingAdventure.parentGuide.subtitle"
          titleKey="grade3WritingAdventure.parentGuide.title"
          variant="compact"
        />
      </SafeAreaView>
      <Grade3Screen contentPaddingTop={spacing.md}>
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
              style={[
                getAccessibleTextStyle(type.body, settings),
                { color: accessibleColors.text },
              ]}
            >
              {item}
            </Text>
          ))}
        </Grade3AdventureCard>
        <Grade3AdventureCard
          icon="✍️"
          subtitle={t("grade3WritingAdventure.parentGuide.handwritingSubtitle")}
          title={t("grade3WritingAdventure.parentGuide.handwritingTitle")}
          variant="sky"
        >
          <View style={{ gap: spacing.md }}>
            {[
              t("grade3WritingAdventure.parentGuide.handwritingItemCanvas"),
              t("grade3WritingAdventure.parentGuide.handwritingItemNotebook"),
              t("grade3WritingAdventure.parentGuide.handwritingItemTypedCopy"),
            ].map((item) => (
              <Text
                key={item}
                selectable
                style={[
                  getAccessibleTextStyle(type.body, settings),
                  { color: accessibleColors.text },
                ]}
              >
                {item}
              </Text>
            ))}
          </View>
        </Grade3AdventureCard>
        <Grade3AdventureCard
          icon="🗓️"
          subtitle={t("grade3WritingAdventure.parentGuide.routineSubtitle")}
          title={t("grade3WritingAdventure.parentGuide.routineTitle")}
          variant="cream"
        >
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.body, settings),
              { color: accessibleColors.text },
            ]}
          >
            {t("grade3WritingAdventure.parentGuide.routineBody")}
          </Text>
        </Grade3AdventureCard>
        <Grade3AdventureCard
          icon="🛡️"
          subtitle={t("grade3WritingAdventure.parentGuide.safetySubtitle")}
          title={t("grade3WritingAdventure.parentGuide.safetyTitle")}
          variant="peach"
        >
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.body, settings),
              { color: accessibleColors.text },
            ]}
          >
            {t("grade3WritingAdventure.parentGuide.safetyBody")}
          </Text>
        </Grade3AdventureCard>
      </Grade3Screen>
    </View>
  );
}
