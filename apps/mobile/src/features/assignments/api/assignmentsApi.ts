import type { GradeLevel } from "@writewise/shared";

import {
  assignmentDetailResponseSchema,
  assignmentHistoryResponseSchema,
  assignmentScenarioSchema,
  assignmentSubmissionResponseSchema,
  type AssignmentDetailResponse,
  type AssignmentHistoryResponse,
  type AssignmentRecord,
  type AssignmentScenario,
  type AssignmentSubmissionResponse,
} from "../types";
import { canSubmitAssignment, getNextStatusOnStart } from "../services/assignmentStatusService";

interface AssignmentRequestInput {
  gradeLevel?: GradeLevel;
  studentId: string;
}

interface AssignmentDetailRequestInput extends AssignmentRequestInput {
  assignmentId: string;
}

function readScenario(): AssignmentScenario {
  const parsed = assignmentScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WRITEWISE_ASSIGNMENTS_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

function getGradeLevel(input: AssignmentRequestInput): GradeLevel {
  return input.gradeLevel ?? 7;
}

function createCurrentAssignment(gradeLevel: GradeLevel, scenario: AssignmentScenario): AssignmentRecord {
  const status = scenario === "submitted" ? "submitted" : "in_progress";

  if (gradeLevel <= 5) {
    return {
      assignedLabel: "Today",
      assignmentType: "sentence_practice",
      currentSubmissionId: scenario === "submitted" ? "submission-sentence-details" : undefined,
      difficulty: "easy",
      draft: {
        canvasPageCount: 0,
        lastEditedLabel: "Saved 12 minutes ago",
        preview: "The park is bright. I see a tall slide...",
        revisionNumber: 0,
        wordCount: 22,
      },
      dueLabel: "Today",
      estimatedMinutes: 10,
      gradeLevelMax: 5,
      gradeLevelMin: 1,
      id: "daily-sentence-details",
      instructions: [
        "Write your own three sentences.",
        "Add one describing word to each sentence.",
        "Reread your favorite sentence before you submit.",
      ],
      prompt: "Write three sentences about a place you know. Add one describing word to each sentence.",
      rubric: [
        {
          description: "Each sentence shares a complete idea.",
          id: "clear-sentence",
          label: "Clear sentence",
        },
        {
          description: "At least one sentence includes a describing word.",
          id: "describing-word",
          label: "Describing word",
        },
        {
          description: "Sentences start with capital letters and end with punctuation.",
          id: "sentence-care",
          label: "Sentence care",
        },
      ],
      rubricId: "rubric-sentence-details",
      skillFocus: ["sentence_structure", "vocabulary"],
      status,
      submittedLabel: scenario === "submitted" ? "Submitted today" : undefined,
      teacherNote: "Use your own memory of the place. A hint can help you choose details.",
      title: "Add details to sentences",
    };
  }

  if (gradeLevel <= 8) {
    return {
      assignedLabel: "Today",
      assignmentType: "paragraph_writing",
      currentSubmissionId: scenario === "submitted" ? "submission-paragraph-evidence" : undefined,
      difficulty: "moderate",
      draft: {
        canvasPageCount: 0,
        lastEditedLabel: "Saved 18 minutes ago",
        preview: "Practice matters more because people can improve with feedback...",
        revisionNumber: 1,
        wordCount: 96,
      },
      dueLabel: "Today",
      estimatedMinutes: 15,
      gradeLevelMax: 8,
      gradeLevelMin: 6,
      id: "daily-paragraph-evidence",
      instructions: [
        "Write your own topic sentence.",
        "Add two details that support your reason.",
        "Revise one sentence so the reason is clearer.",
      ],
      prompt: "Write a paragraph explaining whether practice or talent matters more when learning a skill.",
      rubric: [
        {
          description: "The first sentence states a focused opinion.",
          id: "topic-sentence",
          label: "Topic sentence",
        },
        {
          description: "Details explain why the opinion makes sense.",
          id: "supporting-detail",
          label: "Supporting detail",
        },
        {
          description: "One sentence is revised for clarity before submission.",
          id: "revision-quality",
          label: "Revision quality",
        },
      ],
      rubricId: "rubric-paragraph-evidence",
      skillFocus: ["organization", "clarity", "revision_quality"],
      status,
      submittedLabel: scenario === "submitted" ? "Submitted today" : undefined,
      teacherNote: "A coach hint can ask a question, but the paragraph should stay in your words.",
      title: "Support a paragraph idea",
    };
  }

  return {
    assignedLabel: "Today",
    assignmentType: "essay_writing",
    currentSubmissionId: scenario === "submitted" ? "submission-essay-thesis-evidence" : undefined,
    difficulty: "challenging",
    draft: {
      canvasPageCount: 0,
      lastEditedLabel: "Saved 25 minutes ago",
      preview: "Technology affects learning most when it gives students faster feedback...",
      revisionNumber: 2,
      wordCount: 184,
    },
    dueLabel: "Today",
    estimatedMinutes: 25,
    gradeLevelMax: 12,
    gradeLevelMin: 9,
    id: "daily-essay-thesis-evidence",
    instructions: [
      "Draft a thesis in your own words.",
      "Write one body paragraph with evidence.",
      "Add analysis after the evidence.",
      "Check the rubric before submitting.",
    ],
    prompt: "Draft a thesis and one evidence-based body paragraph about how technology affects learning.",
    rubric: [
      {
        description: "The thesis makes a specific, arguable claim.",
        id: "thesis",
        label: "Thesis",
      },
      {
        description: "The paragraph uses relevant evidence.",
        id: "evidence",
        label: "Evidence usage",
      },
      {
        description: "Analysis explains why the evidence supports the claim.",
        id: "analysis",
        label: "Analysis",
      },
      {
        description: "Revision improves clarity or reasoning before submission.",
        id: "revision-quality",
        label: "Revision quality",
      },
    ],
    rubricId: "rubric-essay-thesis-evidence",
    skillFocus: ["argument_strength", "evidence_usage", "organization", "revision_quality"],
    status,
    submittedLabel: scenario === "submitted" ? "Submitted today" : undefined,
    teacherNote: "Use coach questions for planning and revision choices, not a finished response.",
    title: "Strengthen a thesis and evidence",
  };
}

function createReviewedAssignment(gradeLevel: GradeLevel): AssignmentRecord {
  if (gradeLevel <= 5) {
    return {
      assignedLabel: "Yesterday",
      assignmentType: "creative_writing",
      currentSubmissionId: "feedback-latest",
      difficulty: "easy",
      draft: {
        canvasPageCount: 1,
        lastEditedLabel: "Submitted yesterday",
        preview: "My story starts in a garden with a hidden gate...",
        revisionNumber: 1,
        wordCount: 48,
      },
      dueLabel: "Reviewed",
      estimatedMinutes: 12,
      gradeLevelMax: 5,
      gradeLevelMin: 1,
      id: "reviewed-story-detail",
      instructions: ["Read the feedback.", "Choose one sentence to make stronger."],
      prompt: "Write a short story opening with two details about the setting.",
      rubric: [
        { description: "The opening names a setting.", id: "setting", label: "Setting" },
        { description: "Details help the reader picture the place.", id: "details", label: "Details" },
      ],
      rubricId: "rubric-story-detail",
      skillFocus: ["creativity", "vocabulary"],
      status: "feedback_ready",
      submittedLabel: "Reviewed yesterday",
      title: "Story detail practice",
    };
  }

  return {
    assignedLabel: "Yesterday",
    assignmentType: gradeLevel <= 8 ? "paragraph_writing" : "essay_writing",
    currentSubmissionId: "feedback-latest",
    difficulty: "moderate",
    draft: {
      canvasPageCount: 0,
      lastEditedLabel: "Submitted yesterday",
      preview:
        gradeLevel <= 8
          ? "Reading every day helps students build vocabulary because..."
          : "Community service requirements can strengthen schools when...",
      revisionNumber: 2,
      wordCount: gradeLevel <= 8 ? 132 : 245,
    },
    dueLabel: "Reviewed",
    estimatedMinutes: gradeLevel <= 8 ? 18 : 30,
    gradeLevelMax: gradeLevel <= 8 ? 8 : 12,
    gradeLevelMin: gradeLevel <= 8 ? 6 : 9,
    id: gradeLevel <= 8 ? "reviewed-reading-response" : "reviewed-argument-response",
    instructions: [
      "Review the strength and improvement note.",
      "Complete one revision task in your own words.",
      "Resubmit only after you make the change.",
    ],
    prompt:
      gradeLevel <= 8
        ? "Explain how daily reading affects vocabulary growth."
        : "Argue whether community service should be a graduation requirement.",
    rubric: [
      { description: "The response has a focused claim.", id: "claim", label: "Claim" },
      { description: "Details support the claim.", id: "support", label: "Support" },
      { description: "Revision addresses feedback.", id: "revision", label: "Revision" },
    ],
    rubricId: gradeLevel <= 8 ? "rubric-reading-response" : "rubric-argument-response",
    skillFocus: gradeLevel <= 8 ? ["clarity", "organization"] : ["argument_strength", "evidence_usage"],
    status: "feedback_ready",
    submittedLabel: "Reviewed yesterday",
    title: gradeLevel <= 8 ? "Reading response feedback" : "Argument response feedback",
  };
}

function createSubmittedAssignment(gradeLevel: GradeLevel): AssignmentRecord {
  return {
    assignedLabel: "This week",
    assignmentType: gradeLevel <= 5 ? "handwriting_practice" : gradeLevel <= 8 ? "reading_response" : "test_prep",
    currentSubmissionId: "submission-under-review",
    difficulty: gradeLevel <= 5 ? "easy" : "moderate",
    draft: {
      canvasPageCount: gradeLevel <= 5 ? 2 : 0,
      lastEditedLabel: "Submitted 2 days ago",
      preview:
        gradeLevel <= 5
          ? "Handwriting page submitted with two practice lines."
          : "My response explains the main idea and one supporting detail...",
      revisionNumber: 0,
      wordCount: gradeLevel <= 5 ? 18 : 118,
    },
    dueLabel: "Submitted",
    estimatedMinutes: gradeLevel <= 5 ? 8 : 20,
    gradeLevelMax: gradeLevel <= 5 ? 5 : gradeLevel <= 8 ? 8 : 12,
    gradeLevelMin: gradeLevel <= 5 ? 1 : gradeLevel <= 8 ? 6 : 9,
    id: "submitted-under-review",
    instructions: ["Wait for feedback.", "You can review the assignment details while it is being checked."],
    prompt:
      gradeLevel <= 5
        ? "Practice writing five clear words on lined paper."
        : "Write a focused response using one detail from the passage.",
    rubric: [
      { description: "The work responds to the prompt.", id: "prompt", label: "Prompt response" },
      { description: "The response is ready for review.", id: "ready", label: "Ready for review" },
    ],
    rubricId: "rubric-submitted-review",
    skillFocus: gradeLevel <= 5 ? ["handwriting"] : ["reading_response", "clarity"],
    status: "reviewing",
    submittedLabel: "Submitted 2 days ago",
    title: gradeLevel <= 5 ? "Handwriting practice" : "Reading response check",
  };
}

function createAssignments(input: AssignmentRequestInput, scenario: AssignmentScenario): AssignmentRecord[] {
  const gradeLevel = getGradeLevel(input);

  if (scenario === "empty") {
    return [];
  }

  return [
    createCurrentAssignment(gradeLevel, scenario),
    createReviewedAssignment(gradeLevel),
    createSubmittedAssignment(gradeLevel),
  ];
}

function createHistoryResponse(input: AssignmentRequestInput, scenario: AssignmentScenario): AssignmentHistoryResponse {
  const response: AssignmentHistoryResponse = {
    assignments: createAssignments(input, scenario),
    connectionStatus: scenario === "offline" ? "offline_cached" : "online",
    generatedAt: new Date("2026-06-08T09:00:00.000Z").toISOString(),
    gradeLevel: getGradeLevel(input),
    studentId: input.studentId,
  };

  return assignmentHistoryResponseSchema.parse(response);
}

export const assignmentsApi = {
  async getAssignments(input: AssignmentRequestInput): Promise<AssignmentHistoryResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Assignments mock error");
    }

    return createHistoryResponse(input, scenario);
  },

  async getAssignmentDetail(input: AssignmentDetailRequestInput): Promise<AssignmentDetailResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Assignment detail mock error");
    }

    const assignments = createAssignments(input, scenario);
    const response: AssignmentDetailResponse = {
      assignment: assignments.find((assignment) => assignment.id === input.assignmentId) ?? null,
      connectionStatus: scenario === "offline" ? "offline_cached" : "online",
      generatedAt: new Date("2026-06-08T09:00:00.000Z").toISOString(),
      gradeLevel: getGradeLevel(input),
      studentId: input.studentId,
    };

    return assignmentDetailResponseSchema.parse(response);
  },

  async startAssignment(input: AssignmentDetailRequestInput): Promise<AssignmentRecord> {
    const detail = await this.getAssignmentDetail(input);

    if (!detail.assignment) {
      throw new Error("Assignment not found");
    }

    const nextStatus = getNextStatusOnStart(detail.assignment.status);

    if (!nextStatus) {
      throw new Error("Assignment cannot be started from this status");
    }

    return {
      ...detail.assignment,
      status: nextStatus,
    };
  },

  async submitAssignment(input: AssignmentDetailRequestInput): Promise<AssignmentSubmissionResponse> {
    const detail = await this.getAssignmentDetail(input);

    if (!detail.assignment) {
      throw new Error("Assignment not found");
    }

    if (!canSubmitAssignment(detail.assignment)) {
      throw new Error("Assignment is not ready to submit");
    }

    const response: AssignmentSubmissionResponse = {
      assignmentId: detail.assignment.id,
      status: "submitted",
      submittedLabel: "Submitted today",
      submissionId: `submission-${detail.assignment.id}`,
    };

    return assignmentSubmissionResponseSchema.parse(response);
  },
};
