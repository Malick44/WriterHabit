import type {
  TeacherClassProgressApiResponse,
  TeacherDashboardApiResponse,
  TeacherSubmissionReviewApiResponse,
} from "../types";
import { validateTeacherAssignmentForm } from "./teacherAssignmentValidation";
import {
  buildTeacherClassProgressViewModel,
  buildTeacherDashboardViewModel,
  buildTeacherSubmissionReviewViewModel,
  getTeacherGradeAdaptation,
} from "./teacherViewModel";

const baseDashboard: TeacherDashboardApiResponse = {
  assignments: [
    {
      allowCanvas: true,
      assignmentType: "paragraph_writing",
      classId: "class-1",
      className: "Room 214",
      completionPercent: 65,
      createdAt: "2026-06-09T09:00:00.000Z",
      dueDate: "2026-06-16",
      dueLabel: "Due Jun 16",
      gradeLevel: 7,
      id: "assignment-1",
      prompt: "Write a paragraph.",
      rubric: [{ description: "Clear topic.", id: "topic", label: "Topic", maxScore: 4 }],
      skillFocus: ["organization"],
      status: "active",
      submissionsCount: 10,
      title: "Paragraph",
    },
  ],
  classes: [
    {
      activeAssignmentCount: 1,
      averageCompletionPercent: 70,
      averageSkillScore: 68,
      gradeLevel: 7,
      id: "class-1",
      name: "Room 214",
      studentCount: 28,
      submissionsNeedingReview: 4,
      trendLabel: "Organization is improving",
      weeklyWritingMinutes: 640,
    },
    {
      activeAssignmentCount: 1,
      averageCompletionPercent: 90,
      averageSkillScore: 78,
      gradeLevel: 10,
      id: "class-2",
      name: "Argument Studio",
      studentCount: 24,
      submissionsNeedingReview: 2,
      trendLabel: "Evidence needs practice",
      weeklyWritingMinutes: 820,
    },
  ],
  connectionStatus: "offline_cached",
  generatedAt: "2026-06-09T09:00:00.000Z",
  safetyNote: "Coach students without rewriting.",
  submissions: [
    {
      assignmentId: "assignment-1",
      assignmentTitle: "Paragraph",
      classId: "class-1",
      className: "Room 214",
      gradeLevel: 7,
      hasCanvas: false,
      id: "submission-1",
      priority: "high",
      scorePercent: null,
      status: "awaiting_review",
      studentId: "student-1",
      studentName: "Maya",
      submittedLabel: "Today",
      wordCount: 160,
    },
  ],
  teacherId: "teacher-1",
};

describe("teacherViewModel", () => {
  it("uses grade-band detail limits for teacher views", () => {
    expect(getTeacherGradeAdaptation(4)).toMatchObject({
      band: "elementary",
      showDetailedRubric: false,
      visibleRubricRows: 2,
    });

    expect(getTeacherGradeAdaptation(10)).toMatchObject({
      band: "high",
      showDetailedRubric: true,
      visibleRubricRows: 5,
    });
  });

  it("builds dashboard metrics from classes and review queue", () => {
    const viewModel = buildTeacherDashboardViewModel(baseDashboard);

    expect(viewModel.isOffline).toBe(true);
    expect(viewModel.metrics.totalStudents).toBe(52);
    expect(viewModel.metrics.reviewQueue).toBe(1);
    expect(viewModel.metrics.averageCompletionPercent).toBe(80);
  });

  it("marks a dashboard with no classes as empty", () => {
    const viewModel = buildTeacherDashboardViewModel({
      ...baseDashboard,
      assignments: [],
      classes: [],
      submissions: [],
    });

    expect(viewModel.isEmpty).toBe(true);
  });

  it("builds class progress support groups and visible trend slices", () => {
    const response: TeacherClassProgressApiResponse = {
      classSummary: baseDashboard.classes[0],
      connectionStatus: "online",
      generatedAt: "2026-06-09T09:00:00.000Z",
      instructionalGroups: [
        {
          action: "Add one example.",
          description: "Practice examples.",
          id: "group-1",
          skill: "organization",
          studentNames: ["Maya"],
          title: "Organizers",
        },
      ],
      skillTrends: [
        {
          averageScore: 70,
          changeLabel: "+5",
          label: "Organization",
          skill: "organization",
          studentCount: 28,
        },
      ],
      students: [
        {
          assignmentCompletionPercent: 65,
          averageRubricScore: 62,
          displayName: "Maya",
          focusSkill: "organization",
          gradeLevel: 7,
          id: "student-1",
          lastSubmissionLabel: "Today",
          needsSupport: true,
          revisionRatePercent: 40,
        },
      ],
    };

    const viewModel = buildTeacherClassProgressViewModel(response);

    expect(viewModel?.isEmpty).toBe(false);
    expect(viewModel?.supportStudents).toHaveLength(1);
    expect(viewModel?.skillTrends).toHaveLength(1);
  });

  it("totals submission rubric scores", () => {
    const response: TeacherSubmissionReviewApiResponse = {
      connectionStatus: "online",
      generatedAt: "2026-06-09T09:00:00.000Z",
      review: {
        assignmentPrompt: "Write an argument paragraph.",
        assignmentTitle: "Argument paragraph",
        canvasPreview: null,
        className: "Argument Studio",
        gradeLevel: 10,
        id: "submission-1",
        revisionTask: "Add one analysis sentence.",
        rubric: [
          { coachingNote: "Focused claim.", criterionId: "claim", label: "Claim", maxScore: 4, score: 4 },
          { coachingNote: "Explain evidence.", criterionId: "analysis", label: "Analysis", maxScore: 4, score: 2 },
        ],
        safetyNote: "Coach students without rewriting.",
        studentName: "Ari",
        submittedLabel: "Today",
        teacherComment: "Strong claim. Add analysis.",
        writingPreview: "Technology can improve learning through feedback.",
        wordCount: 180,
      },
    };

    expect(buildTeacherSubmissionReviewViewModel(response)).toMatchObject({
      rubricEarned: 6,
      rubricMax: 8,
      rubricScoreValue: 0.75,
    });
  });

  it("validates and normalizes assignment creation form values", () => {
    const result = validateTeacherAssignmentForm({
      allowCanvas: true,
      classId: "class-1",
      dueDate: "2026-06-16",
      gradeLevel: "10",
      prompt: "Write an argument paragraph with a claim, evidence, and analysis.",
      rubricText: "Claim\nEvidence\nAnalysis",
      skillFocus: ["argument_strength", "evidence_usage"],
      title: "Argument paragraph",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.input.assignmentType).toBe("essay_writing");
      expect(result.input.rubric).toEqual(["Claim", "Evidence", "Analysis"]);
    }
  });

  it("returns field errors for invalid assignment creation values", () => {
    const result = validateTeacherAssignmentForm({
      allowCanvas: true,
      classId: "",
      dueDate: "soon",
      gradeLevel: "13",
      prompt: "Too short",
      rubricText: "Only one",
      skillFocus: ["clarity", "grammar", "organization", "vocabulary"],
      title: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.classId).toBe("teacher.create.errors.classRequired");
      expect(result.fieldErrors.skillFocus).toBe("teacher.create.errors.skillTooMany");
    }
  });
});
