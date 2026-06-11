
import {
  parentAssignmentReviewApiResponseSchema,
  parentDashboardApiResponseSchema,
  parentScenarioSchema,
  parentSettingsApiResponseSchema,
  parentStudentReportApiResponseSchema,
  type ParentAssignmentReview,
  type ParentAssignmentReviewApiResponse,
  type ParentAssignmentSummary,
  type ParentDashboardApiResponse,
  type ParentScenario,
  type ParentSettings,
  type ParentSettingsApiResponse,
  type ParentSkillProgress,
  type ParentStudentReportApiResponse,
  type ParentStudentSummary,
  type ParentWeeklyProgress,
} from "../types";

interface ParentRequestInput {
  parentId: string;
}

interface ParentDashboardInput extends ParentRequestInput {
  selectedStudentId?: string;
}

interface ParentStudentInput extends ParentRequestInput {
  studentId?: string;
}

interface ParentAssignmentReviewInput extends ParentRequestInput {
  submissionId?: string;
}

interface ParentSettingsInput extends ParentRequestInput {
  settings: ParentSettings;
}

const generatedAt = "2026-06-08T09:00:00.000Z";

const parentStudents: ParentStudentSummary[] = [
  {
    avatarInitials: "EM",
    displayName: "Emma",
    gradeLevel: 4,
    id: "student-emma",
    relationshipLabel: "Daughter",
    schoolLabel: "Grade 4",
  },
  {
    avatarInitials: "MJ",
    displayName: "Miles",
    gradeLevel: 7,
    id: "student-miles",
    relationshipLabel: "Son",
    schoolLabel: "Grade 7",
  },
  {
    avatarInitials: "AR",
    displayName: "Ari",
    gradeLevel: 10,
    id: "student-ari",
    relationshipLabel: "Student",
    schoolLabel: "Grade 10",
  },
];

const defaultSettings: ParentSettings = {
  aiCoachAccess: "hints_and_revision",
  assignmentAlertsEnabled: true,
  digestFrequency: "weekly",
  practiceReminderEnabled: true,
  quietHoursLabel: "8:00 PM - 7:00 AM",
  shareWeeklySummaryWithTeacher: false,
  weeklyReportEmailEnabled: true,
};

function readScenario(): ParentScenario {
  const parsed = parentScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WriterHabit_PARENT_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

function getConnectionStatus(scenario: ParentScenario): ParentDashboardApiResponse["connectionStatus"] {
  return scenario === "offline" ? "offline_cached" : "online";
}

function getSelectedStudent(studentId?: string): ParentStudentSummary {
  return parentStudents.find((student) => student.id === studentId) ?? parentStudents[0];
}

function buildWeeklyProgress(student: ParentStudentSummary): ParentWeeklyProgress {
  if (student.gradeLevel <= 5) {
    return {
      areaToPractice: "vocabulary",
      areaToPracticeDescription: "Emma is ready to add more describing words to her sentences.",
      areaToPracticeLabel: "Word choice",
      assignedAssignments: 4,
      celebration: "Emma finished three short writing practices and used feedback to add details.",
      completedAssignments: 3,
      minutesCompleted: 34,
      minutesGoal: 50,
      sessionsCompleted: 4,
      skillImprovementPercent: 8,
      streakDays: 5,
      weekLabel: "Jun 2-8",
    };
  }

  if (student.gradeLevel <= 8) {
    return {
      areaToPractice: "organization",
      areaToPracticeDescription: "Miles should keep practicing topic sentences and supporting details.",
      areaToPracticeLabel: "Paragraph organization",
      assignedAssignments: 5,
      celebration: "Miles revised two paragraphs and improved clarity after feedback.",
      completedAssignments: 4,
      minutesCompleted: 68,
      minutesGoal: 75,
      sessionsCompleted: 5,
      skillImprovementPercent: 11,
      streakDays: 6,
      weekLabel: "Jun 2-8",
    };
  }

  return {
    areaToPractice: "evidence_usage",
    areaToPracticeDescription: "Ari should connect evidence back to the claim with more analysis.",
    areaToPracticeLabel: "Evidence analysis",
    assignedAssignments: 4,
    celebration: "Ari completed a revision pass and strengthened thesis focus.",
    completedAssignments: 3,
    minutesCompleted: 112,
    minutesGoal: 125,
    sessionsCompleted: 4,
    skillImprovementPercent: 7,
    streakDays: 4,
    weekLabel: "Jun 2-8",
  };
}

function buildSkillProgress(student: ParentStudentSummary): ParentSkillProgress[] {
  if (student.gradeLevel <= 5) {
    return [
      {
        currentScore: 72,
        label: "Sentences",
        nextPractice: "Read one sentence out loud and add one detail.",
        previousScore: 64,
        skill: "sentence_structure",
        trendDescription: "Up 8 points this week",
      },
      {
        currentScore: 61,
        label: "Word choice",
        nextPractice: "Choose one stronger describing word.",
        previousScore: 56,
        skill: "vocabulary",
        trendDescription: "Up 5 points this week",
      },
      {
        currentScore: 67,
        label: "Handwriting",
        nextPractice: "Use the lined canvas for one short response.",
        previousScore: 65,
        skill: "handwriting",
        trendDescription: "Steady progress",
      },
    ];
  }

  if (student.gradeLevel <= 8) {
    return [
      {
        currentScore: 76,
        label: "Clarity",
        nextPractice: "Add one specific example after the topic sentence.",
        previousScore: 69,
        skill: "clarity",
        trendDescription: "Up 7 points this week",
      },
      {
        currentScore: 70,
        label: "Organization",
        nextPractice: "Check that each detail supports the same main idea.",
        previousScore: 64,
        skill: "organization",
        trendDescription: "Up 6 points this week",
      },
      {
        currentScore: 66,
        label: "Revision",
        nextPractice: "Revise one sentence for a clearer reason.",
        previousScore: 59,
        skill: "revision_quality",
        trendDescription: "Up 7 points this week",
      },
      {
        currentScore: 63,
        label: "Grammar",
        nextPractice: "Check commas after introductory phrases.",
        previousScore: 61,
        skill: "grammar",
        trendDescription: "Steady progress",
      },
    ];
  }

  return [
    {
      currentScore: 78,
      label: "Thesis",
      nextPractice: "Make the claim arguable before drafting evidence.",
      previousScore: 73,
      skill: "argument_strength",
      trendDescription: "Up 5 points this week",
    },
    {
      currentScore: 72,
      label: "Evidence",
      nextPractice: "Add analysis after each evidence sentence.",
      previousScore: 65,
      skill: "evidence_usage",
      trendDescription: "Up 7 points this week",
    },
    {
      currentScore: 68,
      label: "Organization",
      nextPractice: "Use a transition before the counterpoint.",
      previousScore: 64,
      skill: "organization",
      trendDescription: "Up 4 points this week",
    },
    {
      currentScore: 65,
      label: "Revision",
      nextPractice: "Run one revision pass for sentence variety.",
      previousScore: 60,
      skill: "revision_quality",
      trendDescription: "Up 5 points this week",
    },
    {
      currentScore: 74,
      label: "Clarity",
      nextPractice: "Trim one sentence that repeats an idea.",
      previousScore: 72,
      skill: "clarity",
      trendDescription: "Steady progress",
    },
  ];
}

function buildAssignmentSummaries(student: ParentStudentSummary): ParentAssignmentSummary[] {
  if (student.gradeLevel <= 5) {
    return [
      {
        assignmentType: "sentence_practice",
        feedbackSummary: "Strong beginning; next step is adding one more detail.",
        hasCanvas: true,
        scorePercent: 78,
        skillFocus: ["sentence_structure", "vocabulary"],
        status: "feedback_ready",
        studentId: student.id,
        submissionId: "submission-emma-park",
        submittedLabel: "Yesterday",
        title: "Park sentences",
      },
      {
        assignmentType: "handwriting_practice",
        feedbackSummary: "Letters are easier to read; keep spacing between words.",
        hasCanvas: true,
        scorePercent: 74,
        skillFocus: ["handwriting", "punctuation"],
        status: "completed",
        studentId: student.id,
        submissionId: "submission-emma-handwriting",
        submittedLabel: "Fri",
        title: "Lined handwriting practice",
      },
    ];
  }

  if (student.gradeLevel <= 8) {
    return [
      {
        assignmentType: "paragraph_writing",
        feedbackSummary: "Clear opinion; next revision should add a more specific example.",
        hasCanvas: false,
        scorePercent: 82,
        skillFocus: ["clarity", "organization", "revision_quality"],
        status: "revision_in_progress",
        studentId: student.id,
        submissionId: "submission-miles-practice",
        submittedLabel: "Today",
        title: "Practice and talent paragraph",
      },
      {
        assignmentType: "reading_response",
        feedbackSummary: "Good summary; keep evidence in the same order as the passage.",
        hasCanvas: true,
        scorePercent: 79,
        skillFocus: ["reading_response", "organization"],
        status: "completed",
        studentId: student.id,
        submissionId: "submission-miles-response",
        submittedLabel: "Mon",
        title: "Reading response notes",
      },
      {
        assignmentType: "grammar_practice",
        feedbackSummary: "Comma choices improved after revision.",
        hasCanvas: false,
        scorePercent: 76,
        skillFocus: ["grammar", "punctuation"],
        status: "feedback_ready",
        studentId: student.id,
        submissionId: "submission-miles-commas",
        submittedLabel: "Fri",
        title: "Comma practice",
      },
    ];
  }

  return [
    {
      assignmentType: "essay_writing",
      feedbackSummary: "Focused thesis; evidence needs one more analysis sentence.",
      hasCanvas: false,
      scorePercent: 84,
      skillFocus: ["argument_strength", "evidence_usage", "organization"],
      status: "revision_in_progress",
      studentId: student.id,
      submissionId: "submission-ari-technology",
      submittedLabel: "Today",
      title: "Technology and learning paragraph",
    },
    {
      assignmentType: "test_prep",
      feedbackSummary: "Claim is clear; counterpoint transition is the next focus.",
      hasCanvas: false,
      scorePercent: 81,
      skillFocus: ["argument_strength", "clarity"],
      status: "feedback_ready",
      studentId: student.id,
      submissionId: "submission-ari-counterpoint",
      submittedLabel: "Tue",
      title: "Argument counterpoint",
    },
    {
      assignmentType: "essay_writing",
      feedbackSummary: "Outline shows a logical evidence order.",
      hasCanvas: true,
      scorePercent: 80,
      skillFocus: ["organization", "evidence_usage"],
      status: "completed",
      studentId: student.id,
      submissionId: "submission-ari-outline",
      submittedLabel: "Fri",
      title: "Evidence outline",
    },
  ];
}

function buildAssignmentReview(student: ParentStudentSummary, submissionId: string): ParentAssignmentReview {
  if (student.gradeLevel <= 5) {
    return {
      aiFeedback: {
        improvement: "Add one more describing word so the reader can picture the park.",
        revisionTask: "Choose your favorite sentence and add one detail.",
        strength: "Emma wrote clear complete sentences.",
      },
      assignmentPrompt: "Write three sentences about a place you know. Add one describing word to each sentence.",
      assignmentTitle: "Park sentences",
      canvasPreview: {
        canvasId: "canvas-emma-park",
        strokeCount: 42,
        templateLabel: "Lined handwriting",
        title: "Sentence sketch",
      },
      gradeLevel: student.gradeLevel,
      parentGuidance: [
        "Ask Emma to read one sentence out loud.",
        "Celebrate the sentence that already has the clearest detail.",
      ],
      rubric: [
        {
          description: "The response uses complete sentences.",
          id: "complete-sentences",
          label: "Complete sentences",
          maxScore: 4,
          score: 3,
        },
        {
          description: "The response includes describing words.",
          id: "describing-words",
          label: "Describing words",
          maxScore: 4,
          score: 3,
        },
        {
          description: "The response uses capitals and punctuation.",
          id: "mechanics",
          label: "Capitals and punctuation",
          maxScore: 4,
          score: 3,
        },
      ],
      safetyNote: "WriterHabit gives hints and revision tasks, not finished student work.",
      studentId: student.id,
      studentName: student.displayName,
      submittedLabel: "Yesterday",
      submissionId,
      wordCount: 36,
      writingPreview: "The park is bright. I see a tall slide. My dog runs fast by the swings.",
    };
  }

  if (student.gradeLevel <= 8) {
    return {
      aiFeedback: {
        improvement: "The paragraph needs a more specific example after the topic sentence.",
        revisionTask: "Add one example that proves why practice helps people improve.",
        strength: "Miles has a clear opinion and keeps the paragraph focused.",
      },
      assignmentPrompt: "Write a paragraph explaining whether practice or talent matters more when learning a skill.",
      assignmentTitle: "Practice and talent paragraph",
      canvasPreview: null,
      gradeLevel: student.gradeLevel,
      parentGuidance: [
        "Ask Miles what example best supports the opinion.",
        "Look for one revision that makes the reason more specific.",
      ],
      rubric: [
        {
          description: "The topic sentence gives a clear opinion.",
          id: "topic-sentence",
          label: "Topic sentence",
          maxScore: 4,
          score: 4,
        },
        {
          description: "Details explain the opinion with examples.",
          id: "supporting-details",
          label: "Supporting details",
          maxScore: 4,
          score: 3,
        },
        {
          description: "Revision improves clarity and flow.",
          id: "revision-quality",
          label: "Revision quality",
          maxScore: 4,
          score: 3,
        },
      ],
      safetyNote: "WriterHabit keeps feedback focused on coaching and student-owned revision.",
      studentId: student.id,
      studentName: student.displayName,
      submittedLabel: "Today",
      submissionId,
      wordCount: 142,
      writingPreview:
        "Practice matters more because people can improve when they repeat a skill and get feedback. Talent helps at first, but practice makes the skill stronger over time.",
    };
  }

  return {
    aiFeedback: {
      improvement: "The evidence needs one more analysis sentence that connects back to the thesis.",
      revisionTask: "After the evidence sentence, explain why that evidence proves the claim.",
      strength: "Ari's claim is focused and arguable.",
    },
    assignmentPrompt:
      "Draft a thesis and one evidence-based body paragraph about how technology affects learning.",
    assignmentTitle: "Technology and learning paragraph",
    canvasPreview: {
      canvasId: "canvas-ari-outline",
      strokeCount: 31,
      templateLabel: "Essay outline",
      title: "Evidence outline",
    },
    gradeLevel: student.gradeLevel,
    parentGuidance: [
      "Ask Ari to point to the claim and the evidence sentence.",
      "Check whether the next sentence explains why the evidence matters.",
    ],
    rubric: [
      {
        description: "The thesis states a focused, arguable claim.",
        id: "thesis",
        label: "Thesis",
        maxScore: 4,
        score: 4,
      },
      {
        description: "Evidence is relevant and introduced clearly.",
        id: "evidence",
        label: "Evidence",
        maxScore: 4,
        score: 3,
      },
      {
        description: "Analysis explains how evidence supports the claim.",
        id: "analysis",
        label: "Analysis",
        maxScore: 4,
        score: 3,
      },
      {
        description: "Paragraph order and transitions are easy to follow.",
        id: "organization",
        label: "Organization",
        maxScore: 4,
        score: 3,
      },
    ],
    safetyNote: "WriterHabit does not generate final drafts; it gives coaching signals and revision tasks.",
    studentId: student.id,
    studentName: student.displayName,
    submittedLabel: "Today",
    submissionId,
    wordCount: 218,
    writingPreview:
      "Technology affects learning most when it gives students faster feedback. For example, writing tools can show patterns in revision and help students notice unclear sentences.",
  };
}

function buildDashboard(input: ParentDashboardInput, scenario: ParentScenario): ParentDashboardApiResponse {
  if (scenario === "empty") {
    return parentDashboardApiResponseSchema.parse({
      assignments: [],
      connectionStatus: "online",
      generatedAt,
      parentId: input.parentId,
      selectedStudentId: null,
      settingsSummary: defaultSettings,
      skillProgress: [],
      students: [],
      weeklyProgress: null,
    });
  }

  const selectedStudent = getSelectedStudent(input.selectedStudentId);

  return parentDashboardApiResponseSchema.parse({
    assignments: buildAssignmentSummaries(selectedStudent),
    connectionStatus: getConnectionStatus(scenario),
    generatedAt,
    parentId: input.parentId,
    selectedStudentId: selectedStudent.id,
    settingsSummary: defaultSettings,
    skillProgress: buildSkillProgress(selectedStudent),
    students: parentStudents,
    weeklyProgress: buildWeeklyProgress(selectedStudent),
  });
}

function buildReport(input: ParentStudentInput, scenario: ParentScenario): ParentStudentReportApiResponse {
  if (scenario === "empty") {
    return parentStudentReportApiResponseSchema.parse({
      assignments: [],
      connectionStatus: "online",
      familyNote: null,
      generatedAt,
      nextSteps: [],
      practiceFocus: [],
      skillProgress: [],
      strengths: [],
      student: null,
      weeklyProgress: null,
    });
  }

  const student = getSelectedStudent(input.studentId);
  const weeklyProgress = buildWeeklyProgress(student);

  return parentStudentReportApiResponseSchema.parse({
    assignments: buildAssignmentSummaries(student),
    connectionStatus: getConnectionStatus(scenario),
    familyNote:
      student.gradeLevel <= 5
        ? "Short read-aloud practice will help Emma notice where to add details."
        : student.gradeLevel <= 8
          ? "Miles responds well when feedback is framed as one focused revision task."
          : "Ari is ready for more targeted evidence analysis practice.",
    generatedAt,
    nextSteps:
      student.gradeLevel <= 5
        ? ["Read one sentence together.", "Ask what detail could help the reader picture it."]
        : student.gradeLevel <= 8
          ? ["Choose one paragraph.", "Ask which example best supports the topic sentence."]
          : ["Review the thesis and evidence sentence.", "Ask how the evidence proves the claim."],
    practiceFocus: [weeklyProgress.areaToPracticeLabel, weeklyProgress.areaToPracticeDescription],
    skillProgress: buildSkillProgress(student),
    strengths:
      student.gradeLevel <= 5
        ? ["Completes short practices", "Uses feedback to add details"]
        : student.gradeLevel <= 8
          ? ["Revises after feedback", "Keeps paragraph focus"]
          : ["Builds focused claims", "Uses revision feedback productively"],
    student,
    weeklyProgress,
  });
}

function findStudentForSubmission(submissionId?: string): ParentStudentSummary {
  if (!submissionId) {
    return parentStudents[1];
  }

  return parentStudents.find((student) => submissionId.includes(student.displayName.toLowerCase())) ?? parentStudents[1];
}

function buildReview(input: ParentAssignmentReviewInput, scenario: ParentScenario): ParentAssignmentReviewApiResponse {
  if (scenario === "empty" || !input.submissionId) {
    return parentAssignmentReviewApiResponseSchema.parse({
      connectionStatus: "online",
      generatedAt,
      review: null,
    });
  }

  const student = findStudentForSubmission(input.submissionId);

  return parentAssignmentReviewApiResponseSchema.parse({
    connectionStatus: getConnectionStatus(scenario),
    generatedAt,
    review: buildAssignmentReview(student, input.submissionId),
  });
}

export const parentApi = {
  async getAssignmentReview(input: ParentAssignmentReviewInput): Promise<ParentAssignmentReviewApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Parent assignment review mock error");
    }

    return buildReview(input, scenario);
  },

  async getDashboard(input: ParentDashboardInput): Promise<ParentDashboardApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Parent dashboard mock error");
    }

    return buildDashboard(input, scenario);
  },

  async getSettings(input: ParentRequestInput): Promise<ParentSettingsApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Parent settings mock error");
    }

    return parentSettingsApiResponseSchema.parse({
      connectionStatus: getConnectionStatus(scenario),
      generatedAt,
      linkedStudents: scenario === "empty" ? [] : parentStudents,
      parentId: input.parentId,
      settings: defaultSettings,
    });
  },

  async getStudentReport(input: ParentStudentInput): Promise<ParentStudentReportApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Parent student report mock error");
    }

    return buildReport(input, scenario);
  },

  async updateSettings(input: ParentSettingsInput): Promise<ParentSettingsApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Parent settings update mock error");
    }

    return parentSettingsApiResponseSchema.parse({
      connectionStatus: getConnectionStatus(scenario),
      generatedAt,
      linkedStudents: scenario === "empty" ? [] : parentStudents,
      parentId: input.parentId,
      settings: input.settings,
    });
  },
};
