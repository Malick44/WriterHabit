import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button, EmptyState, ErrorState, LoadingState } from "@/shared/components";
import { spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { Grade3AdventureCard } from "../components/Grade3AdventureCard";
import { Grade3Screen } from "../components/Grade3Screen";
import { Grade3TopActions } from "../components/Grade3TopActions";
import { grade3WritingProgram } from "../content/grade3WritingProgram.content";
import { useGrade3WritingProgress } from "../hooks/useGrade3WritingProgress";

export function Grade3LibraryScreen() {
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

  const savedDrafts = progressState.progress.filter(
    (progress) => progress.draft.trim().length > 0 || progress.strongerSentence.trim().length > 0,
  );

  return (
    <Grade3Screen
      subtitle={t("grade3WritingAdventure.library.subtitle")}
      title={t("grade3WritingAdventure.library.title")}
    >
      <Grade3TopActions />
      {savedDrafts.length === 0 ? (
        <EmptyState
          description={t("grade3WritingAdventure.library.emptyDescription")}
          title={t("grade3WritingAdventure.library.emptyTitle")}
        />
      ) : (
        savedDrafts.map((progress) => {
          const lesson = grade3WritingProgram[progress.day - 1];

          return (
            <Grade3AdventureCard
              icon={lesson.visualPrompt.emoji}
              key={progress.day}
              subtitle={lesson.writingPrompt}
              title={t("grade3WritingAdventure.library.dayTitle", { day: progress.day, title: lesson.title })}
              variant={progress.completed ? "success" : "sky"}
            >
              <View style={{ gap: spacing.sm }}>
                <Text
                  numberOfLines={5}
                  selectable
                  style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}
                >
                  {progress.draft || progress.strongerSentence}
                </Text>
                {progress.favoriteSentence ? (
                  <Text
                    selectable
                    style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
                  >
                    {t("grade3WritingAdventure.library.favoritePrefix", { sentence: progress.favoriteSentence })}
                  </Text>
                ) : null}
                <Button
                  gradeBand="elementary"
                  label={t("grade3WritingAdventure.library.openDraft")}
                  onPress={() => router.push(`/(student)/grade3-writing/${progress.day}`)}
                  variant="secondary"
                />
              </View>
            </Grade3AdventureCard>
          );
        })
      )}
    </Grade3Screen>
  );
}
