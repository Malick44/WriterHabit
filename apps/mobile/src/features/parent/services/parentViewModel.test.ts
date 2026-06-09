import {
  buildParentAssignmentReviewViewModel,
  buildParentDashboardViewModel,
  getParentGradeAdaptation,
} from "./parentViewModel";
import type { ParentAssignmentReviewApiResponse, ParentDashboardApiResponse } from "../types";

const baseDashboard: ParentDashboardApiResponse = {
  assignments: [
    {
      assignmentType: "paragraph_writing",
      feedbackSummary: "Clear opinion.",
      hasCanvas: false,
      scorePercent: 82,
      skillFocus: ["clarity"],
      status: "feedback_ready",
      studentId: "student-1",
      submissionId: "submission-1",
      submittedLabel: "Today",
      title: "Paragraph",
    },
  ],
  connectionStatus: "online",
  generatedAt: "2026-06-08T09:00:00.000Z",
  parentId: "parent-1",
  selectedStudentId: "student-1",
  settingsSummary: {
    aiCoachAccess: "hints_and_revision",
    assignmentAlertsEnabled: true,
    digestFrequency: "weekly",
    practiceReminderEnabled: true,
    quietHoursLabel: "8:00 PM - 7:00 AM",
    shareWeeklySummaryWithTeacher: false,
    weeklyReportEmailEnabled: true,
  },
  skillProgress: [
    {
      currentScore: 75,
      label: "Clarity",
      nextPractice: "Add one example.",
      previousScore: 68,
      skill: "clarity",
      trendDescription: "Up 7 points",
    },
  ],
  students: [
    {
      avatarInitials: "MS",
      displayName: "Miles",
      gradeLevel: 7,
      id: "student-1",
      relationshipLabel: "Son",
      schoolLabel: "Grade 7",
    },
  ],
  weeklyProgress: {
    areaToPractice: "organization",
    areaToPracticeDescription: "Practice topic sentences.",
    areaToPracticeLabel: "Organization",
    assignedAssignments: 4,
    celebration: "Finished practice.",
    completedAssignments: 5,
    minutesCompleted: 120,
    minutesGoal: 75,
    sessionsCompleted: 4,
    skillImprovementPercent: 9,
    streakDays: 4,
    weekLabel: "Jun 2-8",
  },
};

describe("parentViewModel", () => {
  it("uses grade-band settings for parent-visible detail", () => {
    expect(getParentGradeAdaptation(3)).toMatchObject({
      band: "elementary",
      showDetailedRubric: false,
      visibleSkillCount: 2,
    });

    expect(getParentGradeAdaptation(10)).toMatchObject({
      band: "high",
      showDetailedRubric: true,
      visibleSkillCount: 5,
    });
  });

  it("builds dashboard progress and clamps over-completed goals", () => {
    const viewModel = buildParentDashboardViewModel(baseDashboard);

    expect(viewModel.isEmpty).toBe(false);
    expect(viewModel.weeklyProgressValue).toBe(1);
    expect(viewModel.assignmentCompletionValue).toBe(1);
    expect(viewModel.gradeAdaptation.band).toBe("middle");
  });

  it("marks dashboards without linked students as empty", () => {
    const viewModel = buildParentDashboardViewModel({
      ...baseDashboard,
      assignments: [],
      selectedStudentId: null,
      skillProgress: [],
      students: [],
      weeklyProgress: null,
    });

    expect(viewModel.isEmpty).toBe(true);
    expect(viewModel.selectedStudent).toBeNull();
  });

  it("totals rubric rows for assignment review", () => {
    const response: ParentAssignmentReviewApiResponse = {
      connectionStatus: "offline_cached",
      generatedAt: "2026-06-08T09:00:00.000Z",
      review: {
        aiFeedback: {
          improvement: "Add analysis.",
          revisionTask: "Explain why the evidence matters.",
          strength: "Focused claim.",
        },
        assignmentPrompt: "Write a paragraph.",
        assignmentTitle: "Argument paragraph",
        canvasPreview: null,
        gradeLevel: 10,
        parentGuidance: ["Ask where the evidence supports the claim."],
        rubric: [
          { description: "Focused claim.", id: "claim", label: "Claim", maxScore: 4, score: 4 },
          { description: "Evidence is relevant.", id: "evidence", label: "Evidence", maxScore: 4, score: 3 },
        ],
        safetyNote: "Coaching only.",
        studentId: "student-1",
        studentName: "Ari",
        submittedLabel: "Today",
        submissionId: "submission-1",
        wordCount: 180,
        writingPreview: "Technology can help learning when feedback is timely.",
      },
    };

    expect(buildParentAssignmentReviewViewModel(response)).toMatchObject({
      gradeAdaptation: { band: "high" },
      isOffline: true,
      rubricEarned: 7,
      rubricMax: 8,
      rubricScoreValue: 0.875,
    });
  });
});
