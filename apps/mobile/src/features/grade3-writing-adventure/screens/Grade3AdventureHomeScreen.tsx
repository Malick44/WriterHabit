import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader, Button, ErrorState, LoadingState, ProgressBar } from "@/shared/components";
import { colors, radius, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { Grade3AdventureCard } from "../components/Grade3AdventureCard";
import { Grade3Screen } from "../components/Grade3Screen";
import { grade3WritingProgram } from "../content/grade3WritingProgram.content";
import { grade3Theme } from "../theme/grade3Theme";
import { useGrade3WritingProgress } from "../hooks/useGrade3WritingProgress";
import { isGrade3DayUnlocked } from "../services/grade3WritingProgressModel";

/** Dashboard-style shell: fixed compact header above the scrolling content. */
function Grade3AdventureShell({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <View style={{ backgroundColor: grade3Theme.screen.background, flex: 1 }}>
      <SafeAreaView edges={["top"]}>
        <AppHeader
          gradeBand="elementary"
          leftAction={{ accessibilityLabelKey: "common.back", type: "back" }}
          showSafeArea={false}
          style={{ backgroundColor: grade3Theme.screen.background }}
          titleKey="grade3WritingAdventure.home.title"
          variant="compact"
        />
      </SafeAreaView>
      <Grade3Screen contentPaddingTop={spacing.md} subtitle={subtitle}>
        {children}
      </Grade3Screen>
    </View>
  );
}

export function Grade3AdventureHomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const progressState = useGrade3WritingProgress();

  if (progressState.status === "loading") {
    return (
      <Grade3AdventureShell>
        <LoadingState
          label={t("grade3WritingAdventure.states.loadingTitle")}
          description={t("grade3WritingAdventure.states.loadingDescription")}
        />
      </Grade3AdventureShell>
    );
  }

  if (progressState.status === "error") {
    return (
      <Grade3AdventureShell>
        <ErrorState
          description={t("grade3WritingAdventure.states.errorDescription")}
          onActionPress={progressState.refresh}
          actionLabel={t("common.retry")}
          title={t("grade3WritingAdventure.states.errorTitle")}
        />
      </Grade3AdventureShell>
    );
  }

  const progressValue = progressState.summary.completedDays / progressState.summary.totalDays;

  return (
    <Grade3AdventureShell subtitle={t("grade3WritingAdventure.home.subtitle")}>
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
                icon={completed ? "⭐" : unlocked ? day.visualPrompt.emoji : "🔒"}
                style={{
                  opacity: unlocked ? 1 : 0.72,
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
    </Grade3AdventureShell>
  );
}
