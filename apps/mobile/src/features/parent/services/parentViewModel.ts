import { typography } from "@/design/tokens";

import type {
  ParentAssignmentReviewApiResponse,
  ParentAssignmentReviewViewModel,
  ParentDashboardApiResponse,
  ParentDashboardViewModel,
  ParentGradeAdaptation,
  ParentStudentReportApiResponse,
  ParentStudentReportViewModel,
} from "../types";

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export function getParentGradeAdaptation(gradeLevel: number): ParentGradeAdaptation {
  const band = typography.getGradeBandForGrade(gradeLevel);

  switch (band) {
    case "elementary":
      return {
        band,
        showCanvasDetail: true,
        showDetailedRubric: false,
        visibleAssignmentCount: 2,
        visibleMetricCount: 4,
        visibleSkillCount: 2,
      };
    case "high":
      return {
        band,
        showCanvasDetail: true,
        showDetailedRubric: true,
        visibleAssignmentCount: 4,
        visibleMetricCount: 6,
        visibleSkillCount: 5,
      };
    case "middle":
      return {
        band,
        showCanvasDetail: true,
        showDetailedRubric: true,
        visibleAssignmentCount: 3,
        visibleMetricCount: 5,
        visibleSkillCount: 4,
      };
  }
}

function getFallbackAdaptation(): ParentGradeAdaptation {
  return getParentGradeAdaptation(7);
}

function getWeeklyProgressValue(input: {
  minutesCompleted: number;
  minutesGoal: number;
}): number {
  return clampProgress(input.minutesCompleted / input.minutesGoal);
}

function getAssignmentCompletionValue(input: {
  assignedAssignments: number;
  completedAssignments: number;
}): number {
  if (input.assignedAssignments <= 0) {
    return 0;
  }

  return clampProgress(input.completedAssignments / input.assignedAssignments);
}

export function buildParentDashboardViewModel(
  dashboard: ParentDashboardApiResponse,
): ParentDashboardViewModel {
  const selectedStudent =
    dashboard.students.find((student) => student.id === dashboard.selectedStudentId) ??
    dashboard.students[0] ??
    null;
  const gradeAdaptation = selectedStudent
    ? getParentGradeAdaptation(selectedStudent.gradeLevel)
    : getFallbackAdaptation();
  const weeklyProgressValue = dashboard.weeklyProgress
    ? getWeeklyProgressValue(dashboard.weeklyProgress)
    : 0;
  const assignmentCompletionValue = dashboard.weeklyProgress
    ? getAssignmentCompletionValue(dashboard.weeklyProgress)
    : 0;

  return {
    assignments: dashboard.assignments.slice(0, gradeAdaptation.visibleAssignmentCount),
    assignmentCompletionValue,
    gradeAdaptation,
    isEmpty: dashboard.students.length === 0 || !selectedStudent || !dashboard.weeklyProgress,
    isOffline: dashboard.connectionStatus === "offline_cached",
    selectedStudent,
    settingsSummary: dashboard.settingsSummary,
    skillProgress: dashboard.skillProgress.slice(0, gradeAdaptation.visibleSkillCount),
    students: dashboard.students,
    weeklyProgress: dashboard.weeklyProgress,
    weeklyProgressValue,
  };
}

export function buildParentStudentReportViewModel(
  report: ParentStudentReportApiResponse,
): ParentStudentReportViewModel {
  const gradeAdaptation = report.student
    ? getParentGradeAdaptation(report.student.gradeLevel)
    : getFallbackAdaptation();

  return {
    assignments: report.assignments.slice(0, gradeAdaptation.visibleAssignmentCount),
    gradeAdaptation,
    isEmpty: !report.student || !report.weeklyProgress,
    isOffline: report.connectionStatus === "offline_cached",
    nextSteps: report.nextSteps,
    practiceFocus: report.practiceFocus,
    skillProgress: report.skillProgress.slice(0, gradeAdaptation.visibleSkillCount),
    strengths: report.strengths,
    student: report.student,
    weeklyProgress: report.weeklyProgress,
    weeklyProgressValue: report.weeklyProgress ? getWeeklyProgressValue(report.weeklyProgress) : 0,
  };
}

export function buildParentAssignmentReviewViewModel(
  response: ParentAssignmentReviewApiResponse,
): ParentAssignmentReviewViewModel | null {
  if (!response.review) {
    return null;
  }

  const rubricEarned = response.review.rubric.reduce((sum, row) => sum + row.score, 0);
  const rubricMax = response.review.rubric.reduce((sum, row) => sum + row.maxScore, 0);

  return {
    gradeAdaptation: getParentGradeAdaptation(response.review.gradeLevel),
    isOffline: response.connectionStatus === "offline_cached",
    review: response.review,
    rubricEarned,
    rubricMax,
    rubricScoreValue: clampProgress(rubricEarned / rubricMax),
  };
}
