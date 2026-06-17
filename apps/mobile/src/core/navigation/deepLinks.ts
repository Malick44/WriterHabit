import type { Href } from "expo-router";

import { routes } from "./routeNames";

export const deepLinkPrefixes = ["writerhabit://", "https://writerhabit.app"] as const;

export const deepLinkRoutes = {
  assignmentDetail: "/(student)/assignments/[assignmentId]",
  assignmentSubmission: "/(student)/assignments/submit",
  canvasDocument: "/(student)/canvas/[canvasId]",
  canvasTemplates: "/(student)/canvas/templates",
  studentReview: "/(student)/review/[submissionId]",
  studentReviewCompletion: "/(student)/review/[submissionId]/complete",
  studentReviewRevision: "/(student)/review/[submissionId]/revision",
  studentReviewRubric: "/(student)/review/[submissionId]/rubric",
  studentReviewSummary: "/(student)/review/[submissionId]/summary",
  studentProgressBadges: "/(student)/progress/badges",
  studentProgressSkill: "/(student)/progress/skills/[skillId]",
  studentProgressWeeklyReview: "/(student)/progress/weekly-review",
  writingWorkspace: "/(student)/write/[assignmentId]",
  parentAssignmentReview: "/(parent)/assignments/[submissionId]",
  parentStudentReport: "/(parent)/students/[studentId]/report",
  teacherClassProgress: "/(teacher)/classes/[classId]/progress",
  teacherSubmissionReview: "/(teacher)/submissions/[submissionId]",
  paywall: routes.paywall,
} as const;

export type DeepLinkRouteName = keyof typeof deepLinkRoutes;
export type WritingWorkspaceStageParam = "understand" | "draft" | "revise" | "submit";

export function getAssignmentDetailRoute(assignmentId: string): Href {
  return {
    pathname: "/(student)/assignments/[assignmentId]",
    params: { assignmentId },
  };
}

export function getWritingWorkspaceRoute(
  assignmentId: string,
  stage?: WritingWorkspaceStageParam,
): Href {
  return {
    pathname: "/(student)/write/[assignmentId]",
    params: stage ? { assignmentId, stage } : { assignmentId },
  };
}

export function getAssignmentSubmissionRoute(assignmentId: string): Href {
  return {
    pathname: "/(student)/assignments/submit",
    params: { assignmentId },
  };
}

export function getCanvasDocumentRoute(canvasId: string, assignmentId?: string): Href {
  return {
    pathname: "/(student)/canvas/[canvasId]",
    params: assignmentId ? { assignmentId, canvasId } : { canvasId },
  };
}

export function getCanvasTemplatePickerRoute(assignmentId?: string): Href {
  if (!assignmentId) {
    return "/(student)/canvas/templates";
  }

  return {
    pathname: "/(student)/canvas/templates",
    params: { assignmentId },
  };
}

export function getPracticeTaskRoute(skillId: string): Href {
  return {
    pathname: "/(student)/practice-task",
    params: { skillId },
  };
}

export function getPracticeSessionRoute(skillId: string, taskId: string): Href {
  return {
    pathname: "/(student)/practice-session",
    params: { skillId, taskId },
  };
}

export function getStudentReviewRoute(submissionId: string): Href {
  return {
    pathname: "/(student)/review/[submissionId]",
    params: { submissionId },
  };
}

export function getStudentReviewSummaryRoute(submissionId: string): Href {
  return {
    pathname: "/(student)/review/[submissionId]/summary",
    params: { submissionId },
  };
}

export function getStudentReviewRubricRoute(submissionId: string): Href {
  return {
    pathname: "/(student)/review/[submissionId]/rubric",
    params: { submissionId },
  };
}

export function getStudentReviewRevisionRoute(submissionId: string): Href {
  return {
    pathname: "/(student)/review/[submissionId]/revision",
    params: { submissionId },
  };
}

export function getStudentReviewCompletionRoute(submissionId: string): Href {
  return {
    pathname: "/(student)/review/[submissionId]/complete",
    params: { submissionId },
  };
}

export function getStudentProgressSkillRoute(skillId: string): Href {
  return {
    pathname: "/(student)/progress/skills/[skillId]",
    params: { skillId },
  };
}

export function getParentStudentReportRoute(studentId: string): Href {
  return {
    pathname: "/(parent)/students/[studentId]/report",
    params: { studentId },
  };
}

export function getParentAssignmentReviewRoute(submissionId: string): Href {
  return {
    pathname: "/(parent)/assignments/[submissionId]",
    params: { submissionId },
  };
}

export function getTeacherSubmissionReviewRoute(submissionId: string): Href {
  return {
    pathname: "/(teacher)/submissions/[submissionId]",
    params: { submissionId },
  };
}

export function getTeacherClassProgressRoute(classId: string): Href {
  return {
    pathname: "/(teacher)/classes/[classId]/progress",
    params: { classId },
  };
}
