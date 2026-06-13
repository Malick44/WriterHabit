import { typography, type GradeBand } from "@/design/tokens";

import type {
  AssignmentGradeAdaptation,
  AssignmentHistoryTab,
  AssignmentRecord,
  AssignmentStatus,
} from "../types";

const draftStatuses: AssignmentStatus[] = ["in_progress", "revision_in_progress"];
const submittedStatuses: AssignmentStatus[] = ["submitted", "reviewing"];
const reviewedStatuses: AssignmentStatus[] = ["feedback_ready", "completed"];

export function getAssignmentGradeAdaptation(gradeLevel: number): AssignmentGradeAdaptation {
  const band = typography.getGradeBandForGrade(gradeLevel);

  switch (band) {
    case "elementary":
      return {
        band,
        showDetailedRubric: false,
        showDifficulty: false,
        visibleInstructionCount: 2,
      };
    case "high":
      return {
        band,
        showDetailedRubric: true,
        showDifficulty: true,
        visibleInstructionCount: 4,
      };
    case "middle":
      return {
        band,
        showDetailedRubric: true,
        showDifficulty: true,
        visibleInstructionCount: 3,
      };
  }
}

export function getAssignmentHistoryTabForStatus(status: AssignmentStatus): AssignmentHistoryTab | null {
  if (draftStatuses.includes(status)) {
    return "drafts";
  }

  if (submittedStatuses.includes(status)) {
    return "submitted";
  }

  if (reviewedStatuses.includes(status)) {
    return "reviewed";
  }

  return null;
}

export function filterAssignmentsByTab(
  assignments: AssignmentRecord[],
  selectedTab: AssignmentHistoryTab,
): AssignmentRecord[] {
  if (selectedTab === "all") {
    return assignments;
  }

  return assignments.filter((assignment) => getAssignmentHistoryTabForStatus(assignment.status) === selectedTab);
}

/**
 * Habit Loop list ordering: feedback-ready assignments lead as the positive
 * next opportunity, active drafts follow, and completed work settles to the
 * bottom. Ties keep the API's order (it already sorts by recency).
 */
const statusListPriority: Record<AssignmentStatus, number> = {
  completed: 4,
  feedback_ready: 0,
  in_progress: 1,
  not_started: 2,
  reviewing: 3,
  revision_in_progress: 1,
  submitted: 3,
};

export function sortAssignmentsForHistory(assignments: AssignmentRecord[]): AssignmentRecord[] {
  return [...assignments].sort(
    (a, b) => statusListPriority[a.status] - statusListPriority[b.status],
  );
}

export function getAssignmentHistoryCounts(assignments: AssignmentRecord[]): Record<AssignmentHistoryTab, number> {
  return assignments.reduce<Record<AssignmentHistoryTab, number>>(
    (counts, assignment) => {
      counts.all += 1;
      const tab = getAssignmentHistoryTabForStatus(assignment.status);

      if (tab) {
        counts[tab] += 1;
      }

      return counts;
    },
    {
      all: 0,
      drafts: 0,
      reviewed: 0,
      submitted: 0,
    },
  );
}

export function canStartAssignmentWork(status: AssignmentStatus): boolean {
  return status === "not_started" || status === "in_progress" || status === "feedback_ready" || status === "revision_in_progress";
}

export function getNextStatusOnStart(status: AssignmentStatus): AssignmentStatus | null {
  switch (status) {
    case "not_started":
      return "in_progress";
    case "feedback_ready":
      return "revision_in_progress";
    case "in_progress":
    case "revision_in_progress":
      return status;
    case "submitted":
    case "reviewing":
    case "completed":
      return null;
  }
}

export function canSubmitAssignment(assignment: AssignmentRecord): boolean {
  if (assignment.status !== "in_progress" && assignment.status !== "revision_in_progress") {
    return false;
  }

  return Boolean(
    assignment.draft &&
      (assignment.draft.wordCount > 0 || assignment.draft.canvasPageCount > 0),
  );
}

export type AssignmentStatusCta =
  | "startWriting"
  | "continueDraft"
  | "viewSubmission"
  | "reviewFeedback"
  | "continueRevising"
  | "viewFeedback";

/** Next-step call to action shown on list cards, mirroring the Habit Loop design. */
export function getStatusCta(status: AssignmentStatus): AssignmentStatusCta {
  switch (status) {
    case "not_started":
      return "startWriting";
    case "in_progress":
      return "continueDraft";
    case "submitted":
    case "reviewing":
      return "viewSubmission";
    case "feedback_ready":
      return "reviewFeedback";
    case "revision_in_progress":
      return "continueRevising";
    case "completed":
      return "viewFeedback";
  }
}

export function getStatusTone(status: AssignmentStatus): "neutral" | "info" | "success" | "warning" {
  switch (status) {
    case "not_started":
      return "neutral";
    case "in_progress":
    case "revision_in_progress":
      return "info";
    case "submitted":
    case "reviewing":
      return "warning";
    case "feedback_ready":
    case "completed":
      return "success";
  }
}

export function isGradeBand(band: GradeBand, gradeLevel: number): boolean {
  return typography.getGradeBandForGrade(gradeLevel) === band;
}
