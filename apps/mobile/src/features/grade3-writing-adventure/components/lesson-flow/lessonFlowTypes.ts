import type { Grade3ChecklistState, Grade3PlanningState } from "../../types";
import {
  defaultGrade3PlanningState,
  deserializeGrade3PlanningState,
  serializeGrade3PlanningState,
} from "../../services/grade3PlanningState";

export type LessonStep = "read" | "talk" | "plan" | "write" | "check" | "submit" | "celebration";

export type LessonStepId = Exclude<LessonStep, "celebration">;

export type LessonSaveState = "idle" | "saving" | "saved";

export const lessonSteps: LessonStepId[] = ["read", "talk", "plan", "write", "check", "submit"];

export type LessonValidationInput = {
  checklist: Grade3ChecklistState;
  checklistItems: string[];
  draft: string;
  strongerSentence: string;
};

export type LessonNavigationValidation = {
  canProceed: boolean;
  reason: "draft" | "check" | null;
};

export { defaultGrade3PlanningState, deserializeGrade3PlanningState, serializeGrade3PlanningState };
export type { Grade3PlanningState };

export function getLessonStepIndex(step: LessonStep): number {
  return step === "celebration" ? lessonSteps.length : lessonSteps.indexOf(step);
}

export function getNextLessonStep(step: LessonStep): LessonStep {
  const index = getLessonStepIndex(step);

  if (step === "celebration" || index >= lessonSteps.length - 1) {
    return step;
  }

  return lessonSteps[index + 1];
}

export function getPreviousLessonStep(step: LessonStep): LessonStep {
  const index = getLessonStepIndex(step);

  if (step === "celebration") {
    return "submit";
  }

  if (index <= 0) {
    return "read";
  }

  return lessonSteps[index - 1];
}

export function isMeaningfulDraft(draft: string): boolean {
  return draft.trim().split(/\s+/).filter(Boolean).length >= 3;
}

export function isChecklistComplete(checklist: Grade3ChecklistState, checklistItems: string[]): boolean {
  return checklistItems.length > 0 && checklistItems.every((item) => checklist[item] === true);
}

export function canProceedToNextStep(
  step: LessonStep,
  input: LessonValidationInput,
): LessonNavigationValidation {
  if (step === "write" && !isMeaningfulDraft(input.draft)) {
    return { canProceed: false, reason: "draft" };
  }

  if (
    step === "check" &&
    (!isMeaningfulDraft(input.draft) ||
      input.strongerSentence.trim().length === 0 ||
      !isChecklistComplete(input.checklist, input.checklistItems))
  ) {
    return { canProceed: false, reason: "check" };
  }

  if (step === "celebration") {
    return { canProceed: false, reason: null };
  }

  return { canProceed: true, reason: null };
}
