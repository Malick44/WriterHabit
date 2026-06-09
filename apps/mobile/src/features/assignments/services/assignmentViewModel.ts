import {
  canStartAssignmentWork,
  canSubmitAssignment,
  filterAssignmentsByTab,
  getAssignmentGradeAdaptation,
  getAssignmentHistoryCounts,
  getNextStatusOnStart,
} from "./assignmentStatusService";
import type {
  AssignmentDetailResponse,
  AssignmentDetailViewModel,
  AssignmentHistoryResponse,
  AssignmentHistoryTab,
  AssignmentHistoryViewModel,
} from "../types";

interface BuildAssignmentHistoryViewModelInput {
  response: AssignmentHistoryResponse;
  selectedTab: AssignmentHistoryTab;
}

export function buildAssignmentHistoryViewModel({
  response,
  selectedTab,
}: BuildAssignmentHistoryViewModelInput): AssignmentHistoryViewModel {
  const assignments = filterAssignmentsByTab(response.assignments, selectedTab);

  return {
    assignments,
    counts: getAssignmentHistoryCounts(response.assignments),
    gradeAdaptation: getAssignmentGradeAdaptation(response.gradeLevel),
    isEmpty: assignments.length === 0,
    isOffline: response.connectionStatus === "offline_cached",
    selectedTab,
  };
}

export function buildAssignmentDetailViewModel(response: AssignmentDetailResponse): AssignmentDetailViewModel {
  const { assignment } = response;

  if (!assignment) {
    return {
      assignment: null,
      canStartCanvas: false,
      canStartWriting: false,
      canSubmit: false,
      gradeAdaptation: getAssignmentGradeAdaptation(response.gradeLevel),
      isMissing: true,
      isOffline: response.connectionStatus === "offline_cached",
      nextStatusOnStart: null,
    };
  }

  const canStart = canStartAssignmentWork(assignment.status);

  return {
    assignment,
    canStartCanvas: canStart,
    canStartWriting: canStart,
    canSubmit: canSubmitAssignment(assignment),
    gradeAdaptation: getAssignmentGradeAdaptation(response.gradeLevel),
    isMissing: false,
    isOffline: response.connectionStatus === "offline_cached",
    nextStatusOnStart: getNextStatusOnStart(assignment.status),
  };
}
