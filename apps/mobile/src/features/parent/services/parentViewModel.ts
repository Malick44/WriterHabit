import { typography } from "@/design/tokens";

import type {
  ParentAssignmentReviewApiResponse,
  ParentAssignmentReviewViewModel,
  ParentAssignmentSummary,
  ParentDashboardApiResponse,
  ParentDashboardMilestone,
  ParentDashboardUpcomingItem,
  ParentDashboardViewModel,
  ParentDashboardWritingLevel,
  ParentGradeAdaptation,
  ParentSkillProgress,
  ParentStudentReportApiResponse,
  ParentStudentReportViewModel,
  ParentWeeklyProgress,
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

function getAverageSkillScore(skillProgress: ParentSkillProgress[]): number {
  if (skillProgress.length === 0) {
    return 0;
  }

  return Math.round(
    skillProgress.reduce((total, skill) => total + skill.currentScore, 0) / skillProgress.length,
  );
}

function getWritingLevel(skillProgress: ParentSkillProgress[]): ParentDashboardWritingLevel {
  const averageScore = getAverageSkillScore(skillProgress);

  if (averageScore >= 82) {
    return "advanced";
  }

  if (averageScore >= 64) {
    return "intermediate";
  }

  return "developing";
}

function getRecentRankPercent(skillProgress: ParentSkillProgress[]): number {
  const averageScore = getAverageSkillScore(skillProgress);

  if (averageScore <= 0) {
    return 0;
  }

  return Math.min(35, Math.max(5, 100 - averageScore));
}

function getTopSkill(skillProgress: ParentSkillProgress[]): ParentSkillProgress | null {
  return [...skillProgress].sort((first, second) => second.currentScore - first.currentScore)[0] ?? null;
}

function buildDashboardMilestones(input: {
  assignments: ParentAssignmentSummary[];
  skillProgress: ParentSkillProgress[];
  weeklyProgress: ParentWeeklyProgress | null;
}): ParentDashboardMilestone[] {
  const milestones: ParentDashboardMilestone[] = [];

  if (input.weeklyProgress && input.weeklyProgress.streakDays > 0) {
    milestones.push({
      description: input.weeklyProgress.celebration,
      id: "weekly-streak",
      kind: "streak",
      streakDays: input.weeklyProgress.streakDays,
    });
  }

  const topSkill = getTopSkill(input.skillProgress);

  if (topSkill) {
    milestones.push({
      description: topSkill.trendDescription,
      id: `skill-${topSkill.skill}`,
      kind: "skill",
      scorePercent: topSkill.currentScore,
      skillLabel: topSkill.label,
    });
  }

  const strongestAssignment = [...input.assignments].sort(
    (first, second) => second.scorePercent - first.scorePercent,
  )[0];

  if (strongestAssignment) {
    milestones.push({
      description: strongestAssignment.feedbackSummary,
      id: strongestAssignment.submissionId,
      kind: "assignment",
      scorePercent: strongestAssignment.scorePercent,
      title: strongestAssignment.title,
    });
  }

  return milestones.slice(0, 3);
}

function buildUpcomingItems(assignments: ParentAssignmentSummary[]): ParentDashboardUpcomingItem[] {
  return assignments.slice(0, 2).map((assignment) => ({
    context: assignment.feedbackSummary,
    id: assignment.submissionId,
    progressPercent: assignment.scorePercent,
    status: assignment.status,
    submissionId: assignment.submissionId,
    title: assignment.title,
  }));
}

function getCoachInsight(input: {
  selectedStudent: ParentDashboardApiResponse["students"][number] | null;
  weeklyProgress: ParentWeeklyProgress | null;
}): string {
  if (!input.selectedStudent || !input.weeklyProgress) {
    return "";
  }

  return input.weeklyProgress.areaToPracticeDescription;
}

function getEncouragementSummary(input: {
  skillProgress: ParentSkillProgress[];
  weeklyProgress: ParentWeeklyProgress | null;
}): string {
  const topSkill = getTopSkill(input.skillProgress);

  if (topSkill) {
    return topSkill.nextPractice;
  }

  return input.weeklyProgress?.celebration ?? "";
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
  const visibleAssignments = dashboard.assignments.slice(0, gradeAdaptation.visibleAssignmentCount);
  const visibleSkillProgress = dashboard.skillProgress.slice(0, gradeAdaptation.visibleSkillCount);

  return {
    assignments: visibleAssignments,
    assignmentCompletionValue,
    coachInsight: getCoachInsight({ selectedStudent, weeklyProgress: dashboard.weeklyProgress }),
    confidenceGrowthPercent: dashboard.weeklyProgress?.skillImprovementPercent ?? 0,
    encouragementSummary: getEncouragementSummary({
      skillProgress: dashboard.skillProgress,
      weeklyProgress: dashboard.weeklyProgress,
    }),
    gradeAdaptation,
    isEmpty: dashboard.students.length === 0 || !selectedStudent || !dashboard.weeklyProgress,
    isOffline: dashboard.connectionStatus === "offline_cached",
    milestones: buildDashboardMilestones({
      assignments: dashboard.assignments,
      skillProgress: dashboard.skillProgress,
      weeklyProgress: dashboard.weeklyProgress,
    }),
    recentRankPercent: getRecentRankPercent(dashboard.skillProgress),
    selectedStudent,
    settingsSummary: dashboard.settingsSummary,
    skillProgress: visibleSkillProgress,
    students: dashboard.students,
    upcomingItems: buildUpcomingItems(visibleAssignments),
    writingLevel: getWritingLevel(dashboard.skillProgress),
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
