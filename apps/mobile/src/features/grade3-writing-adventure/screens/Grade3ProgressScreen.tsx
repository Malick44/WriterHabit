import { Text, View } from "react-native";

import { ErrorState, LoadingState, ProgressBar } from "@/shared/components";
import { spacing, typography } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { Grade3AdventureCard } from "../components/Grade3AdventureCard";
import { Grade3Screen } from "../components/Grade3Screen";
import { Grade3TopActions } from "../components/Grade3TopActions";
import { useGrade3WritingProgress } from "../hooks/useGrade3WritingProgress";

const BADGES = [
  {
    earnedIcon: "🌱",
    lockedIcon: "🔒",
    milestone: 1,
    subtitleKey: "grade3WritingAdventure.progress.badges.day1Subtitle",
    titleKey: "grade3WritingAdventure.progress.badges.day1Title",
  },
  {
    earnedIcon: "✏️",
    lockedIcon: "🔒",
    milestone: 5,
    subtitleKey: "grade3WritingAdventure.progress.badges.day5Subtitle",
    titleKey: "grade3WritingAdventure.progress.badges.day5Title",
  },
  {
    earnedIcon: "📚",
    lockedIcon: "🔒",
    milestone: 10,
    subtitleKey: "grade3WritingAdventure.progress.badges.day10Subtitle",
    titleKey: "grade3WritingAdventure.progress.badges.day10Title",
  },
  {
    earnedIcon: "🚀",
    lockedIcon: "🔒",
    milestone: 20,
    subtitleKey: "grade3WritingAdventure.progress.badges.day20Subtitle",
    titleKey: "grade3WritingAdventure.progress.badges.day20Title",
  },
  {
    earnedIcon: "🏆",
    lockedIcon: "🔒",
    milestone: 30,
    subtitleKey: "grade3WritingAdventure.progress.badges.day30Subtitle",
    titleKey: "grade3WritingAdventure.progress.badges.day30Title",
  },
] satisfies {
  earnedIcon: string;
  lockedIcon: string;
  milestone: number;
  subtitleKey: TranslationKey;
  titleKey: TranslationKey;
}[];

export function Grade3ProgressScreen() {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const progressState = useGrade3WritingProgress();

  if (progressState.status === "loading") {
    return (
      <Grade3Screen>
        <LoadingState
          label={t("grade3WritingAdventure.states.loadingTitle")}
          description={t("grade3WritingAdventure.states.loadingDescription")}
        />
      </Grade3Screen>
    );
  }

  if (progressState.status === "error") {
    return (
      <Grade3Screen>
        <ErrorState
          description={t("grade3WritingAdventure.states.errorDescription")}
          onActionPress={progressState.refresh}
          actionLabel={t("common.retry")}
          title={t("grade3WritingAdventure.states.errorTitle")}
        />
      </Grade3Screen>
    );
  }

  return (
    <Grade3Screen
      subtitle={t("grade3WritingAdventure.progress.subtitle")}
      title={t("grade3WritingAdventure.progress.title")}
    >
      <Grade3TopActions />
      <Grade3AdventureCard
        icon="🌟"
        subtitle={t("grade3WritingAdventure.progress.summarySubtitle", {
          completed: progressState.summary.completedDays,
          total: progressState.summary.totalDays,
        })}
        title={t("grade3WritingAdventure.progress.summaryTitle")}
        variant="peach"
      >
        <ProgressBar
          label={t("grade3WritingAdventure.progress.progressAccessibility")}
          value={progressState.summary.completedDays / progressState.summary.totalDays}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {[
            t("grade3WritingAdventure.progress.streakStat", { count: progressState.summary.currentStreakDays }),
            t("grade3WritingAdventure.progress.unlockedStat", { count: progressState.summary.unlockedDays }),
            t("grade3WritingAdventure.progress.draftStat", { count: progressState.summary.draftDays }),
            t("grade3WritingAdventure.progress.completedStat", { count: progressState.summary.completedDays }),
          ].map((stat) => (
            <Text
              key={stat}
              style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}
            >
              {stat}
            </Text>
          ))}
        </View>
      </Grade3AdventureCard>

      <Grade3AdventureCard
        icon="🔥"
        subtitle={t("grade3WritingAdventure.progress.streakSubtitle")}
        title={t("grade3WritingAdventure.progress.streakTitle", {
          count: progressState.summary.currentStreakDays,
        })}
        variant="mint"
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        {BADGES.map((badge) => {
          const earned = progressState.summary.completedDays >= badge.milestone;

          return (
            <View key={badge.milestone} style={{ flexBasis: "45%", flexGrow: 1 }}>
              <Grade3AdventureCard
                icon={earned ? badge.earnedIcon : badge.lockedIcon}
                subtitle={
                  earned
                    ? t(badge.subtitleKey)
                    : t("grade3WritingAdventure.progress.badgeLocked", { count: badge.milestone })
                }
                title={t(badge.titleKey)}
                variant={earned ? "success" : "cream"}
              />
            </View>
          );
        })}
      </View>
    </Grade3Screen>
  );
}
