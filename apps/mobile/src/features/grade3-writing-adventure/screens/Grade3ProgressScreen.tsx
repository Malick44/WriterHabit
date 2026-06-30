import { Text, View } from "react-native";

import { ErrorState, LoadingState, ProgressBar } from "@/shared/components";
import { spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { Grade3AdventureCard } from "../components/Grade3AdventureCard";
import { Grade3Screen } from "../components/Grade3Screen";
import { Grade3TopActions } from "../components/Grade3TopActions";
import { useGrade3WritingProgress } from "../hooks/useGrade3WritingProgress";

const BADGE_MILESTONES = [1, 5, 10, 20, 30] as const;

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

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        {BADGE_MILESTONES.map((milestone) => {
          const earned = progressState.summary.completedDays >= milestone;

          return (
            <View key={milestone} style={{ flexBasis: "45%", flexGrow: 1 }}>
              <Grade3AdventureCard
                icon={earned ? "🏅" : "🔒"}
                subtitle={
                  earned
                    ? t("grade3WritingAdventure.progress.badgeEarned")
                    : t("grade3WritingAdventure.progress.badgeLocked", { count: milestone })
                }
                title={t("grade3WritingAdventure.progress.badgeTitle", { count: milestone })}
                variant={earned ? "success" : "cream"}
              />
            </View>
          );
        })}
      </View>
    </Grade3Screen>
  );
}
