import type { GradeLevel, WritingGoal, WritingSkill } from "@writewise/shared";

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
import {
  selectDailyAssignment,
  type DailyAssignmentHistoryItem,
  type DailyAssignmentTemplate,
} from "../services/dailyAssignmentService";

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

function getDailyAssignmentGoals(gradeLevel: GradeLevel): WritingGoal[] {
  if (gradeLevel <= 5) {
    return ["write_better_sentences", "creative_writing", "improve_handwriting"];
  }

  if (gradeLevel <= 8) {
    return ["write_paragraphs", "school_assignments", "improve_grammar"];
  }

  return ["write_essays", "school_assignments", "test_prep"];
}

function getDailyAssignmentWeakSkills(gradeLevel: GradeLevel): WritingSkill[] {
  if (gradeLevel <= 5) {
    return ["sentence_structure", "vocabulary"];
  }

  if (gradeLevel <= 8) {
    return ["organization", "clarity", "revision_quality"];
  }

  return ["argument_strength", "evidence_usage", "organization"];
}

function getDailyPracticeMinutes(gradeLevel: GradeLevel): number {
  if (gradeLevel <= 5) {
    return 10;
  }

  if (gradeLevel <= 8) {
    return 15;
  }

  return 25;
}

function createDailyAssignmentHistory(gradeLevel: GradeLevel): DailyAssignmentHistoryItem[] {
  if (gradeLevel <= 5) {
    return [
      {
        assignmentId: "reviewed-story-detail",
        assignmentType: "creative_writing",
        completedAt: "2026-06-08",
        difficulty: "easy",
        skillFocus: ["creativity", "vocabulary"],
      },
      {
        assignmentId: "submitted-handwriting-practice",
        assignmentType: "handwriting_practice",
        completedAt: "2026-06-07",
        difficulty: "easy",
        skillFocus: ["handwriting"],
      },
    ];
  }

  if (gradeLevel <= 8) {
    return [
      {
        assignmentId: "reviewed-reading-response",
        assignmentType: "reading_response",
        completedAt: "2026-06-08",
        difficulty: "moderate",
        skillFocus: ["clarity", "organization"],
      },
      {
        assignmentId: "grammar-combine-sentences",
        assignmentType: "grammar_practice",
        completedAt: "2026-06-07",
        difficulty: "easy",
        skillFocus: ["grammar", "sentence_structure"],
      },
    ];
  }

  return [
    {
      assignmentId: "reviewed-argument-response",
      assignmentType: "reading_response",
      completedAt: "2026-06-08",
      difficulty: "moderate",
      skillFocus: ["argument_strength", "evidence_usage"],
    },
    {
      assignmentId: "evidence-analysis-practice",
      assignmentType: "paragraph_writing",
      completedAt: "2026-06-07",
      difficulty: "moderate",
      skillFocus: ["evidence_usage", "clarity"],
    },
  ];
}

function createCurrentDraft(
  assignment: DailyAssignmentTemplate,
  gradeLevel: GradeLevel,
): AssignmentRecord["draft"] {
  if (assignment.assignmentType === "handwriting_practice") {
    return {
      canvasPageCount: 1,
      lastEditedLabel: "Saved 10 minutes ago",
      preview: "Handwriting practice page saved locally.",
      revisionNumber: 0,
      wordCount: 5,
    };
  }

  if (gradeLevel <= 5) {
    return {
      canvasPageCount: 0,
      lastEditedLabel: "Saved 12 minutes ago",
      preview: "The park is bright. I see a tall slide...",
      revisionNumber: 0,
      wordCount: 22,
    };
  }

  if (gradeLevel <= 8) {
    return {
      canvasPageCount: 0,
      lastEditedLabel: "Saved 18 minutes ago",
      preview: "Practice matters more because people can improve with feedback...",
      revisionNumber: 1,
      wordCount: 96,
    };
  }

  return {
    canvasPageCount: 0,
    lastEditedLabel: "Saved 25 minutes ago",
    preview: "Technology affects learning most when it gives students faster feedback...",
    revisionNumber: 2,
    wordCount: 184,
  };
}

function getCurrentSubmissionId(assignmentId: string): string {
  return `submission-${assignmentId.replace(/^daily-/, "")}`;
}

function createCurrentAssignment(gradeLevel: GradeLevel, scenario: AssignmentScenario): AssignmentRecord {
  const status = scenario === "submitted" ? "submitted" : "in_progress";
  const selection = selectDailyAssignment({
    dailyMinutes: getDailyPracticeMinutes(gradeLevel),
    goals: getDailyAssignmentGoals(gradeLevel),
    gradeLevel,
    history: createDailyAssignmentHistory(gradeLevel),
    referenceDate: "2026-06-09",
    weakSkills: getDailyAssignmentWeakSkills(gradeLevel),
  });
  const assignment = selection.assignment;

  return {
    assignedLabel: "Today",
    assignmentType: assignment.assignmentType,
    currentSubmissionId: scenario === "submitted" ? getCurrentSubmissionId(assignment.id) : undefined,
    difficulty: assignment.difficulty,
    draft: createCurrentDraft(assignment, gradeLevel),
    dueLabel: "Today",
    estimatedMinutes: assignment.estimatedMinutes,
    gradeLevelMax: assignment.gradeLevelMax,
    gradeLevelMin: assignment.gradeLevelMin,
    id: assignment.id,
    instructions: assignment.instructions,
    prompt: assignment.prompt,
    rubric: assignment.rubric,
    rubricId: assignment.rubricId,
    skillFocus: assignment.skillFocus,
    status,
    submittedLabel: scenario === "submitted" ? "Submitted today" : undefined,
    teacherNote: assignment.teacherNote,
    title: assignment.title,
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
