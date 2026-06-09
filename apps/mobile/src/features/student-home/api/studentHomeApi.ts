import type { GradeLevel } from "@writewise/shared";

import {
  studentHomeApiResponseSchema,
  studentHomeScenarioSchema,
  type StudentHomeApiResponse,
  type StudentHomeScenario,
} from "../types";

interface GetStudentHomeDashboardInput {
  gradeLevel?: GradeLevel;
  studentId: string;
}

function readScenario(): StudentHomeScenario {
  const parsed = studentHomeScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WRITEWISE_STUDENT_HOME_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

function getGradeLevel(input: GetStudentHomeDashboardInput): GradeLevel {
  return input.gradeLevel ?? 7;
}

function createAssignmentForGrade(gradeLevel: GradeLevel): StudentHomeApiResponse["todayAssignment"] {
  if (gradeLevel <= 5) {
    return {
      assignmentType: "sentence_practice",
      coachSuggestion: "Start with your own sentence, then ask for a hint if you get stuck.",
      dueLabel: "Today",
      estimatedMinutes: 10,
      gradeLevelMax: 5,
      gradeLevelMin: 1,
      id: "daily-sentence-details",
      prompt: "Write three sentences about a place you know. Add one describing word to each sentence.",
      rubricFocus: ["Clear sentence", "Describing word", "Capital letters"],
      skillFocus: ["sentence_structure", "vocabulary"],
      status: "not_started",
      title: "Add details to sentences",
    };
  }

  if (gradeLevel <= 8) {
    return {
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
    };
  }

  return {
    assignmentType: "essay_writing",
    coachSuggestion: "Use the coach for questions about structure, evidence, or revision choices.",
    dueLabel: "Today",
    estimatedMinutes: 25,
    gradeLevelMax: 12,
    gradeLevelMin: 9,
    id: "daily-essay-thesis-evidence",
    prompt: "Draft a thesis and one evidence-based body paragraph about how technology affects learning.",
    rubricFocus: ["Thesis", "Evidence usage", "Analysis", "Revision quality"],
    skillFocus: ["argument_strength", "evidence_usage", "organization", "revision_quality"],
    status: "in_progress",
    title: "Strengthen a thesis and evidence",
  };
}

function createDraftForGrade(gradeLevel: GradeLevel): StudentHomeApiResponse["continueDraft"] {
  if (gradeLevel <= 5) {
    return {
      assignmentId: "daily-sentence-details",
      lastEditedLabel: "Saved 12 minutes ago",
      preview: "The park is bright. I see a tall slide...",
      revisionNumber: 0,
      title: "My park sentences",
      wordCount: 22,
    };
  }

  if (gradeLevel <= 8) {
    return {
      assignmentId: "daily-paragraph-evidence",
      lastEditedLabel: "Saved 18 minutes ago",
      preview: "Practice matters more because people can improve with feedback...",
      revisionNumber: 1,
      title: "Practice and talent paragraph",
      wordCount: 96,
    };
  }

  return {
    assignmentId: "daily-essay-thesis-evidence",
    lastEditedLabel: "Saved 25 minutes ago",
    preview: "Technology affects learning most when it gives students faster feedback...",
    revisionNumber: 2,
    title: "Technology and learning paragraph",
    wordCount: 184,
  };
}

function createDashboard(input: GetStudentHomeDashboardInput, scenario: StudentHomeScenario): StudentHomeApiResponse {
  const gradeLevel = getGradeLevel(input);
  const isEmpty = scenario === "empty";
  const practicedToday = scenario === "practice_complete";
  const response: StudentHomeApiResponse = {
    connectionStatus: scenario === "offline" ? "offline_cached" : "online",
    continueDraft: isEmpty ? null : createDraftForGrade(gradeLevel),
    dailyPractice: {
      completedToday: practicedToday,
      minutesGoal: gradeLevel <= 5 ? 10 : gradeLevel <= 8 ? 15 : 25,
      nextPromptLabel: gradeLevel <= 5 ? "Sentence warmup" : gradeLevel <= 8 ? "Paragraph practice" : "Essay focus block",
    },
    generatedAt: new Date("2026-06-08T09:00:00.000Z").toISOString(),
    gradeLevel,
    recentFeedback: isEmpty
      ? []
      : [
          {
            createdLabel: "Yesterday",
            improvement:
              gradeLevel <= 5
                ? "Add one more detail so the reader can picture it."
                : gradeLevel <= 8
                  ? "Use a clearer example after your topic sentence."
                  : "Connect the evidence back to the claim with one analysis sentence.",
            revisionTask:
              gradeLevel <= 5
                ? "Add one describing word to your favorite sentence."
                : gradeLevel <= 8
                  ? "Revise one sentence so the reason is more specific."
                  : "Revise the last sentence to explain why the evidence matters.",
            skill: gradeLevel <= 5 ? "vocabulary" : gradeLevel <= 8 ? "clarity" : "evidence_usage",
            strength:
              gradeLevel <= 5
                ? "You used a clear beginning."
                : gradeLevel <= 8
                  ? "Your paragraph has a clear opinion."
                  : "Your claim is focused and arguable.",
            submissionId: "feedback-latest",
            title: gradeLevel <= 5 ? "Story detail feedback" : gradeLevel <= 8 ? "Paragraph feedback" : "Argument feedback",
          },
        ],
    revisionNudges: isEmpty
      ? []
      : [
          gradeLevel <= 5
            ? "Try rereading one sentence out loud before you submit."
            : gradeLevel <= 8
              ? "Check that each detail supports the topic sentence."
              : "Make sure every evidence sentence is followed by your own analysis.",
        ],
    skillProgress: isEmpty
      ? []
      : gradeLevel <= 5
        ? [
            { currentScore: 68, label: "Sentences", previousScore: 61, skill: "sentence_structure" },
            { currentScore: 58, label: "Word choice", previousScore: 54, skill: "vocabulary" },
          ]
        : gradeLevel <= 8
          ? [
              { currentScore: 72, label: "Organization", previousScore: 66, skill: "organization" },
              { currentScore: 64, label: "Clarity", previousScore: 60, skill: "clarity" },
              { currentScore: 59, label: "Revision", previousScore: 52, skill: "revision_quality" },
            ]
          : [
              { currentScore: 76, label: "Evidence", previousScore: 70, skill: "evidence_usage" },
              { currentScore: 69, label: "Argument", previousScore: 64, skill: "argument_strength" },
              { currentScore: 62, label: "Revision", previousScore: 57, skill: "revision_quality" },
            ],
    streak: {
      bestDays: isEmpty ? 0 : 9,
      currentDays: isEmpty ? 0 : 4,
      nextMilestoneDays: gradeLevel <= 5 ? 5 : 7,
      practicedToday,
    },
    studentId: input.studentId,
    todayAssignment: isEmpty ? null : createAssignmentForGrade(gradeLevel),
    weeklyWriting: {
      minutesCompleted: isEmpty ? 0 : gradeLevel <= 5 ? 22 : gradeLevel <= 8 ? 54 : 92,
      minutesGoal: gradeLevel <= 5 ? 50 : gradeLevel <= 8 ? 75 : 125,
      sessionsCompleted: isEmpty ? 0 : practicedToday ? 4 : 3,
    },
  };

  return studentHomeApiResponseSchema.parse(response);
}

export const studentHomeApi = {
  async getDashboard(input: GetStudentHomeDashboardInput): Promise<StudentHomeApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Student home dashboard mock error");
    }

    return createDashboard(input, scenario);
  },
};
