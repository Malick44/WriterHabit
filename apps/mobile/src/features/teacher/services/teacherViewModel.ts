import { typography } from "@/design/tokens";

import type {
  TeacherAssignmentsApiResponse,
  TeacherAssignmentsViewModel,
  TeacherClassProgressApiResponse,
  TeacherClassProgressViewModel,
  TeacherDashboardApiResponse,
  TeacherDashboardActivityItem,
  TeacherDashboardViewModel,
  TeacherDashboardWatchlistItem,
  TeacherGradeAdaptation,
  TeacherSubmissionSummary,
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

function getAverageSkillScore(classes: TeacherDashboardApiResponse["classes"]): number {
  if (classes.length === 0) {
    return 0;
  }

  const total = classes.reduce((sum, item) => sum + item.averageSkillScore, 0);

  return Math.round(total / classes.length);
}

function getClassAverageGrade(score: number): string {
  if (score >= 90) {
    return "A-";
  }

  if (score >= 80) {
    return "B";
  }

  if (score >= 70) {
    return "B-";
  }

  if (score >= 60) {
    return "C";
  }

  return "D";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getActiveStudentsSummary(classes: TeacherDashboardApiResponse["classes"]) {
  const totalStudents = classes.reduce((sum, item) => sum + item.studentCount, 0);
  const totalCompletion = classes.reduce(
    (sum, item) => sum + item.studentCount * (item.averageCompletionPercent / 100),
    0,
  );
  const activeStudentsToday = Math.round(totalCompletion);
  const activeStudentsTodayPercent =
    totalStudents > 0 ? Math.round((activeStudentsToday / totalStudents) * 100) : 0;

  return {
    activeStudentsToday,
    activeStudentsTodayPercent,
    activeStudentsTodayTotal: totalStudents,
  };
}

function getPendingReviewTotal(
  classes: TeacherDashboardApiResponse["classes"],
  submissions: TeacherSubmissionSummary[],
): number {
  const classQueue = classes.reduce((sum, item) => sum + item.submissionsNeedingReview, 0);

  if (classQueue > 0) {
    return classQueue;
  }

  return submissions.filter((submission) => submission.status === "awaiting_review").length;
}

function buildDashboardWatchlist(
  submissions: TeacherSubmissionSummary[],
  classes: TeacherDashboardApiResponse["classes"],
): TeacherDashboardWatchlistItem[] {
  const submissionWatchlist = submissions
    .filter((submission) => submission.priority === "high" || submission.status === "revision_requested")
    .map<TeacherDashboardWatchlistItem>((submission) => ({
      action: submission.status === "awaiting_review" ? "review" : "remind",
      classId: submission.classId,
      id: submission.id,
      initials: getInitials(submission.studentName),
      percent: submission.scorePercent,
      reason:
        submission.status === "revision_requested"
          ? "revision_follow_up"
          : "high_priority_review",
      studentName: submission.studentName,
      submissionId: submission.id,
    }));

  const lowCompletionClass = classes
    .filter((classSummary) => classSummary.averageCompletionPercent < 70)
    .sort((first, second) => first.averageCompletionPercent - second.averageCompletionPercent)
    .map<TeacherDashboardWatchlistItem>((classSummary) => ({
      action: "remind",
      classId: classSummary.id,
      id: `${classSummary.id}-low-completion`,
      initials: getInitials(classSummary.name),
      percent: classSummary.averageCompletionPercent,
      reason: "low_completion",
      studentName: classSummary.name,
      submissionId: null,
    }));

  return [...submissionWatchlist, ...lowCompletionClass].slice(0, 3);
}

function buildDashboardActivities(
  submissions: TeacherSubmissionSummary[],
): TeacherDashboardActivityItem[] {
  return submissions.slice(0, 4).map((submission) => {
    const kind: TeacherDashboardActivityItem["kind"] =
      submission.status === "reviewed"
        ? "reviewed"
        : submission.status === "revision_requested"
          ? "revision_requested"
          : "submitted";

    return {
      assignmentTitle: submission.assignmentTitle,
      className: submission.className,
      id: submission.id,
      kind,
      scorePercent: submission.scorePercent,
      studentName: submission.studentName,
      submissionId: submission.id,
      submittedLabel: submission.submittedLabel,
    };
  });
}

export function buildTeacherDashboardViewModel(
  response: TeacherDashboardApiResponse,
): TeacherDashboardViewModel {
  const gradeAdaptation = getPrimaryAdaptation(response);
  const activeStudentSummary = getActiveStudentsSummary(response.classes);
  const activeAssignments = response.assignments.filter((assignment) => assignment.status === "active").length;
  const classAverageScore = getAverageSkillScore(response.classes);
  const reviewQueue = response.submissions.filter((submission) => submission.status === "awaiting_review").length;

  return {
    activities: buildDashboardActivities(response.submissions),
    assignments: response.assignments.slice(0, gradeAdaptation.visibleAssignmentCount),
    classes: response.classes.slice(0, gradeAdaptation.visibleClassCount),
    gradeAdaptation,
    isEmpty: response.classes.length === 0,
    isOffline: response.connectionStatus === "offline_cached",
    metrics: {
      activeAssignments,
      ...activeStudentSummary,
      averageCompletionPercent: getAverageCompletion(response.classes),
      classAverageGrade: getClassAverageGrade(classAverageScore),
      classAverageScore,
      pendingReviewTotal: getPendingReviewTotal(response.classes, response.submissions),
      reviewQueue,
      weeklyGrowthPercent: Math.min(12, Math.max(1, activeAssignments + reviewQueue)),
      totalStudents: response.classes.reduce((sum, item) => sum + item.studentCount, 0),
    },
    safetyNote: response.safetyNote,
    submissions: response.submissions.slice(0, gradeAdaptation.visibleSubmissionCount),
    topTrendLabel: response.classes[0]?.trendLabel ?? response.safetyNote,
    watchlist: buildDashboardWatchlist(response.submissions, response.classes),
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
