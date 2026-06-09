const mockLocalStore = new Map<string, unknown>();

jest.mock("@/services/storage/localJsonStorage", () => ({
  localJsonStorage: {
    getItem: jest.fn(async (key: string, fallback: unknown) => mockLocalStore.get(key) ?? fallback),
    removeItem: jest.fn(async (key: string) => {
      mockLocalStore.delete(key);
    }),
    setItem: jest.fn(async (key: string, value: unknown) => {
      mockLocalStore.set(key, value);
    }),
  },
}));

import {
  assignmentsApi,
  buildAssignmentDetailViewModel,
  buildAssignmentHistoryViewModel,
} from "@/features/assignments";
import {
  addCanvasStroke,
  createCanvasStroke,
} from "@/features/canvas/services/canvasDocumentService";
import { canvasApi } from "@/features/canvas/api/canvasApi";
import {
  buildFeedbackReviewViewModel,
  getFeedbackRevisionValidation,
} from "@/features/feedback-review/services/feedbackReviewService";
import { feedbackReviewApi } from "@/features/feedback-review/api/feedbackreviewApi";
import { buildPersonalizedPlan } from "@/features/onboarding/services/personalizedPlanService";
import {
  getCompletedOnboardingProfile,
  getFirstIncompleteOnboardingStep,
  type CompletedOnboardingProfile,
} from "@/features/onboarding/types";

const scenarioEnvKeys = [
  "EXPO_PUBLIC_WRITEWISE_ASSIGNMENTS_SCENARIO",
  "EXPO_PUBLIC_WRITEWISE_CANVAS_SCENARIO",
  "EXPO_PUBLIC_WRITEWISE_ENABLE_CANVAS_BACKEND_SYNC",
  "EXPO_PUBLIC_WRITEWISE_FEEDBACK_REVIEW_SCENARIO",
] as const;

function resetScenarios() {
  scenarioEnvKeys.forEach((key) => {
    delete process.env[key];
  });
}

describe("critical flow integration scaffolds", () => {
  beforeEach(() => {
    mockLocalStore.clear();
    resetScenarios();
  });

  afterEach(() => {
    resetScenarios();
  });

  it("scaffolds onboarding completion into a grade-adapted student plan", () => {
    const profile: CompletedOnboardingProfile = {
      confidenceLevel: "building",
      dailyPracticeMinutes: 15,
      gradeLevel: 7,
      role: "student",
      writingGoals: ["write_paragraphs", "improve_grammar"],
    };

    expect(getFirstIncompleteOnboardingStep(profile)).toBeNull();
    expect(getCompletedOnboardingProfile(profile).success).toBe(true);
    expect(buildPersonalizedPlan(profile)).toMatchObject({
      assignmentFocus: "paragraph_practice",
      gradeBand: "middle",
      weeklyPracticeMinutes: 75,
    });
  });

  it("scaffolds assignment history, detail readiness, and submission", async () => {
    const history = await assignmentsApi.getAssignments({
      gradeLevel: 7,
      studentId: "student-1",
    });
    const historyViewModel = buildAssignmentHistoryViewModel({
      response: history,
      selectedTab: "all",
    });
    const assignment = history.assignments.find((candidate) => candidate.status === "in_progress");

    expect(historyViewModel).toMatchObject({
      isEmpty: false,
      isOffline: false,
      selectedTab: "all",
    });
    expect(assignment).toBeDefined();

    const detail = await assignmentsApi.getAssignmentDetail({
      assignmentId: assignment?.id ?? "missing-assignment",
      gradeLevel: 7,
      studentId: "student-1",
    });
    const detailViewModel = buildAssignmentDetailViewModel(detail);
    const submission = await assignmentsApi.submitAssignment({
      assignmentId: assignment?.id ?? "missing-assignment",
      gradeLevel: 7,
      studentId: "student-1",
    });

    expect(detailViewModel).toMatchObject({
      canStartCanvas: true,
      canStartWriting: true,
      canSubmit: true,
      isMissing: false,
    });
    expect(submission).toMatchObject({
      assignmentId: assignment?.id,
      status: "submitted",
    });
  });

  it("scaffolds canvas creation, stroke persistence, and assignment attachment", async () => {
    const created = await canvasApi.createCanvas({
      gradeLevel: 4,
      studentId: "student-1",
      template: "lined_paper",
    });
    const stroke = createCanvasStroke({
      color: "#0F172A",
      point: {
        x: 0.35,
        y: 0.45,
      },
      timestamp: "2026-06-09T09:00:00.000Z",
      tool: "pen",
      width: 4,
    });
    const saved = await canvasApi.saveCanvas({
      document: addCanvasStroke(created, stroke),
      gradeLevel: 4,
      studentId: "student-1",
    });
    const attached = await canvasApi.attachCanvasToAssignment({
      assignmentId: "assignment-1",
      canvasId: saved.id,
      gradeLevel: 4,
      studentId: "student-1",
    });
    const attachedSummary = await canvasApi.getAttachedCanvasSummary({
      assignmentId: "assignment-1",
      gradeLevel: 4,
      studentId: "student-1",
    });

    expect(attached).toMatchObject({
      assignmentId: "assignment-1",
      studentId: "student-1",
      template: "lined_paper",
    });
    expect(attached.strokes).toHaveLength(1);
    expect(attachedSummary).toMatchObject({
      assignmentId: "assignment-1",
      id: attached.id,
      isAttached: true,
      strokeCount: 1,
    });
  });

  it("scaffolds feedback review and focused revision validation after submission", async () => {
    const history = await assignmentsApi.getAssignments({
      gradeLevel: 7,
      studentId: "student-1",
    });
    const assignment = history.assignments.find((candidate) => candidate.status === "in_progress");

    expect(assignment).toBeDefined();

    const submission = await assignmentsApi.submitAssignment({
      assignmentId: assignment?.id ?? "missing-assignment",
      gradeLevel: 7,
      studentId: "student-1",
    });
    const response = await feedbackReviewApi.getFeedbackReview({
      gradeLevel: 7,
      studentId: "student-1",
      submissionId: submission.submissionId,
    });
    const viewModel = buildFeedbackReviewViewModel(response);

    expect(viewModel).toMatchObject({
      isOffline: false,
      review: {
        status: "completed",
        submissionId: submission.submissionId,
      },
    });
    expect(viewModel?.review.summary.nextRevisionTask).toMatch(/revise/i);
    expect(
      getFeedbackRevisionValidation(
        "Practice helps writers improve because one specific feedback note shows what to try next.",
        viewModel?.review.revisionTask.originalExcerpt ?? "",
      ),
    ).toEqual({
      canSubmit: true,
      error: null,
    });
  });
});
