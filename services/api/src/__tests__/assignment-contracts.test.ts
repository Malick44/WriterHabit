import { describe, expect, it } from "vitest";

import type {
  DraftRecord,
  RubricCriterionRecord,
  StudentAssignmentWithAssignment,
} from "../data/types";
import {
  mapAssignmentDetailApiResponse,
  mapAssignmentDetailToMobileViewModel,
  mapAssignmentHistoryApiResponse,
} from "../mappers/assignments.mapper";
import { assignmentDetailResponseSchema } from "../../../../apps/mobile/src/features/assignments/types";

const assignmentRecord: StudentAssignmentWithAssignment = {
  assignment: {
    assignmentType: "paragraph_writing",
    classId: null,
    difficulty: "moderate",
    dueAt: "2026-06-30T15:00:00.000Z",
    estimatedMinutes: 15,
    gradeLevelMax: 3,
    gradeLevelMin: 3,
    id: "assignment-1",
    instructions: [
      { fallback: "Write a beginning, middle, and end.", key: "assignments.contract.instruction1" },
    ],
    promptFallback: "Write about helping a friend solve a small problem.",
    promptKey: "assignments.contract.prompt",
    rubricId: "rubric-1",
    skillFocus: ["organization", "clarity"],
    status: "published",
    titleFallback: "Friendly Problem Solver",
    titleKey: "assignments.contract.title",
  },
  assignmentId: "assignment-1",
  classId: null,
  completedAt: null,
  createdAt: "2026-06-29T15:00:00.000Z",
  currentSubmissionId: null,
  dailySelectionMetadata: {},
  dueAt: null,
  id: "student-assignment-1",
  startedAt: null,
  status: "in_progress",
  studentProfileId: "student-profile-1",
  submittedAt: null,
  teacherNoteFallback: "Remember to use details from your plan.",
  teacherNoteKey: "assignments.contract.teacherNote",
  updatedAt: "2026-06-30T15:00:00.000Z",
};

const rubric: RubricCriterionRecord[] = [
  {
    descriptionFallback: "The writing has a clear order.",
    descriptionKey: "rubrics.contract.organization.description",
    id: "criterion-1",
    labelFallback: "Organization",
    labelKey: "rubrics.contract.organization.label",
    maxScore: 4,
    rubricId: "rubric-1",
    skill: "organization",
    sortOrder: 1,
  },
];

const draft: DraftRecord = {
  autosaveVersion: 3,
  canvasDocumentIds: ["canvas-private-1"],
  createdAt: "2026-06-30T14:00:00.000Z",
  id: "draft-1",
  paragraphCount: 1,
  revisionNumber: 2,
  sentenceCount: 3,
  studentAssignmentId: "student-assignment-1",
  studentProfileId: "student-profile-1",
  textContent: "PRIVATE FULL DRAFT TEXT should stay student-owned.",
  textPreview: "A short student-owned preview.",
  updatedAt: "2026-06-30T15:00:00.000Z",
  wordCount: 42,
};

describe("assignment contract mappers", () => {
  it("maps backend assignment detail responses into the current mobile Zod schema", () => {
    const apiResponse = mapAssignmentDetailApiResponse({
      draft,
      record: assignmentRecord,
      rubric,
    });
    const mobileAssignment = mapAssignmentDetailToMobileViewModel(apiResponse);

    expect(() =>
      assignmentDetailResponseSchema.parse({
        assignment: mobileAssignment,
        connectionStatus: "online",
        generatedAt: "2026-06-30T15:01:00.000Z",
        gradeLevel: 3,
        studentId: "student-profile-1",
      }),
    ).not.toThrow();
  });

  it("keeps full student writing and raw handwriting artifacts out of list and detail contracts", () => {
    const listPayload = mapAssignmentHistoryApiResponse([assignmentRecord]);
    const detailPayload = mapAssignmentDetailApiResponse({
      draft,
      record: assignmentRecord,
      rubric,
    });
    const combined = JSON.stringify({ detailPayload, listPayload });

    expect(combined).not.toContain(draft.textContent);
    expect(combined).not.toContain("canvas-private-1");
    expect(combined).not.toContain("recognizedText");
    expect(combined).not.toContain("strokes");
  });
});
