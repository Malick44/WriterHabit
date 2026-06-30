import { Image, Text, View } from "react-native";

import { radius, spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { Grade3AdventureCard } from "../Grade3AdventureCard";

const goldBadge = require("../../../../../assets/images/writerhabit-child-home/05_gold_badge_medal.png");
const streakFlame = require("../../../../../assets/images/writerhabit-child-home/08_streak_flame_icon.png");
const books = require("../../../../../assets/images/writerhabit-child-home/06_stacked_books.png");

export function CelebrationStep() {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const rewards = [
    { image: goldBadge, label: t("grade3WritingAdventure.lessonFlow.celebration.stars") },
    { image: streakFlame, label: t("grade3WritingAdventure.lessonFlow.celebration.streak") },
    { image: books, label: t("grade3WritingAdventure.lessonFlow.celebration.complete") },
  ];

  return (
    <View style={{ gap: spacing.md }}>
      <Grade3AdventureCard
        icon="🎉"
        subtitle={t("grade3WritingAdventure.lessonFlow.celebration.message")}
        title={t("grade3WritingAdventure.lessonFlow.celebration.title")}
        variant="success"
      >
        <Text style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
          {t("grade3WritingAdventure.lessonFlow.microcopy.almostDone")}
        </Text>
      </Grade3AdventureCard>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {rewards.map((reward) => (
          <View
            key={reward.label}
            style={{
              alignItems: "center",
              backgroundColor: settings.highContrast ? accessibleColors.surface : "#FFF5D7",
              borderColor: settings.highContrast ? accessibleColors.border : "#E1B858",
              borderRadius: radius.lg,
              borderWidth: 1,
              flex: 1,
              minHeight: 140,
              minWidth: 120,
              padding: spacing.md,
            }}
          >
            <Image
              accessibilityIgnoresInvertColors
              source={reward.image}
              style={{ height: 58, resizeMode: "contain", width: 58 }}
            />
            <Text
              style={[
                getAccessibleTextStyle(type.bodyStrong, settings),
                { color: accessibleColors.text, textAlign: "center" },
              ]}
            >
              {reward.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
