import { typography, type GradeBand } from "@/design/tokens";

import type {
  StudentHomeApiResponse,
  StudentHomeCoachAction,
  StudentHomeGradeAdaptation,
  StudentHomeNavigationTarget,
  StudentHomeViewModel,
} from "../types";

interface BuildStudentHomeViewModelInput {
  dashboard: StudentHomeApiResponse;
  displayName: string;
}

function getFirstName(displayName: string): string {
  const trimmed = displayName.trim();

  if (!trimmed) {
    return "Writer";
  }

  return trimmed.split(/\s+/)[0] ?? "Writer";
}

export function getStudentHomeGradeAdaptation(gradeBand: GradeBand): StudentHomeGradeAdaptation {
  switch (gradeBand) {
    case "elementary":
      return {
        band: "elementary",
        showDetailedFeedback: false,
        showRubricFocus: false,
        showWeeklySessionCount: false,
        visibleSkillCount: 2,
      };
    case "high":
      return {
        band: "high",
        showDetailedFeedback: true,
        showRubricFocus: true,
        showWeeklySessionCount: true,
        visibleSkillCount: 3,
      };
    case "middle":
      return {
        band: "middle",
        showDetailedFeedback: true,
        showRubricFocus: false,
        showWeeklySessionCount: true,
        visibleSkillCount: 3,
      };
  }
}

function getPrimaryWritingTarget(dashboard: StudentHomeApiResponse): StudentHomeNavigationTarget {
  if (dashboard.continueDraft) {
    return { assignmentId: dashboard.continueDraft.assignmentId, kind: "write" };
  }

  if (dashboard.todayAssignment) {
    return { assignmentId: dashboard.todayAssignment.id, kind: "write" };
  }

  return { kind: "assignmentHistory" };
}

function buildCoachActions(dashboard: StudentHomeApiResponse): StudentHomeCoachAction[] {
  const target = getPrimaryWritingTarget(dashboard);

  return [
    {
      accessibilityLabelKey: "studentHome.coach.hintAccessibility",
      id: "hint",
      labelKey: "aiCoach.hintCta",
      target,
    },
    {
      accessibilityLabelKey: "studentHome.coach.brainstormAccessibility",
      id: "brainstorm",
      labelKey: "aiCoach.brainstormCta",
      target,
    },
    {
      accessibilityLabelKey: "studentHome.coach.sentenceCheckAccessibility",
      id: "sentence_check",
      labelKey: "aiCoach.sentenceCheckCta",
      target,
    },
    {
      accessibilityLabelKey: "studentHome.coach.reviseAccessibility",
      id: "revision_help",
      labelKey: "aiCoach.revisionHelpCta",
      target,
    },
  ];
}

function hasDashboardContent(dashboard: StudentHomeApiResponse): boolean {
  return Boolean(
    dashboard.todayAssignment ||
      dashboard.continueDraft ||
      dashboard.recentFeedback.length > 0 ||
      dashboard.skillProgress.length > 0 ||
      dashboard.weeklyWriting.minutesCompleted > 0,
  );
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function buildStudentHomeViewModel({
  dashboard,
  displayName,
}: BuildStudentHomeViewModelInput): StudentHomeViewModel {
  const gradeBand = typography.getGradeBandForGrade(dashboard.gradeLevel);
  const gradeAdaptation = getStudentHomeGradeAdaptation(gradeBand);

  return {
    coachActions: buildCoachActions(dashboard),
    continueDraft: dashboard.continueDraft,
    dailyPractice: dashboard.dailyPractice,
    gradeAdaptation,
    gradeLevel: dashboard.gradeLevel,
    isEmpty: !hasDashboardContent(dashboard),
    isOffline: dashboard.connectionStatus === "offline_cached",
    recentFeedback: dashboard.recentFeedback,
    revisionNudges: dashboard.revisionNudges,
    skillProgress: dashboard.skillProgress.slice(0, gradeAdaptation.visibleSkillCount),
    streak: dashboard.streak,
    studentFirstName: getFirstName(displayName),
    todayAssignment: dashboard.todayAssignment,
    weeklyProgressValue: clampProgress(dashboard.weeklyWriting.minutesCompleted / dashboard.weeklyWriting.minutesGoal),
    weeklyWriting: dashboard.weeklyWriting,
  };
}
