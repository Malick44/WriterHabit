import type {
  CreateTeacherAssignmentInput,
  TeacherAssignmentSummary,
  TeacherClassProgressApiResponse,
  TeacherClassSummary,
  TeacherDashboardApiResponse,
  TeacherInstructionalGroup,
  TeacherScenario,
  TeacherSkillTrend,
  TeacherStudentProgress,
  TeacherSubmissionReview,
  TeacherSubmissionSummary,
} from "../types";
import {
  teacherAssignmentsApiResponseSchema,
  teacherClassProgressApiResponseSchema,
  teacherDashboardApiResponseSchema,
  teacherScenarioSchema,
  teacherSubmissionReviewApiResponseSchema,
  teacherSubmissionsApiResponseSchema,
} from "../types";

interface TeacherRequestInput {
  teacherId: string;
}

interface TeacherClassProgressInput extends TeacherRequestInput {
  classId?: string;
}

interface TeacherSubmissionReviewInput extends TeacherRequestInput {
  submissionId?: string;
}

interface TeacherCommentInput extends TeacherSubmissionReviewInput {
  comment: string;
}

const generatedAt = "2026-06-09T09:00:00.000Z";
const safetyNote =
  "Teacher feedback should identify a strength, one improvement, and one next student revision task. It should not rewrite the assignment for the student.";

const teacherClasses: TeacherClassSummary[] = [
  {
    activeAssignmentCount: 2,
    averageCompletionPercent: 78,
    averageSkillScore: 72,
    gradeLevel: 4,
    id: "class-pine-4",
    name: "Pine Room Writers",
    studentCount: 22,
    submissionsNeedingReview: 3,
    trendLabel: "Sentence detail is improving",
    weeklyWritingMinutes: 410,
  },
  {
    activeAssignmentCount: 3,
    averageCompletionPercent: 71,
    averageSkillScore: 69,
    gradeLevel: 7,
    id: "class-214-7",
    name: "Room 214 Paragraphs",
    studentCount: 28,
    submissionsNeedingReview: 6,
    trendLabel: "Organization is the next focus",
    weeklyWritingMinutes: 760,
  },
  {
    activeAssignmentCount: 2,
    averageCompletionPercent: 66,
    averageSkillScore: 74,
    gradeLevel: 10,
    id: "class-argument-10",
    name: "Argument Studio",
    studentCount: 24,
    submissionsNeedingReview: 4,
    trendLabel: "Evidence analysis needs practice",
    weeklyWritingMinutes: 940,
  },
];

const teacherAssignments: TeacherAssignmentSummary[] = [
  {
    allowCanvas: true,
    assignmentType: "sentence_practice",
    classId: "class-pine-4",
    className: "Pine Room Writers",
    completionPercent: 82,
    createdAt: "2026-06-06T15:20:00.000Z",
    dueDate: "2026-06-12",
    dueLabel: "Due Jun 12",
    gradeLevel: 4,
    id: "assignment-park-details",
    prompt: "Write five sentences about a park. Add one detail to each sentence so a reader can picture it.",
    rubric: [
      {
        description: "Each sentence has a clear idea.",
        id: "sentence-idea",
        label: "Clear sentence",
        maxScore: 4,
      },
      {
        description: "The writer adds describing words or specific details.",
        id: "details",
        label: "Details",
        maxScore: 4,
      },
    ],
    skillFocus: ["sentence_structure", "vocabulary"],
    status: "active",
    submissionsCount: 18,
    title: "Park detail sentences",
  },
  {
    allowCanvas: false,
    assignmentType: "paragraph_writing",
    classId: "class-214-7",
    className: "Room 214 Paragraphs",
    completionPercent: 68,
    createdAt: "2026-06-05T16:30:00.000Z",
    dueDate: "2026-06-13",
    dueLabel: "Due Jun 13",
    gradeLevel: 7,
    id: "assignment-ecosystem",
    prompt:
      "Write one paragraph explaining how one change in an ecosystem can affect another living thing.",
    rubric: [
      {
        description: "The first sentence states the main idea.",
        id: "topic",
        label: "Topic sentence",
        maxScore: 4,
      },
      {
        description: "The paragraph includes a specific example.",
        id: "example",
        label: "Example",
        maxScore: 4,
      },
      {
        description: "Details are ordered in a way that is easy to follow.",
        id: "organization",
        label: "Organization",
        maxScore: 4,
      },
    ],
    skillFocus: ["organization", "clarity", "reading_response"],
    status: "active",
    submissionsCount: 19,
    title: "Ecosystem cause and effect",
  },
  {
    allowCanvas: false,
    assignmentType: "essay_writing",
    classId: "class-argument-10",
    className: "Argument Studio",
    completionPercent: 58,
    createdAt: "2026-06-04T17:10:00.000Z",
    dueDate: "2026-06-14",
    dueLabel: "Due Jun 14",
    gradeLevel: 10,
    id: "assignment-tech-claim",
    prompt:
      "Draft an argument paragraph about whether technology improves learning. Include a claim, evidence, and analysis.",
    rubric: [
      {
        description: "The claim is arguable and focused.",
        id: "claim",
        label: "Claim",
        maxScore: 4,
      },
      {
        description: "Evidence is specific and relevant.",
        id: "evidence",
        label: "Evidence",
        maxScore: 4,
      },
      {
        description: "Analysis explains why the evidence supports the claim.",
        id: "analysis",
        label: "Analysis",
        maxScore: 4,
      },
      {
        description: "Sentences are clear and mature.",
        id: "style",
        label: "Clarity",
        maxScore: 4,
      },
    ],
    skillFocus: ["argument_strength", "evidence_usage", "clarity"],
    status: "active",
    submissionsCount: 14,
    title: "Technology claim paragraph",
  },
];

const teacherSubmissions: TeacherSubmissionSummary[] = [
  {
    assignmentId: "assignment-ecosystem",
    assignmentTitle: "Ecosystem cause and effect",
    classId: "class-214-7",
    className: "Room 214 Paragraphs",
    gradeLevel: 7,
    hasCanvas: false,
    id: "submission-maya-ecosystem",
    priority: "high",
    scorePercent: null,
    status: "awaiting_review",
    studentId: "student-maya",
    studentName: "Maya Chen",
    submittedLabel: "Today",
    wordCount: 168,
  },
  {
    assignmentId: "assignment-tech-claim",
    assignmentTitle: "Technology claim paragraph",
    classId: "class-argument-10",
    className: "Argument Studio",
    gradeLevel: 10,
    hasCanvas: false,
    id: "submission-ari-technology",
    priority: "high",
    scorePercent: null,
    status: "awaiting_review",
    studentId: "student-ari",
    studentName: "Ari Patel",
    submittedLabel: "Today",
    wordCount: 242,
  },
  {
    assignmentId: "assignment-park-details",
    assignmentTitle: "Park detail sentences",
    classId: "class-pine-4",
    className: "Pine Room Writers",
    gradeLevel: 4,
    hasCanvas: true,
    id: "submission-eli-park",
    priority: "normal",
    scorePercent: 78,
    status: "reviewed",
    studentId: "student-eli",
    studentName: "Eli Rivera",
    submittedLabel: "Yesterday",
    wordCount: 55,
  },
  {
    assignmentId: "assignment-ecosystem",
    assignmentTitle: "Ecosystem cause and effect",
    classId: "class-214-7",
    className: "Room 214 Paragraphs",
    gradeLevel: 7,
    hasCanvas: true,
    id: "submission-jonah-ecosystem",
    priority: "normal",
    scorePercent: 82,
    status: "revision_requested",
    studentId: "student-jonah",
    studentName: "Jonah Brooks",
    submittedLabel: "Mon",
    wordCount: 194,
  },
];

const classProgressByClassId: Record<
  string,
  {
    instructionalGroups: TeacherInstructionalGroup[];
    skillTrends: TeacherSkillTrend[];
    students: TeacherStudentProgress[];
  }
> = {
  "class-pine-4": {
    instructionalGroups: [
      {
        action: "Use one picture plan, then add one describing word before writing.",
        description: "These students are ready for guided sentence detail practice.",
        id: "pine-details",
        skill: "vocabulary",
        studentNames: ["Eli", "Noor", "Sam"],
        title: "Detail builders",
      },
      {
        action: "Read each sentence aloud and check the ending mark.",
        description: "A short punctuation check should help before submission.",
        id: "pine-punctuation",
        skill: "punctuation",
        studentNames: ["Lena", "Marco"],
        title: "Sentence closers",
      },
    ],
    skillTrends: [
      {
        averageScore: 74,
        changeLabel: "+6 this week",
        label: "Sentences",
        skill: "sentence_structure",
        studentCount: 22,
      },
      {
        averageScore: 68,
        changeLabel: "+4 this week",
        label: "Word choice",
        skill: "vocabulary",
        studentCount: 22,
      },
      {
        averageScore: 71,
        changeLabel: "steady",
        label: "Handwriting",
        skill: "handwriting",
        studentCount: 18,
      },
    ],
    students: [
      {
        assignmentCompletionPercent: 86,
        averageRubricScore: 78,
        displayName: "Eli Rivera",
        focusSkill: "vocabulary",
        gradeLevel: 4,
        id: "student-eli",
        lastSubmissionLabel: "Yesterday",
        needsSupport: false,
        revisionRatePercent: 52,
      },
      {
        assignmentCompletionPercent: 62,
        averageRubricScore: 60,
        displayName: "Noor Ali",
        focusSkill: "sentence_structure",
        gradeLevel: 4,
        id: "student-noor",
        lastSubmissionLabel: "Fri",
        needsSupport: true,
        revisionRatePercent: 34,
      },
      {
        assignmentCompletionPercent: 70,
        averageRubricScore: 64,
        displayName: "Sam Kim",
        focusSkill: "punctuation",
        gradeLevel: 4,
        id: "student-sam",
        lastSubmissionLabel: "Mon",
        needsSupport: true,
        revisionRatePercent: 40,
      },
    ],
  },
  "class-214-7": {
    instructionalGroups: [
      {
        action: "Have students underline the topic sentence, then add one matching example.",
        description: "This group needs topic sentence and supporting detail alignment.",
        id: "middle-organization",
        skill: "organization",
        studentNames: ["Maya", "Jonah", "Luis"],
        title: "Paragraph organizers",
      },
      {
        action: "Ask students to replace one vague phrase with a concrete example.",
        description: "These students are close; clarity practice should improve the next revision.",
        id: "middle-clarity",
        skill: "clarity",
        studentNames: ["Priya", "Devin"],
        title: "Clarity group",
      },
    ],
    skillTrends: [
      {
        averageScore: 70,
        changeLabel: "+5 this week",
        label: "Organization",
        skill: "organization",
        studentCount: 28,
      },
      {
        averageScore: 73,
        changeLabel: "+3 this week",
        label: "Clarity",
        skill: "clarity",
        studentCount: 28,
      },
      {
        averageScore: 65,
        changeLabel: "+7 this week",
        label: "Revision",
        skill: "revision_quality",
        studentCount: 24,
      },
      {
        averageScore: 69,
        changeLabel: "steady",
        label: "Reading response",
        skill: "reading_response",
        studentCount: 28,
      },
    ],
    students: [
      {
        assignmentCompletionPercent: 74,
        averageRubricScore: 70,
        displayName: "Maya Chen",
        focusSkill: "organization",
        gradeLevel: 7,
        id: "student-maya",
        lastSubmissionLabel: "Today",
        needsSupport: true,
        revisionRatePercent: 48,
      },
      {
        assignmentCompletionPercent: 82,
        averageRubricScore: 76,
        displayName: "Jonah Brooks",
        focusSkill: "clarity",
        gradeLevel: 7,
        id: "student-jonah",
        lastSubmissionLabel: "Mon",
        needsSupport: false,
        revisionRatePercent: 61,
      },
      {
        assignmentCompletionPercent: 56,
        averageRubricScore: 58,
        displayName: "Luis Romero",
        focusSkill: "organization",
        gradeLevel: 7,
        id: "student-luis",
        lastSubmissionLabel: "Thu",
        needsSupport: true,
        revisionRatePercent: 29,
      },
      {
        assignmentCompletionPercent: 88,
        averageRubricScore: 80,
        displayName: "Priya Shah",
        focusSkill: "reading_response",
        gradeLevel: 7,
        id: "student-priya",
        lastSubmissionLabel: "Today",
        needsSupport: false,
        revisionRatePercent: 67,
      },
    ],
  },
  "class-argument-10": {
    instructionalGroups: [
      {
        action: "Ask students to add one analysis sentence after each evidence sentence.",
        description: "These students have claims and evidence but need reasoning practice.",
        id: "high-analysis",
        skill: "evidence_usage",
        studentNames: ["Ari", "Nora", "Theo"],
        title: "Evidence analysis",
      },
      {
        action: "Have students test whether the claim can be argued from another side.",
        description: "This group should sharpen thesis specificity before drafting more.",
        id: "high-claim",
        skill: "argument_strength",
        studentNames: ["Iris", "Cam"],
        title: "Claim check",
      },
    ],
    skillTrends: [
      {
        averageScore: 76,
        changeLabel: "+4 this week",
        label: "Argument",
        skill: "argument_strength",
        studentCount: 24,
      },
      {
        averageScore: 68,
        changeLabel: "+6 this week",
        label: "Evidence",
        skill: "evidence_usage",
        studentCount: 24,
      },
      {
        averageScore: 74,
        changeLabel: "+2 this week",
        label: "Clarity",
        skill: "clarity",
        studentCount: 24,
      },
      {
        averageScore: 71,
        changeLabel: "steady",
        label: "Organization",
        skill: "organization",
        studentCount: 24,
      },
    ],
    students: [
      {
        assignmentCompletionPercent: 79,
        averageRubricScore: 74,
        displayName: "Ari Patel",
        focusSkill: "evidence_usage",
        gradeLevel: 10,
        id: "student-ari",
        lastSubmissionLabel: "Today",
        needsSupport: true,
        revisionRatePercent: 55,
      },
      {
        assignmentCompletionPercent: 69,
        averageRubricScore: 66,
        displayName: "Nora Kim",
        focusSkill: "argument_strength",
        gradeLevel: 10,
        id: "student-nora",
        lastSubmissionLabel: "Yesterday",
        needsSupport: true,
        revisionRatePercent: 43,
      },
      {
        assignmentCompletionPercent: 91,
        averageRubricScore: 86,
        displayName: "Theo Johnson",
        focusSkill: "clarity",
        gradeLevel: 10,
        id: "student-theo",
        lastSubmissionLabel: "Mon",
        needsSupport: false,
        revisionRatePercent: 72,
      },
    ],
  },
};

const teacherSubmissionReviews: Record<string, TeacherSubmissionReview> = {
  "submission-maya-ecosystem": {
    assignmentPrompt:
      "Write one paragraph explaining how one change in an ecosystem can affect another living thing.",
    assignmentTitle: "Ecosystem cause and effect",
    canvasPreview: null,
    className: "Room 214 Paragraphs",
    gradeLevel: 7,
    id: "submission-maya-ecosystem",
    revisionTask: "Add one sentence that explains why the example proves the main idea.",
    rubric: [
      {
        coachingNote: "The paragraph starts with a clear main idea.",
        criterionId: "topic",
        label: "Topic sentence",
        maxScore: 4,
        score: 3,
      },
      {
        coachingNote: "The example is relevant but needs one more concrete detail.",
        criterionId: "example",
        label: "Example",
        maxScore: 4,
        score: 3,
      },
      {
        coachingNote: "The order is easy to follow.",
        criterionId: "organization",
        label: "Organization",
        maxScore: 4,
        score: 4,
      },
    ],
    safetyNote,
    studentName: "Maya Chen",
    submittedLabel: "Today",
    teacherComment:
      "Your main idea is clear. Add one more cause-and-effect sentence so the reader sees the connection.",
    writingPreview:
      "If there are less insects in an ecosystem, birds that eat insects may not have enough food. Then the birds might move to another area or have trouble feeding their babies.",
    wordCount: 168,
  },
  "submission-ari-technology": {
    assignmentPrompt:
      "Draft an argument paragraph about whether technology improves learning. Include a claim, evidence, and analysis.",
    assignmentTitle: "Technology claim paragraph",
    canvasPreview: null,
    className: "Argument Studio",
    gradeLevel: 10,
    id: "submission-ari-technology",
    revisionTask: "Add one analysis sentence after the evidence to connect it back to the claim.",
    rubric: [
      {
        coachingNote: "The claim is arguable and focused.",
        criterionId: "claim",
        label: "Claim",
        maxScore: 4,
        score: 4,
      },
      {
        coachingNote: "The evidence is specific but could be introduced with more context.",
        criterionId: "evidence",
        label: "Evidence",
        maxScore: 4,
        score: 3,
      },
      {
        coachingNote: "Analysis needs to explain why the evidence matters.",
        criterionId: "analysis",
        label: "Analysis",
        maxScore: 4,
        score: 2,
      },
      {
        coachingNote: "Sentences are mostly clear and mature.",
        criterionId: "style",
        label: "Clarity",
        maxScore: 4,
        score: 3,
      },
    ],
    safetyNote,
    studentName: "Ari Patel",
    submittedLabel: "Today",
    teacherComment:
      "Strong claim. In revision, explain how the evidence changes the learning experience instead of adding more evidence.",
    writingPreview:
      "Technology can improve learning when it gives students faster feedback. For example, a writing program can show where a sentence is confusing, so students know what to revise.",
    wordCount: 242,
  },
  "submission-eli-park": {
    assignmentPrompt: "Write five sentences about a park. Add one detail to each sentence so a reader can picture it.",
    assignmentTitle: "Park detail sentences",
    canvasPreview: {
      pageCount: 1,
      title: "Park picture plan",
    },
    className: "Pine Room Writers",
    gradeLevel: 4,
    id: "submission-eli-park",
    revisionTask: "Choose one sentence and add one more describing word.",
    rubric: [
      {
        coachingNote: "Each sentence shares a clear park idea.",
        criterionId: "sentence-idea",
        label: "Clear sentence",
        maxScore: 4,
        score: 4,
      },
      {
        coachingNote: "The draft uses some strong details.",
        criterionId: "details",
        label: "Details",
        maxScore: 4,
        score: 3,
      },
    ],
    safetyNote,
    studentName: "Eli Rivera",
    submittedLabel: "Yesterday",
    teacherComment: "Good clear sentences. Add one describing word to show what the slide or trees look like.",
    writingPreview: "The park has a slide. I see tall trees. The dog runs fast. My sister likes the swings.",
    wordCount: 55,
  },
};

function readScenario(): TeacherScenario {
  const parsed = teacherScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WriterHabit_TEACHER_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

function getConnectionStatus(scenario: TeacherScenario): "online" | "offline_cached" {
  return scenario === "offline" ? "offline_cached" : "online";
}

function assertNotErrorScenario(scenario: TeacherScenario): void {
  if (scenario === "error") {
    throw new Error("Teacher mock API scenario forced an error.");
  }
}

function getClass(classId?: string): TeacherClassSummary | null {
  return teacherClasses.find((classSummary) => classSummary.id === classId) ?? null;
}

function getEmptyDashboard(input: TeacherRequestInput): TeacherDashboardApiResponse {
  return {
    assignments: [],
    classes: [],
    connectionStatus: "online",
    generatedAt,
    safetyNote,
    submissions: [],
    teacherId: input.teacherId,
  };
}

function buildAssignmentFromInput(
  input: CreateTeacherAssignmentInput,
  teacherId: string,
): TeacherAssignmentSummary {
  const classSummary = getClass(input.classId);
  const createdAt = new Date().toISOString();

  return {
    allowCanvas: input.allowCanvas,
    assignmentType: input.assignmentType,
    classId: input.classId,
    className: classSummary?.name ?? "Selected class",
    completionPercent: 0,
    createdAt,
    dueDate: input.dueDate,
    dueLabel: `Due ${input.dueDate}`,
    gradeLevel: input.gradeLevel,
    id: `assignment-${teacherId}-${createdAt}`,
    prompt: input.prompt,
    rubric: input.rubric.map((criterion, index) => ({
      description: criterion,
      id: `criterion-${index + 1}`,
      label: criterion,
      maxScore: 4,
    })),
    skillFocus: input.skillFocus,
    status: "active",
    submissionsCount: 0,
    title: input.title,
  };
}

export const teacherApi = {
  async createAssignment(input: CreateTeacherAssignmentInput & TeacherRequestInput) {
    const scenario = readScenario();

    assertNotErrorScenario(scenario);

    const response = buildAssignmentFromInput(input, input.teacherId);

    return teacherAssignmentsApiResponseSchema.shape.assignments.element.parse(response);
  },

  async getAssignments(input: TeacherRequestInput) {
    const scenario = readScenario();

    assertNotErrorScenario(scenario);

    const response = {
      assignments: scenario === "empty" ? [] : teacherAssignments,
      classes: scenario === "empty" ? [] : teacherClasses,
      connectionStatus: getConnectionStatus(scenario),
      generatedAt,
      teacherId: input.teacherId,
    };

    return teacherAssignmentsApiResponseSchema.parse(response);
  },

  async getClassProgress(input: TeacherClassProgressInput) {
    const scenario = readScenario();

    assertNotErrorScenario(scenario);

    const classSummary = scenario === "empty" ? null : getClass(input.classId);
    const progress = input.classId ? classProgressByClassId[input.classId] : null;
    const response: TeacherClassProgressApiResponse = {
      classSummary,
      connectionStatus: getConnectionStatus(scenario),
      generatedAt,
      instructionalGroups: progress?.instructionalGroups ?? [],
      skillTrends: progress?.skillTrends ?? [],
      students: progress?.students ?? [],
    };

    return teacherClassProgressApiResponseSchema.parse(response);
  },

  async getDashboard(input: TeacherRequestInput) {
    const scenario = readScenario();

    assertNotErrorScenario(scenario);

    if (scenario === "empty") {
      return teacherDashboardApiResponseSchema.parse(getEmptyDashboard(input));
    }

    const response: TeacherDashboardApiResponse = {
      assignments: teacherAssignments,
      classes: teacherClasses,
      connectionStatus: getConnectionStatus(scenario),
      generatedAt,
      safetyNote,
      submissions: teacherSubmissions,
      teacherId: input.teacherId,
    };

    return teacherDashboardApiResponseSchema.parse(response);
  },

  async getSubmissionReview(input: TeacherSubmissionReviewInput) {
    const scenario = readScenario();

    assertNotErrorScenario(scenario);

    const response = {
      connectionStatus: getConnectionStatus(scenario),
      generatedAt,
      review:
        scenario === "empty" || !input.submissionId
          ? null
          : teacherSubmissionReviews[input.submissionId] ?? null,
    };

    return teacherSubmissionReviewApiResponseSchema.parse(response);
  },

  async getSubmissions(input: TeacherRequestInput) {
    const scenario = readScenario();

    assertNotErrorScenario(scenario);

    const response = {
      connectionStatus: getConnectionStatus(scenario),
      generatedAt,
      submissions: scenario === "empty" ? [] : teacherSubmissions,
      teacherId: input.teacherId,
    };

    return teacherSubmissionsApiResponseSchema.parse(response);
  },

  async updateSubmissionComment(input: TeacherCommentInput) {
    const scenario = readScenario();

    assertNotErrorScenario(scenario);

    if (!input.submissionId) {
      throw new Error("Submission id is required.");
    }

    return teacherSubmissionReviewApiResponseSchema.parse({
      connectionStatus: getConnectionStatus(scenario),
      generatedAt,
      review: teacherSubmissionReviews[input.submissionId]
        ? {
          ...teacherSubmissionReviews[input.submissionId],
          teacherComment: input.comment.trim(),
        }
        : null,
    });
  },
};
