import type { AssignmentRecord } from "../types";
import {
  canSubmitAssignment,
  filterAssignmentsByTab,
  getAssignmentHistoryCounts,
  getAssignmentHistoryTabForStatus,
  getNextStatusOnStart,
  sortAssignmentsForHistory,
  getStatusCta,
} from "./assignmentStatusService";

const baseAssignment: AssignmentRecord = {
  assignedLabel: "Today",
  assignmentType: "paragraph_writing",
  difficulty: "moderate",
  draft: {
    canvasPageCount: 0,
    lastEditedLabel: "Saved now",
    preview: "A draft preview",
    revisionNumber: 0,
    wordCount: 42,
  },
  dueLabel: "Today",
  estimatedMinutes: 15,
  gradeLevelMax: 8,
  gradeLevelMin: 6,
  id: "assignment-1",
  instructions: ["Plan", "Draft", "Revise"],
  prompt: "Write a paragraph.",
  rubric: [
    {
      description: "Clear topic sentence",
      id: "topic",
      label: "Topic sentence",
    },
  ],
  rubricId: "rubric-1",
  skillFocus: ["organization"],
  status: "in_progress",
  title: "Paragraph practice",
};

function assignmentWithStatus(status: AssignmentRecord["status"], id: string): AssignmentRecord {
  return {
    ...baseAssignment,
    id,
    status,
  };
}

describe("assignmentStatusService", () => {
  it("groups assignment statuses into history tabs", () => {
    expect(getAssignmentHistoryTabForStatus("in_progress")).toBe("drafts");
    expect(getAssignmentHistoryTabForStatus("revision_in_progress")).toBe("drafts");
    expect(getAssignmentHistoryTabForStatus("submitted")).toBe("submitted");
    expect(getAssignmentHistoryTabForStatus("reviewing")).toBe("submitted");
    expect(getAssignmentHistoryTabForStatus("feedback_ready")).toBe("reviewed");
    expect(getAssignmentHistoryTabForStatus("completed")).toBe("reviewed");
    expect(getAssignmentHistoryTabForStatus("not_started")).toBeNull();
  });

  it("counts and filters history tabs", () => {
    const assignments = [
      assignmentWithStatus("in_progress", "draft"),
      assignmentWithStatus("reviewing", "submitted"),
      assignmentWithStatus("feedback_ready", "reviewed"),
    ];

    expect(getAssignmentHistoryCounts(assignments)).toEqual({
      all: 3,
      drafts: 1,
      reviewed: 1,
      submitted: 1,
    });
    expect(filterAssignmentsByTab(assignments, "drafts").map((assignment) => assignment.id)).toEqual(["draft"]);
  });

  it("orders the history list feedback-ready first and completed last", () => {
    const assignments = [
      assignmentWithStatus("completed", "done"),
      assignmentWithStatus("submitted", "waiting"),
      assignmentWithStatus("in_progress", "draft-a"),
      assignmentWithStatus("feedback_ready", "feedback"),
      assignmentWithStatus("revision_in_progress", "draft-b"),
      assignmentWithStatus("not_started", "fresh"),
    ];

    expect(sortAssignmentsForHistory(assignments).map((assignment) => assignment.id)).toEqual([
      "feedback",
      "draft-a",
      "draft-b",
      "fresh",
      "waiting",
      "done",
    ]);
    expect(assignments[0]?.id).toBe("done");
  });

  it("allows valid start transitions only", () => {
    expect(getNextStatusOnStart("not_started")).toBe("in_progress");
    expect(getNextStatusOnStart("feedback_ready")).toBe("revision_in_progress");
    expect(getNextStatusOnStart("submitted")).toBeNull();
    expect(getNextStatusOnStart("completed")).toBeNull();
  });

  it("maps each status to its next-step call to action", () => {
    expect(getStatusCta("not_started")).toBe("startWriting");
    expect(getStatusCta("in_progress")).toBe("continueDraft");
    expect(getStatusCta("submitted")).toBe("viewSubmission");
    expect(getStatusCta("reviewing")).toBe("viewSubmission");
    expect(getStatusCta("feedback_ready")).toBe("reviewFeedback");
    expect(getStatusCta("revision_in_progress")).toBe("continueRevising");
    expect(getStatusCta("completed")).toBe("viewFeedback");
  });

  it("requires draft or canvas work before submission", () => {
    expect(canSubmitAssignment(baseAssignment)).toBe(true);
    expect(
      canSubmitAssignment({
        ...baseAssignment,
        draft: {
          ...baseAssignment.draft!,
          wordCount: 0,
        },
      }),
    ).toBe(false);
    expect(canSubmitAssignment({ ...baseAssignment, status: "submitted" })).toBe(false);
    expect(
      canSubmitAssignment({
        ...baseAssignment,
        draft: {
          ...baseAssignment.draft!,
          canvasPageCount: 1,
          wordCount: 0,
        },
      }),
    ).toBe(true);
  });
});
