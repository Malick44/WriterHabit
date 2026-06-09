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
