import { routes, type AppRoute } from "@/core/navigation/routeNames";
import type { TranslationKey } from "@/i18n";

import { onboardingPersistenceService } from "./onboardingPersistenceService";
import { useOnboardingStore } from "../stores/onboardingStore";
import type { OnboardingProgress } from "../types";

export type OnboardingPreviewTargetId =
  | "role"
  | "grade"
  | "goals"
  | "confidence"
  | "dailyPractice"
  | "planSummary";

export type OnboardingPreviewTarget = {
  id: OnboardingPreviewTargetId;
  route: AppRoute;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  accessibilityKey: TranslationKey;
};

const sampleGoals: OnboardingProgress["writingGoals"] = [
  "improve_grammar",
  "write_paragraphs",
  "creative_writing",
];

export const onboardingPreviewTargets = [
  {
    id: "role",
    route: routes.onboardingRoleSelection,
    labelKey: "auth.demoUsers.onboardingScreens.role.label",
    descriptionKey: "auth.demoUsers.onboardingScreens.role.description",
    accessibilityKey: "auth.demoUsers.onboardingScreens.role.accessibility",
  },
  {
    id: "grade",
    route: routes.onboardingGradeSelection,
    labelKey: "auth.demoUsers.onboardingScreens.grade.label",
    descriptionKey: "auth.demoUsers.onboardingScreens.grade.description",
    accessibilityKey: "auth.demoUsers.onboardingScreens.grade.accessibility",
  },
  {
    id: "goals",
    route: routes.onboardingWritingGoals,
    labelKey: "auth.demoUsers.onboardingScreens.goals.label",
    descriptionKey: "auth.demoUsers.onboardingScreens.goals.description",
    accessibilityKey: "auth.demoUsers.onboardingScreens.goals.accessibility",
  },
  {
    id: "confidence",
    route: routes.onboardingWritingConfidence,
    labelKey: "auth.demoUsers.onboardingScreens.confidence.label",
    descriptionKey: "auth.demoUsers.onboardingScreens.confidence.description",
    accessibilityKey: "auth.demoUsers.onboardingScreens.confidence.accessibility",
  },
  {
    id: "dailyPractice",
    route: routes.onboardingDailyPracticeGoal,
    labelKey: "auth.demoUsers.onboardingScreens.dailyPractice.label",
    descriptionKey: "auth.demoUsers.onboardingScreens.dailyPractice.description",
    accessibilityKey: "auth.demoUsers.onboardingScreens.dailyPractice.accessibility",
  },
  {
    id: "planSummary",
    route: routes.onboardingPlanSummary,
    labelKey: "auth.demoUsers.onboardingScreens.planSummary.label",
    descriptionKey: "auth.demoUsers.onboardingScreens.planSummary.description",
    accessibilityKey: "auth.demoUsers.onboardingScreens.planSummary.accessibility",
  },
] as const satisfies readonly OnboardingPreviewTarget[];

export function getOnboardingPreviewTarget(targetId: string): OnboardingPreviewTarget {
  return onboardingPreviewTargets.find((target) => target.id === targetId) ?? onboardingPreviewTargets[0];
}

export function getOnboardingPreviewProgress(targetId: string): OnboardingProgress {
  const baseProgress: OnboardingProgress = {
    role: "student",
    writingGoals: [],
  };

  switch (getOnboardingPreviewTarget(targetId).id) {
    case "role":
    case "grade":
      return baseProgress;
    case "goals":
      return {
        ...baseProgress,
        gradeLevel: 5,
      };
    case "confidence":
      return {
        ...baseProgress,
        gradeLevel: 5,
        writingGoals: sampleGoals,
      };
    case "dailyPractice":
      return {
        ...baseProgress,
        confidenceLevel: "steady",
        gradeLevel: 5,
        writingGoals: sampleGoals,
      };
    case "planSummary":
      return {
        ...baseProgress,
        confidenceLevel: "steady",
        dailyPracticeMinutes: 10,
        gradeLevel: 5,
        writingGoals: sampleGoals,
      };
  }
}

export async function prepareOnboardingPreview(userId: string, targetId: string): Promise<AppRoute> {
  const progress = {
    ...getOnboardingPreviewProgress(targetId),
    updatedAt: new Date().toISOString(),
  };
  const target = getOnboardingPreviewTarget(targetId);

  await onboardingPersistenceService.saveProgress(userId, progress);

  useOnboardingStore.setState({
    errorCode: null,
    hydrated: true,
    plan: null,
    progress,
    status: "idle",
    userId,
  });

  return target.route;
}
