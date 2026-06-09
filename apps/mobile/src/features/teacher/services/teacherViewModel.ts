import { typography } from "@/design/tokens";

import type {
  TeacherAssignmentsApiResponse,
  TeacherAssignmentsViewModel,
  TeacherClassProgressApiResponse,
  TeacherClassProgressViewModel,
  TeacherDashboardApiResponse,
  TeacherDashboardViewModel,
  TeacherGradeAdaptation,
  TeacherSubmissionReviewApiResponse,
  TeacherSubmissionReviewViewModel,
  TeacherSubmissionsApiResponse,
  TeacherSubmissionsViewModel,
} from "../types";

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

export function getTeacherGradeAdaptation(gradeLevel: number): TeacherGradeAdaptation {
  const band = typography.getGradeBandForGrade(gradeLevel);

  switch (band) {
    case "elementary":
      return {
        band,
        showDetailedRubric: false,
        visibleAssignmentCount: 2,
        visibleClassCount: 3,
        visibleRubricRows: 2,
        visibleSkillCount: 2,
        visibleStudentCount: 8,
        visibleSubmissionCount: 4,
      };
    case "high":
      return {
        band,
        showDetailedRubric: true,
        visibleAssignmentCount: 5,
        visibleClassCount: 5,
        visibleRubricRows: 5,
        visibleSkillCount: 5,
        visibleStudentCount: 16,
        visibleSubmissionCount: 8,
      };
    case "middle":
      return {
        band,
        showDetailedRubric: true,
        visibleAssignmentCount: 4,
        visibleClassCount: 4,
        visibleRubricRows: 4,
        visibleSkillCount: 4,
        visibleStudentCount: 12,
        visibleSubmissionCount: 6,
      };
  }
}

function getFallbackAdaptation(): TeacherGradeAdaptation {
  return getTeacherGradeAdaptation(7);
}

function getPrimaryAdaptation(input: { classes?: { gradeLevel: number }[] }): TeacherGradeAdaptation {
  return input.classes?.[0] ? getTeacherGradeAdaptation(input.classes[0].gradeLevel) : getFallbackAdaptation();
}

function getAverageCompletion(classes: TeacherDashboardApiResponse["classes"]): number {
  if (classes.length === 0) {
    return 0;
  }

  const total = classes.reduce((sum, item) => sum + item.averageCompletionPercent, 0);

  return Math.round(total / classes.length);
}

export function buildTeacherDashboardViewModel(
  response: TeacherDashboardApiResponse,
): TeacherDashboardViewModel {
  const gradeAdaptation = getPrimaryAdaptation(response);

  return {
    assignments: response.assignments.slice(0, gradeAdaptation.visibleAssignmentCount),
    classes: response.classes.slice(0, gradeAdaptation.visibleClassCount),
    gradeAdaptation,
    isEmpty: response.classes.length === 0,
    isOffline: response.connectionStatus === "offline_cached",
    metrics: {
      activeAssignments: response.assignments.filter((assignment) => assignment.status === "active").length,
      averageCompletionPercent: getAverageCompletion(response.classes),
      reviewQueue: response.submissions.filter((submission) => submission.status === "awaiting_review").length,
      totalStudents: response.classes.reduce((sum, item) => sum + item.studentCount, 0),
    },
    safetyNote: response.safetyNote,
    submissions: response.submissions.slice(0, gradeAdaptation.visibleSubmissionCount),
  };
}

export function buildTeacherAssignmentsViewModel(
  response: TeacherAssignmentsApiResponse,
): TeacherAssignmentsViewModel {
  const gradeAdaptation = getPrimaryAdaptation(response);

  return {
    assignments: response.assignments.slice(0, gradeAdaptation.visibleAssignmentCount),
    classes: response.classes,
    gradeAdaptation,
    isEmpty: response.assignments.length === 0 && response.classes.length === 0,
    isOffline: response.connectionStatus === "offline_cached",
  };
}

export function buildTeacherSubmissionsViewModel(
  response: TeacherSubmissionsApiResponse,
): TeacherSubmissionsViewModel {
  const firstSubmission = response.submissions[0];
  const gradeAdaptation = firstSubmission
    ? getTeacherGradeAdaptation(firstSubmission.gradeLevel)
    : getFallbackAdaptation();
  const submissions = response.submissions.slice(0, gradeAdaptation.visibleSubmissionCount);

  return {
    awaitingReview: submissions.filter((submission) => submission.status === "awaiting_review"),
    gradeAdaptation,
    isEmpty: response.submissions.length === 0,
    isOffline: response.connectionStatus === "offline_cached",
    reviewed: submissions.filter((submission) => submission.status !== "awaiting_review"),
    submissions,
  };
}

export function buildTeacherClassProgressViewModel(
  response: TeacherClassProgressApiResponse,
): TeacherClassProgressViewModel | null {
  if (!response.classSummary) {
    return null;
  }

  const gradeAdaptation = getTeacherGradeAdaptation(response.classSummary.gradeLevel);

  return {
    classSummary: response.classSummary,
    gradeAdaptation,
    instructionalGroups: response.instructionalGroups.slice(0, gradeAdaptation.visibleSkillCount),
    isEmpty: response.students.length === 0,
    isOffline: response.connectionStatus === "offline_cached",
    skillTrends: response.skillTrends.slice(0, gradeAdaptation.visibleSkillCount),
    students: response.students.slice(0, gradeAdaptation.visibleStudentCount),
    supportStudents: response.students
      .filter((student) => student.needsSupport)
      .slice(0, Math.min(gradeAdaptation.visibleStudentCount, 6)),
  };
}

export function buildTeacherSubmissionReviewViewModel(
  response: TeacherSubmissionReviewApiResponse,
): TeacherSubmissionReviewViewModel | null {
  if (!response.review) {
    return null;
  }

  const gradeAdaptation = getTeacherGradeAdaptation(response.review.gradeLevel);
  const rubricEarned = response.review.rubric.reduce((sum, row) => sum + row.score, 0);
  const rubricMax = response.review.rubric.reduce((sum, row) => sum + row.maxScore, 0);

  return {
    gradeAdaptation,
    isOffline: response.connectionStatus === "offline_cached",
    review: response.review,
    rubricEarned,
    rubricMax,
    rubricScoreValue: clampProgress(rubricEarned / rubricMax),
    visibleRubric: response.review.rubric.slice(0, gradeAdaptation.visibleRubricRows),
  };
}
