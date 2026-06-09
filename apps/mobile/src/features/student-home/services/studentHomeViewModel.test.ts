import { buildStudentHomeViewModel, getStudentHomeGradeAdaptation } from "./studentHomeViewModel";
import type { StudentHomeApiResponse } from "../types";

const baseDashboard: StudentHomeApiResponse = {
  connectionStatus: "online",
  continueDraft: {
    assignmentId: "daily-paragraph-evidence",
    lastEditedLabel: "Saved 18 minutes ago",
    preview: "Practice matters more because people can improve with feedback...",
    revisionNumber: 1,
    title: "Practice and talent paragraph",
    wordCount: 96,
  },
  dailyPractice: {
    completedToday: false,
    minutesGoal: 15,
    nextPromptLabel: "Paragraph practice",
  },
  generatedAt: "2026-06-08T09:00:00.000Z",
  gradeLevel: 7,
  recentFeedback: [
    {
      createdLabel: "Yesterday",
      improvement: "Use a clearer example after your topic sentence.",
      revisionTask: "Revise one sentence so the reason is more specific.",
      skill: "clarity",
      strength: "Your paragraph has a clear opinion.",
      submissionId: "feedback-latest",
      title: "Paragraph feedback",
    },
  ],
  revisionNudges: ["Check that each detail supports the topic sentence."],
  skillProgress: [
    { currentScore: 72, label: "Organization", previousScore: 66, skill: "organization" },
    { currentScore: 64, label: "Clarity", previousScore: 60, skill: "clarity" },
    { currentScore: 59, label: "Revision", previousScore: 52, skill: "revision_quality" },
  ],
  streak: {
    bestDays: 9,
    currentDays: 4,
    nextMilestoneDays: 7,
    practicedToday: false,
  },
  studentId: "student-1",
  todayAssignment: {
    assignmentType: "paragraph_writing",
    coachSuggestion: "Build your topic sentence first, then add two details in your own words.",
    dueLabel: "Today",
    estimatedMinutes: 15,
    gradeLevelMax: 8,
    gradeLevelMin: 6,
    id: "daily-paragraph-evidence",
    prompt: "Write a paragraph explaining whether practice or talent matters more when learning a skill.",
    rubricFocus: ["Topic sentence", "Supporting detail", "Revision quality"],
    skillFocus: ["organization", "clarity", "revision_quality"],
    status: "in_progress",
    title: "Support a paragraph idea",
  },
  weeklyWriting: {
    minutesCompleted: 54,
    minutesGoal: 75,
    sessionsCompleted: 3,
  },
};

describe("studentHomeViewModel", () => {
  it("adapts the dashboard for elementary students with fewer visible metrics", () => {
    expect(getStudentHomeGradeAdaptation("elementary")).toMatchObject({
      showDetailedFeedback: false,
      showRubricFocus: false,
      visibleSkillCount: 2,
    });
  });

  it("builds safe coach actions that continue student-owned writing", () => {
    const viewModel = buildStudentHomeViewModel({
      dashboard: baseDashboard,
      displayName: "Student Writer",
    });

    expect(viewModel.studentFirstName).toBe("Student");
    expect(viewModel.coachActions.map((action) => action.labelKey)).toEqual([
      "aiCoach.hintCta",
      "aiCoach.brainstormCta",
      "aiCoach.sentenceCheckCta",
      "writingWorkspace.revise",
    ]);
    expect(viewModel.coachActions.every((action) => action.target.kind === "write")).toBe(true);
  });

  it("marks an empty dashboard when there is no actionable student activity", () => {
    const viewModel = buildStudentHomeViewModel({
      dashboard: {
        ...baseDashboard,
        continueDraft: null,
        recentFeedback: [],
        revisionNudges: [],
        skillProgress: [],
        todayAssignment: null,
        weeklyWriting: {
          minutesCompleted: 0,
          minutesGoal: 75,
          sessionsCompleted: 0,
        },
      },
      displayName: "",
    });

    expect(viewModel.isEmpty).toBe(true);
    expect(viewModel.studentFirstName).toBe("Writer");
  });

  it("marks cached dashboard data as offline", () => {
    const viewModel = buildStudentHomeViewModel({
      dashboard: {
        ...baseDashboard,
        connectionStatus: "offline_cached",
      },
      displayName: "Student Writer",
    });

    expect(viewModel.isOffline).toBe(true);
  });
});
