import { describe, expect, it } from "vitest";

import type { AssignmentRecord, CanvasDocumentRecord, FeedbackWithDetails } from "../data/types";
import {
  mapCanvasDetailToMobileViewModel,
  mapCanvasListApiResponse,
  mapCanvasListToMobileViewModel,
} from "../mappers/canvas.mapper";
import {
  mapFeedbackResponseApiResponse,
  mapFeedbackToMobileViewModel,
} from "../mappers/feedback.mapper";
import {
  canvasDetailResponseSchema,
  canvasListResponseSchema,
} from "../../../../apps/mobile/src/features/canvas/types";
import { feedbackReviewResponseSchema } from "../../../../apps/mobile/src/features/feedback-review/types";

const generatedAt = "2026-06-30T17:00:00.000Z";

const canvasRecord: CanvasDocumentRecord = {
  assignmentId: "assignment-1",
  attachedAt: "2026-06-30T16:30:00.000Z",
  clientVersion: 2,
  createdAt: "2026-06-30T16:00:00.000Z",
  exportStatus: "not_requested",
  id: "550e8400-e29b-41d4-a716-446655440000",
  objectPath: "canvas/550e8400-e29b-41d4-a716-446655440000/stroke-document/v2.json",
  previewImagePath: "canvas/550e8400-e29b-41d4-a716-446655440000/preview-image/v2.png",
  recognizedText: "PRIVATE RECOGNIZED HANDWRITING TEXT",
  recognitionStatus: "completed",
  serverVersion: 2,
  studentAssignmentId: "student-assignment-1",
  studentProfileId: "student-profile-1",
  strokeCount: 1,
  strokes: [
    {
      color: "#111111",
      createdAt: "2026-06-30T16:01:00.000Z",
      id: "stroke-1",
      points: [{ pressure: 0.5, x: 0.1, y: 0.2 }],
      tool: "pen",
      width: 4,
    },
  ],
  syncStatus: "saved",
  template: "lined_paper",
  title: "My handwriting page",
  updatedAt: "2026-06-30T16:30:00.000Z",
};

const assignment: AssignmentRecord = {
  assignmentType: "paragraph_writing",
  classId: "class-1",
  difficulty: "moderate",
  dueAt: null,
  estimatedMinutes: 15,
  gradeLevelMax: 3,
  gradeLevelMin: 3,
  id: "assignment-1",
  instructions: [],
  promptFallback: "Write about helping a friend.",
  promptKey: "assignments.contract.prompt",
  rubricId: "rubric-1",
  skillFocus: ["clarity"],
  status: "published",
  titleFallback: "Friendly Helper",
  titleKey: "assignments.contract.title",
};

const feedbackDetails: FeedbackWithDetails = {
  assignment,
  feedback: {
    createdAt: generatedAt,
    gradeLevel: 3,
    id: "feedback-1",
    improvementFallback: "Add one clear detail.",
    improvementKey: "feedback.contract.improvement",
    nextRevisionTaskFallback: "Make one sentence stronger.",
    nextRevisionTaskKey: "feedback.contract.nextTask",
    progressMinutes: 5,
    progressPoints: 10,
    progressSkill: "clarity",
    strengthFallback: "Your idea matches the prompt.",
    strengthKey: "feedback.contract.strength",
    studentProfileId: "student-profile-1",
    submissionId: "submission-1",
    submittedTextExcerpt: "A bounded student writing excerpt.",
    updatedAt: generatedAt,
  },
  grammarSuggestions: [
    {
      explanationFallback: "A period shows where the sentence ends.",
      explanationKey: "feedback.contract.grammar.explanation",
      feedbackId: "feedback-1",
      id: "grammar-1",
      originalExcerpt: "A bounded sentence excerpt.",
      studentActionFallback: "Check one ending mark.",
      studentActionKey: "feedback.contract.grammar.action",
      titleFallback: "Ending mark",
      titleKey: "feedback.contract.grammar.title",
    },
  ],
  revisionTask: {
    createdAt: generatedAt,
    feedbackId: "feedback-1",
    guidingQuestionFallback: "What detail helps the reader picture it?",
    guidingQuestionKey: "feedback.contract.revision.question",
    id: "revision-task-1",
    instructionFallback: "Add one describing detail.",
    instructionKey: "feedback.contract.revision.instruction",
    originalExcerpt: "A bounded revision excerpt.",
    targetSkill: "clarity",
    updatedAt: generatedAt,
  },
  rubricScores: [
    {
      coachingNoteFallback: "This is on track.",
      coachingNoteKey: "feedback.contract.rubric.note",
      criterionDescriptionFallback: "Ideas are clear.",
      criterionDescriptionKey: "rubric.contract.description",
      criterionId: "criterion-1",
      criterionLabelFallback: "Clarity",
      criterionLabelKey: "rubric.contract.label",
      feedbackId: "feedback-1",
      id: "score-1",
      level: "meeting",
      maxScore: 4,
      score: 3,
    },
  ],
  studentAssignment: {
    assignmentId: "assignment-1",
    classId: "class-1",
    completedAt: null,
    createdAt: generatedAt,
    currentSubmissionId: "submission-1",
    dailySelectionMetadata: {},
    dueAt: null,
    id: "student-assignment-1",
    startedAt: generatedAt,
    status: "feedback_ready",
    studentProfileId: "student-profile-1",
    submittedAt: generatedAt,
    teacherNoteFallback: null,
    teacherNoteKey: null,
    updatedAt: generatedAt,
  },
  submission: {
    canvasDocumentIds: ["550e8400-e29b-41d4-a716-446655440000"],
    createdAt: generatedAt,
    id: "submission-1",
    idempotencyKey: "submit-1",
    paragraphCount: 1,
    revisionNumber: 1,
    sentenceCount: 3,
    status: "feedback_ready",
    studentAssignmentId: "student-assignment-1",
    studentProfileId: "student-profile-1",
    submittedAt: generatedAt,
    typedTextExcerpt: "A bounded student writing excerpt.",
    wordCount: 42,
  },
};

describe("content contract mappers", () => {
  it("maps canvas list and detail responses into mobile Zod schemas", () => {
    const listResponse = mapCanvasListToMobileViewModel({
      generatedAt,
      records: [canvasRecord],
      studentId: "student-profile-1",
    });
    const detailResponse = mapCanvasDetailToMobileViewModel({
      generatedAt,
      record: canvasRecord,
      studentId: "student-profile-1",
    });

    expect(() => canvasListResponseSchema.parse(listResponse)).not.toThrow();
    expect(() => canvasDetailResponseSchema.parse(detailResponse)).not.toThrow();
  });

  it("keeps raw canvas content out of canvas list contracts", () => {
    const apiList = mapCanvasListApiResponse([canvasRecord]);
    const serialized = JSON.stringify(apiList);

    expect(serialized).not.toContain("PRIVATE RECOGNIZED HANDWRITING TEXT");
    expect(serialized).not.toContain("points");
    expect(serialized).not.toContain("strokes");
    expect(serialized).not.toContain("recognizedText");
  });

  it("maps feedback responses into the current mobile Zod schema", () => {
    const apiResponse = mapFeedbackResponseApiResponse(feedbackDetails, {
      generatedAt,
      includeRubricScores: true,
    });
    const mobileResponse = mapFeedbackToMobileViewModel({
      generatedAt,
      gradeLevel: 3,
      response: apiResponse,
      studentId: "student-profile-1",
    });

    expect(() => feedbackReviewResponseSchema.parse(mobileResponse)).not.toThrow();
  });
});
