import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button, ErrorState, LoadingState, ProgressBar } from "@/shared/components";
import { colors, radius, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { Grade3AdventureCard } from "../components/Grade3AdventureCard";
import { Grade3Screen } from "../components/Grade3Screen";
import { grade3WritingProgram } from "../content/grade3WritingProgram.content";
import { useGrade3WritingProgress } from "../hooks/useGrade3WritingProgress";
import { isGrade3DayUnlocked } from "../services/grade3WritingProgressModel";

export function Grade3AdventureHomeScreen() {
  const router = useRouter();
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

  const progressValue = progressState.summary.completedDays / progressState.summary.totalDays;

  return (
    <Grade3Screen
      subtitle={t("grade3WritingAdventure.home.subtitle")}
      title={t("grade3WritingAdventure.home.title")}
    >
      <Grade3AdventureCard
        icon="🗺️"
        subtitle={t("grade3WritingAdventure.home.heroSubtitle", {
          completed: progressState.summary.completedDays,
          total: progressState.summary.totalDays,
        })}
        title={t("grade3WritingAdventure.home.heroTitle")}
        variant="peach"
      >
        <ProgressBar
          label={t("grade3WritingAdventure.home.progressAccessibility")}
          value={progressValue}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <Button
            gradeBand="elementary"
            label={t("grade3WritingAdventure.nav.progress")}
            onPress={() => router.push("/(student)/grade3-writing/progress")}
            variant="secondary"
          />
          <Button
            gradeBand="elementary"
            label={t("grade3WritingAdventure.nav.library")}
            onPress={() => router.push("/(student)/grade3-writing/library")}
            variant="secondary"
          />
          <Button
            gradeBand="elementary"
            label={t("grade3WritingAdventure.nav.parentGuide")}
            onPress={() => router.push("/(student)/grade3-writing/parent-guide")}
            variant="ghost"
          />
        </View>
      </Grade3AdventureCard>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        {grade3WritingProgram.map((day) => {
          const progress = progressState.progressMap.get(day.day);
          const unlocked = isGrade3DayUnlocked(day.day, progressState.progress);
          const completed = progress?.completed === true;

          return (
            <View key={day.day} style={{ minWidth: 154, flexBasis: "46%", flexGrow: 1 }}>
              <Grade3AdventureCard
                icon={completed ? "⭐" : day.visualPrompt.emoji}
                style={{
                  opacity: unlocked ? 1 : 0.58,
                  padding: 0,
                }}
                title={t("grade3WritingAdventure.home.dayTitle", { day: day.day })}
                variant={completed ? "success" : unlocked ? "mint" : "cream"}
              >
                <Text
                  numberOfLines={2}
                  style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}
                >
                  {day.title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
                >
                  {day.miniSkill}
                </Text>
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: completed ? colors.feedback.success.background : colors.background.surface,
                    borderColor: completed ? colors.feedback.success.border : colors.border.default,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                  }}
                >
                  <Text style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.text }]}>
                    {completed
                      ? t("grade3WritingAdventure.home.complete")
                      : unlocked
                        ? t("grade3WritingAdventure.home.unlocked")
                        : t("grade3WritingAdventure.home.locked")}
                  </Text>
                </View>
                <Button
                  disabled={!unlocked}
                  gradeBand="elementary"
                  label={
                    completed
                      ? t("grade3WritingAdventure.home.revisitDay")
                      : t("grade3WritingAdventure.home.openDay")
                  }
                  onPress={() => router.push(`/(student)/grade3-writing/${day.day}`)}
                  size="sm"
                  variant={completed ? "secondary" : "primary"}
                />
              </Grade3AdventureCard>
            </View>
          );
        })}
      </View>
    </Grade3Screen>
  );
}
