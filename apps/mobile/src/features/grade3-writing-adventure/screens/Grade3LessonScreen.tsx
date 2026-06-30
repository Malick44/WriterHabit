import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { Button, ErrorState, LoadingState, TextField } from "@/shared/components";
import { spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { Grade3AdventureCard } from "../components/Grade3AdventureCard";
import { Grade3ChecklistCard } from "../components/Grade3ChecklistCard";
import { Grade3Screen } from "../components/Grade3Screen";
import { Grade3TopActions } from "../components/Grade3TopActions";
import { ReadAloudCard } from "../components/ReadAloudCard";
import { WordBankChips } from "../components/WordBankChips";
import { grade3WritingProgram } from "../content/grade3WritingProgram.content";
import { useGrade3WritingProgress } from "../hooks/useGrade3WritingProgress";
import { isGrade3DayUnlocked } from "../services/grade3WritingProgressModel";
import type { Grade3ChecklistState, Grade3WritingDay, Grade3WritingProgress, Grade3WritingProgressInput } from "../types";

const AUTOSAVE_DELAY_MS = 650;

export function Grade3LessonScreen() {
  const { day: dayParam } = useLocalSearchParams<{ day?: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const dayNumber = Number(dayParam);
  const lesson = grade3WritingProgram.find((item) => item.day === dayNumber);
  const progressState = useGrade3WritingProgress();

  const storedProgress = lesson ? progressState.progressMap.get(lesson.day) : null;
  const unlocked = lesson ? isGrade3DayUnlocked(lesson.day, progressState.progress) : false;

  if (!lesson || Number.isNaN(dayNumber)) {
    return <Redirect href="/(student)/grade3-writing" />;
  }

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

  if (!unlocked) {
    return (
      <Grade3Screen title={t("grade3WritingAdventure.lesson.lockedTitle")}>
        <ErrorState
          description={t("grade3WritingAdventure.lesson.lockedDescription")}
          onActionPress={() => router.replace("/(student)/grade3-writing")}
          actionLabel={t("grade3WritingAdventure.nav.map")}
          title={t("grade3WritingAdventure.lesson.lockedTitle")}
        />
      </Grade3Screen>
    );
  }

  return (
    <Grade3LessonWorkspace
      key={lesson.day}
      lesson={lesson}
      onComplete={() => router.push("/(student)/grade3-writing/progress")}
      saveProgress={progressState.saveProgress}
      storedProgress={storedProgress}
    />
  );
}

type Grade3LessonWorkspaceProps = {
  lesson: Grade3WritingDay;
  onComplete: () => void;
  saveProgress: (input: Grade3WritingProgressInput) => Promise<Grade3WritingProgress>;
  storedProgress: Grade3WritingProgress | null | undefined;
};

function Grade3LessonWorkspace({
  lesson,
  onComplete,
  saveProgress,
  storedProgress,
}: Grade3LessonWorkspaceProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands.elementary;
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draft, setDraft] = useState(storedProgress?.draft ?? "");
  const [strongerSentence, setStrongerSentence] = useState(storedProgress?.strongerSentence ?? "");
  const [favoriteSentence, setFavoriteSentence] = useState(storedProgress?.favoriteSentence ?? "");
  const [checklist, setChecklist] = useState<Grade3ChecklistState>(storedProgress?.checklist ?? {});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("saved");
  const checkedCount = useMemo(() => Object.values(checklist).filter(Boolean).length, [checklist]);
  const readyToComplete = Boolean(draft.trim() && strongerSentence.trim() && checkedCount === lesson.checklist.length);

  useEffect(() => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = setTimeout(() => {
      void saveProgress({
        checklist,
        day: lesson.day,
        draft,
        favoriteSentence,
        strongerSentence,
      })
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("idle"));
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [checklist, draft, favoriteSentence, lesson.day, saveProgress, strongerSentence]);

  const updateDraft = useCallback((nextDraft: string) => {
    setSaveState("saving");
    setDraft(nextDraft);
  }, []);

  const updateStrongerSentence = useCallback((nextSentence: string) => {
    setSaveState("saving");
    setStrongerSentence(nextSentence);
  }, []);

  const updateFavoriteSentence = useCallback((nextSentence: string) => {
    setSaveState("saving");
    setFavoriteSentence(nextSentence);
  }, []);

  const updateChecklist = useCallback((nextChecklist: Grade3ChecklistState) => {
    setSaveState("saving");
    setChecklist(nextChecklist);
  }, []);

  const completeDay = async () => {
    await saveProgress({
      checklist,
      completed: true,
      day: lesson.day,
      draft,
      favoriteSentence,
      strongerSentence,
    });
    onComplete();
  };

  return (
    <Grade3Screen
      subtitle={t("grade3WritingAdventure.lesson.subtitle", {
        minutes: lesson.estimatedMinutes,
        skill: lesson.miniSkill,
      })}
      title={t("grade3WritingAdventure.lesson.title", { day: lesson.day, title: lesson.title })}
    >
      <Grade3TopActions />
      <Grade3AdventureCard
        icon={lesson.visualPrompt.emoji}
        subtitle={saveState === "saving" ? t("grade3WritingAdventure.lesson.saving") : t("grade3WritingAdventure.lesson.saved")}
        title={t("grade3WritingAdventure.lesson.flowTitle")}
        variant="peach"
      >
        <Text style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
          {t("grade3WritingAdventure.lesson.flow")}
        </Text>
      </Grade3AdventureCard>

      <ReadAloudCard reading={lesson.reading} title={t("grade3WritingAdventure.lesson.readTitle")} />

      <Grade3AdventureCard
        icon="💬"
        subtitle={t("grade3WritingAdventure.lesson.talkSubtitle")}
        title={t("grade3WritingAdventure.lesson.talkTitle")}
        variant="mint"
      >
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
          {lesson.talkQuestion}
        </Text>
      </Grade3AdventureCard>

      <Grade3AdventureCard
        icon={lesson.visualPrompt.emoji}
        subtitle={lesson.visualPrompt.drawingTask}
        title={lesson.visualPrompt.scene}
        variant="sky"
      >
        <View
          style={{
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderColor: "#D7C2A4",
            borderRadius: 18,
            borderStyle: "dashed",
            borderWidth: 2,
            minHeight: 140,
            justifyContent: "center",
            padding: spacing.lg,
          }}
        >
          <Text style={{ fontSize: 48, lineHeight: 58 }}>{lesson.visualPrompt.emoji}</Text>
          <Text
            style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText, textAlign: "center" }]}
          >
            {t("grade3WritingAdventure.lesson.sketchSpace")}
          </Text>
        </View>
      </Grade3AdventureCard>

      <Grade3AdventureCard
        icon="🔤"
        subtitle={t("grade3WritingAdventure.lesson.wordBankSubtitle")}
        title={t("grade3WritingAdventure.lesson.wordBankTitle")}
        variant="cream"
      >
        <WordBankChips words={lesson.wordBank} />
      </Grade3AdventureCard>

      <Grade3AdventureCard
        icon="✏️"
        subtitle={lesson.writingPrompt}
        title={t("grade3WritingAdventure.lesson.writeTitle")}
        variant="mint"
      >
        <TextField
          gradeBand="elementary"
          inputStyle={{ minHeight: 180 }}
          label={t("grade3WritingAdventure.lesson.draftLabel")}
          multiline
          onChangeText={updateDraft}
          placeholder={t("grade3WritingAdventure.lesson.draftPlaceholder")}
          scrollEnabled={false}
          textAlignVertical="top"
          value={draft}
        />
      </Grade3AdventureCard>

      <Grade3AdventureCard
        icon="💪"
        subtitle={lesson.makeItStronger}
        title={t("grade3WritingAdventure.lesson.strongerTitle")}
        variant="peach"
      >
        <TextField
          gradeBand="elementary"
          label={t("grade3WritingAdventure.lesson.strongerLabel")}
          multiline
          onChangeText={updateStrongerSentence}
          placeholder={t("grade3WritingAdventure.lesson.strongerPlaceholder")}
          scrollEnabled={false}
          textAlignVertical="top"
          value={strongerSentence}
        />
        <TextField
          gradeBand="elementary"
          label={t("grade3WritingAdventure.lesson.favoriteLabel")}
          onChangeText={updateFavoriteSentence}
          placeholder={t("grade3WritingAdventure.lesson.favoritePlaceholder")}
          value={favoriteSentence}
        />
      </Grade3AdventureCard>

      <Grade3ChecklistCard checklist={lesson.checklist} onChange={updateChecklist} value={checklist} />

      <Grade3AdventureCard
        icon="🏁"
        subtitle={readyToComplete ? t("grade3WritingAdventure.lesson.completeReady") : t("grade3WritingAdventure.lesson.completeNotReady")}
        title={t("grade3WritingAdventure.lesson.completeTitle")}
        variant="success"
      >
        <Button
          disabled={!readyToComplete}
          fullWidth
          gradeBand="elementary"
          label={storedProgress?.completed ? t("grade3WritingAdventure.lesson.completedAgain") : t("grade3WritingAdventure.lesson.completeAction")}
          onPress={completeDay}
          size="lg"
        />
      </Grade3AdventureCard>
    </Grade3Screen>
  );
}
