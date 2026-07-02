import { useEffect, useState } from "react";
import { Animated, Image, Text, View, type ImageSourcePropType } from "react-native";

import { radius, spacing, typography } from "@/design/tokens";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useI18n } from "@/i18n";

import { Grade3AdventureCard } from "../Grade3AdventureCard";
import { grade3Theme } from "../../theme/grade3Theme";

const goldBadge = require("../../../../../assets/images/writerhabit-child-home/05_gold_badge_medal.png");
const streakFlame = require("../../../../../assets/images/writerhabit-child-home/08_streak_flame_icon.png");
const books = require("../../../../../assets/images/writerhabit-child-home/06_stacked_books.png");

type RewardCardProps = {
  delay: number;
  image: ImageSourcePropType;
  label: string;
};

/** Reward card that pops in with a springy scale so finishing a day feels earned. */
function RewardCard({ delay, image, label }: RewardCardProps) {
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const [scale] = useState(() => new Animated.Value(settings.reducedMotion ? 1 : 0.4));
  const [opacity] = useState(() => new Animated.Value(settings.reducedMotion ? 1 : 0));

  useEffect(() => {
    if (settings.reducedMotion) {
      return;
    }

    const animation = Animated.parallel([
      Animated.spring(scale, {
        delay,
        friction: 5,
        tension: 90,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        delay,
        duration: 220,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [delay, opacity, scale, settings.reducedMotion]);

  return (
    <Animated.View
      style={{
        alignItems: "center",
        backgroundColor: settings.highContrast ? accessibleColors.surface : grade3Theme.chip.background,
        borderColor: settings.highContrast ? accessibleColors.border : grade3Theme.chip.border,
        borderRadius: radius.lg,
        borderWidth: 1,
        flex: 1,
        gap: spacing.sm,
        justifyContent: "center",
        minHeight: 140,
        minWidth: 120,
        opacity,
        padding: spacing.md,
        transform: [{ scale }],
      }}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={image}
        style={{ height: 58, resizeMode: "contain", width: 58 }}
      />
      <Text
        style={[
          getAccessibleTextStyle(type.bodyStrong, settings),
          { color: accessibleColors.text, textAlign: "center" },
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

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
        {rewards.map((reward, index) => (
          <RewardCard delay={index * 160} image={reward.image} key={reward.label} label={reward.label} />
        ))}
      </View>
    </View>
  );
}
