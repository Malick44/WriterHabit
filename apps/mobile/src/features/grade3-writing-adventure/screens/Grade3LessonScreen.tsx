import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { getCanvasCreateRoute } from "@/core/navigation/deepLinks";
import { ErrorState, LoadingState } from "@/shared/components";
import { useI18n } from "@/i18n";
import { useAssignmentAttachments } from "@/features/assignments/hooks/useAssignmentAttachments";

import { CelebrationStep } from "../components/lesson-flow/CelebrationStep";
import { CheckStep } from "../components/lesson-flow/CheckStep";
import { LessonBottomBar } from "../components/lesson-flow/LessonBottomBar";
import { LessonStepTracker } from "../components/lesson-flow/LessonStepTracker";
import { PlanStep } from "../components/lesson-flow/PlanStep";
import { ReadStep } from "../components/lesson-flow/ReadStep";
import { SubmitStep } from "../components/lesson-flow/SubmitStep";
import { TalkStep } from "../components/lesson-flow/TalkStep";
import { WriteStep } from "../components/lesson-flow/WriteStep";
import {
  canProceedToNextStep,
  defaultGrade3PlanningState,
  getLessonStepIndex,
  getNextLessonStep,
  getPreviousLessonStep,
  type LessonSaveState,
  type LessonStep,
} from "../components/lesson-flow/lessonFlowTypes";
import { Grade3Screen } from "../components/Grade3Screen";
import { grade3WritingProgram } from "../content/grade3WritingProgram.content";
import { useGrade3WritingProgress } from "../hooks/useGrade3WritingProgress";
import { isGrade3DayUnlocked } from "../services/grade3WritingProgressModel";
import type {
  Grade3ChecklistState,
  Grade3PlanningState,
  Grade3WritingDay,
  Grade3WritingProgress,
  Grade3WritingProgressInput,
} from "../types";

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
      saveProgress={progressState.saveProgress}
      storedProgress={storedProgress}
    />
  );
}

type Grade3LessonWorkspaceProps = {
  lesson: Grade3WritingDay;
  saveProgress: (input: Grade3WritingProgressInput) => Promise<Grade3WritingProgress>;
  storedProgress: Grade3WritingProgress | null | undefined;
};

function Grade3LessonWorkspace({ lesson, saveProgress, storedProgress }: Grade3LessonWorkspaceProps) {
  const router = useRouter();
  const { t } = useI18n();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentStep, setCurrentStep] = useState<LessonStep>("read");
  const [furthestStepIndex, setFurthestStepIndex] = useState(0);
  const [draft, setDraft] = useState(storedProgress?.draft ?? "");
  const [strongerSentence, setStrongerSentence] = useState(storedProgress?.strongerSentence ?? "");
  const [favoriteSentence, setFavoriteSentence] = useState(storedProgress?.favoriteSentence ?? "");
  const [checklist, setChecklist] = useState<Grade3ChecklistState>(storedProgress?.checklist ?? {});
  const [planning, setPlanning] = useState<Grade3PlanningState>(
    storedProgress?.planning ?? defaultGrade3PlanningState,
  );
  const [saveState, setSaveState] = useState<LessonSaveState>("saved");
  const [startedCanvas, setStartedCanvas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationReason, setValidationReason] = useState<"draft" | "check" | null>(null);
  const attachments = useAssignmentAttachments();

  const saveLabel = saveState === "saving"
    ? t("grade3WritingAdventure.lessonFlow.autosave.saving")
    : t("grade3WritingAdventure.lessonFlow.autosave.saved");

  const validation = useMemo(
    () =>
      canProceedToNextStep(currentStep, {
        checklist,
        checklistItems: lesson.checklist,
        draft,
        strongerSentence,
      }),
    [checklist, currentStep, draft, lesson.checklist, strongerSentence],
  );

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
        planning,
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
  }, [checklist, draft, favoriteSentence, lesson.day, planning, saveProgress, strongerSentence]);

  const updateDraft = useCallback((nextDraft: string) => {
    setSaveState("saving");
    setValidationReason(null);
    setDraft(nextDraft);
  }, []);

  const updateStrongerSentence = useCallback((nextSentence: string) => {
    setSaveState("saving");
    setValidationReason(null);
    setStrongerSentence(nextSentence);
  }, []);

  const updateFavoriteSentence = useCallback((nextSentence: string) => {
    setSaveState("saving");
    setFavoriteSentence(nextSentence);
  }, []);

  const updateChecklist = useCallback((nextChecklist: Grade3ChecklistState) => {
    setSaveState("saving");
    setValidationReason(null);
    setChecklist(nextChecklist);
  }, []);

  const updatePlanning = useCallback((nextPlanning: Grade3PlanningState) => {
    setSaveState("saving");
    setPlanning(nextPlanning);
  }, []);

  const openCanvas = useCallback(() => {
    setStartedCanvas(true);
    router.push(getCanvasCreateRoute());
  }, [router]);

  const goToMap = useCallback(() => {
    router.push("/(student)/grade3-writing");
  }, [router]);

  const goToProgress = useCallback(() => {
    router.push("/(student)/grade3-writing/progress");
  }, [router]);

  const completeDay = async () => {
    setSubmitting(true);
    try {
      await saveProgress({
        checklist,
        completed: true,
        day: lesson.day,
        draft,
        favoriteSentence,
        planning,
        strongerSentence,
      });
      setSaveState("saved");
      setFurthestStepIndex(6);
      setCurrentStep("celebration");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    setValidationReason(null);

    if (currentStep === "read") {
      goToMap();
      return;
    }

    if (currentStep === "celebration") {
      goToMap();
      return;
    }

    setCurrentStep(getPreviousLessonStep(currentStep));
  };

  const goNext = () => {
    if (currentStep === "celebration") {
      goToProgress();
      return;
    }

    if (currentStep === "submit") {
      void completeDay();
      return;
    }

    if (!validation.canProceed) {
      setValidationReason(validation.reason);
      return;
    }

    const nextStep = getNextLessonStep(currentStep);
    setValidationReason(null);
    setFurthestStepIndex((previous) => Math.max(previous, getLessonStepIndex(nextStep)));
    setCurrentStep(nextStep);
  };

  const renderStep = () => {
    switch (currentStep) {
      case "read":
        return <ReadStep lesson={lesson} />;
      case "talk":
        return <TalkStep lesson={lesson} onPlanningChange={updatePlanning} planning={planning} />;
      case "plan":
        return <PlanStep lesson={lesson} onPlanningChange={updatePlanning} planning={planning} />;
      case "write":
        return (
          <WriteStep
            attachments={attachments}
            draft={draft}
            lesson={lesson}
            onDraftChange={updateDraft}
            onOpenCanvas={openCanvas}
            saveLabel={saveLabel}
            startedCanvas={startedCanvas}
          />
        );
      case "check":
        return (
          <CheckStep
            checklist={checklist}
            favoriteSentence={favoriteSentence}
            lesson={lesson}
            onChecklistChange={updateChecklist}
            onFavoriteSentenceChange={updateFavoriteSentence}
            onStrongerSentenceChange={updateStrongerSentence}
            strongerSentence={strongerSentence}
          />
        );
      case "submit":
        return <SubmitStep draft={draft} favoriteSentence={favoriteSentence} lesson={lesson} />;
      case "celebration":
        return <CelebrationStep />;
    }
  };

  const getBackLabel = () => {
    if (currentStep === "read" || currentStep === "celebration") {
      return t("grade3WritingAdventure.lessonFlow.cta.backToMap");
    }

    if (currentStep === "check") {
      return t("grade3WritingAdventure.lessonFlow.cta.backToWrite");
    }

    if (currentStep === "submit") {
      return t("grade3WritingAdventure.lessonFlow.cta.keepEditing");
    }

    return t("grade3WritingAdventure.lessonFlow.cta.back");
  };

  const getNextLabel = () => {
    switch (currentStep) {
      case "read":
        return t("grade3WritingAdventure.lessonFlow.cta.nextTalk");
      case "talk":
        return t("grade3WritingAdventure.lessonFlow.cta.nextPlan");
      case "plan":
        return t("grade3WritingAdventure.lessonFlow.cta.nextWrite");
      case "write":
        return t("grade3WritingAdventure.lessonFlow.cta.nextCheck");
      case "check":
        return t("grade3WritingAdventure.lessonFlow.cta.readySubmit");
      case "submit":
        return t("grade3WritingAdventure.lessonFlow.cta.submit");
      case "celebration":
        return t("grade3WritingAdventure.lessonFlow.cta.seeProgress");
    }
  };

  const activeValidationReason =
    validationReason ??
    (!validation.canProceed && (currentStep === "write" || currentStep === "check") ? validation.reason : null);
  const helperText = activeValidationReason
    ? t(
        activeValidationReason === "draft"
          ? "grade3WritingAdventure.lessonFlow.validation.draft"
          : "grade3WritingAdventure.lessonFlow.validation.check",
      )
    : undefined;

  return (
    <Grade3Screen
      footer={
        <LessonBottomBar
          backLabel={getBackLabel()}
          helperText={helperText}
          nextDisabled={!validation.canProceed && (currentStep === "write" || currentStep === "check")}
          nextLabel={getNextLabel()}
          nextLoading={submitting}
          onBack={goBack}
          onNext={goNext}
          saveLabel={saveLabel}
        />
      }
      subtitle={t("grade3WritingAdventure.lesson.subtitle", {
        minutes: lesson.estimatedMinutes,
        skill: lesson.miniSkill,
      })}
      title={t("grade3WritingAdventure.lesson.title", { day: lesson.day, title: lesson.title })}
    >
      <LessonStepTracker currentStep={currentStep} furthestStepIndex={furthestStepIndex} />
      {renderStep()}
    </Grade3Screen>
  );
}
