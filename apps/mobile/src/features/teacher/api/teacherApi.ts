import type { AssignmentType, GradeLevel, WritingSkill } from "@WriterHabit/shared";

import { supabase } from "@/core/supabase/supabaseClient";
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
  TeacherSubmissionReviewApiResponse,
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

type TeacherAssignmentJoinRow = {
  allow_canvas: boolean | null;
  assignment_type: AssignmentType;
  created_at: string;
  due_at: string | null;
  grade_level_max: number;
  grade_level_min: number;
  id: string;
  prompt_fallback: string;
  skill_focus: WritingSkill[] | null;
  status: string;
  title_fallback: string;
};

type TeacherStudentAssignmentRow = {
  assignments: TeacherAssignmentJoinRow | TeacherAssignmentJoinRow[] | null;
  completed_at: string | null;
  current_submission_id: string | null;
  id: string;
  status: string;
  submitted_at: string | null;
};

type TeacherSubmissionRow = {
  id: string;
  status: string;
  student_assignment_id: string;
  submitted_at: string;
  typed_text_excerpt: string;
  word_count: number | null;
};

type TeacherFeedbackRow = {
  id: string;
  improvement_fallback: string;
  next_revision_task_fallback: string;
  strength_fallback: string;
  submission_id: string;
};

type TeacherRubricCriterionJoinRow = {
  description_fallback: string;
  id: string;
  label_fallback: string;
  max_score: number;
};

type TeacherRubricScoreRow = {
  coaching_note_fallback: string;
  feedback_id: string;
  id: string;
  max_score: number;
  rubric_criteria: TeacherRubricCriterionJoinRow | TeacherRubricCriterionJoinRow[] | null;
  score: number;
};

type TeacherSkillProgressRow = {
  current_score: number | string | null;
  previous_score: number | string | null;
  skill: WritingSkill;
};

type TeacherProgressTotalRow = {
  assignments_completed: number | null;
  minutes_this_week: number | null;
  revisions_completed: number | null;
};

type TeacherCanvasRow = {
  id: string;
  student_assignment_id: string | null;
  title: string;
};

type TeacherCommentRow = {
  comment_text: string;
  submission_id: string;
};

type TeacherSupabaseData = {
  assignmentRows: TeacherStudentAssignmentRow[];
  canvasRows: TeacherCanvasRow[];
  classId: string;
  className: string;
  commentRows: TeacherCommentRow[];
  feedbackRows: TeacherFeedbackRow[];
  gradeLevel: GradeLevel;
  progressTotal: TeacherProgressTotalRow | null;
  rubricRows: TeacherRubricScoreRow[];
  skillRows: TeacherSkillProgressRow[];
  studentDisplayName: string;
  studentId: string;
  submissionRows: TeacherSubmissionRow[];
  teacherProfileId: string;
  teacherId: string;
};

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

function toGradeLevel(value: number): GradeLevel {
  return value >= 1 && value <= 12 ? (value as GradeLevel) : 7;
}

function toInteger(value: unknown, fallback = 0): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function getDisplayNameFromEmail(email?: string): string {
  return email?.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Dev Student";
}

function getSubmittedLabel(value?: string | null): string {
  if (!value) return "Saved";

  const submitted = new Date(value);
  const diffDays = Math.max(0, Math.floor((Date.now() - submitted.getTime()) / 86_400_000));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return submitted.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getSkillLabel(skill: WritingSkill): string {
  const labels: Record<WritingSkill, string> = {
    argument_strength: "Argument",
    clarity: "Clarity",
    creativity: "Creativity",
    evidence_usage: "Evidence",
    grammar: "Grammar",
    handwriting: "Handwriting",
    organization: "Organization",
    punctuation: "Punctuation",
    reading_response: "Reading response",
    revision_quality: "Revision",
    sentence_structure: "Sentences",
    spelling: "Spelling",
    vocabulary: "Vocabulary",
  };

  return labels[skill];
}

function getSkillAction(skill: WritingSkill): string {
  const actions: Record<WritingSkill, string> = {
    argument_strength: "Ask the student to test whether the claim can be argued from another side.",
    clarity: "Ask the student to add one concrete example after the topic sentence.",
    creativity: "Ask the student to add one surprising but relevant detail.",
    evidence_usage: "Ask the student to explain why the evidence proves the claim.",
    grammar: "Have the student review one sentence for the target grammar pattern.",
    handwriting: "Use the lined canvas for one short response before submitting.",
    organization: "Have the student underline the topic sentence and match each detail to it.",
    punctuation: "Ask the student to read one sentence aloud and check the ending mark.",
    reading_response: "Ask the student to keep text evidence in passage order.",
    revision_quality: "Ask the student to revise one sentence for a clearer reason.",
    sentence_structure: "Have the student combine two short ideas into one clearer sentence.",
    spelling: "Ask the student to circle one word to check before submitting.",
    vocabulary: "Ask the student to replace one vague word with a stronger word.",
  };

  return actions[skill];
}

function getAssignmentFromRow(row: TeacherStudentAssignmentRow): TeacherAssignmentJoinRow | null {
  if (Array.isArray(row.assignments)) {
    return row.assignments[0] ?? null;
  }

  return row.assignments;
}

function getRubricCriterion(row: TeacherRubricScoreRow): TeacherRubricCriterionJoinRow | null {
  if (Array.isArray(row.rubric_criteria)) {
    return row.rubric_criteria[0] ?? null;
  }

  return row.rubric_criteria;
}

function buildDevClassSummary(data: TeacherSupabaseData): TeacherClassSummary {
  const completionCount = data.assignmentRows.filter((row) => row.status === "completed").length;
  const assignmentCount = data.assignmentRows.length;
  const averageScore =
    data.skillRows.length > 0
      ? Math.round(data.skillRows.reduce((total, row) => total + toInteger(row.current_score), 0) / data.skillRows.length)
      : 0;

  return {
    activeAssignmentCount: assignmentCount,
    averageCompletionPercent: assignmentCount > 0 ? Math.round((completionCount / assignmentCount) * 100) : 0,
    averageSkillScore: averageScore,
    gradeLevel: data.gradeLevel,
    id: data.classId,
    name: data.className,
    studentCount: 1,
    submissionsNeedingReview: data.submissionRows.filter((row) => row.status === "submitted" || row.status === "reviewing").length,
    trendLabel: data.skillRows[0] ? `${getSkillLabel(data.skillRows[0].skill)} is the current focus` : "Writing practice is active",
    weeklyWritingMinutes: toInteger(data.progressTotal?.minutes_this_week),
  };
}

function getAssignmentScorePercent(feedback: TeacherFeedbackRow | undefined, rubricRows: TeacherRubricScoreRow[]): number {
  const rows = rubricRows.filter((row) => row.feedback_id === feedback?.id);
  const earned = rows.reduce((total, row) => total + row.score, 0);
  const possible = rows.reduce((total, row) => total + row.max_score, 0);

  return possible > 0 ? Math.round((earned / possible) * 100) : 0;
}

async function getSignedInTeacherSupabaseData(teacherId: string): Promise<TeacherSupabaseData | null> {
  const { data: authData } = await supabase.auth.getSession();
  const user = authData.session?.user;

  if (!user || user.id !== teacherId) {
    return null;
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("student_profiles")
    .select("id,grade_level")
    .eq("user_id", user.id)
    .limit(1);

  if (profileError) throw profileError;

  const profile = ((profileRows ?? []) as { grade_level: number; id: string }[])[0];

  if (!profile) {
    return null;
  }

  const { data: teacherProfileRows, error: teacherProfileError } = await supabase
    .from("teacher_profiles")
    .select("id,display_name")
    .eq("user_id", user.id)
    .limit(1);

  if (teacherProfileError) throw teacherProfileError;

  const teacherProfile = ((teacherProfileRows ?? []) as { display_name: string; id: string }[])[0];

  if (!teacherProfile) {
    return null;
  }

  const { data: classRows, error: classError } = await supabase
    .from("classes")
    .select("id,name")
    .eq("teacher_profile_id", teacherProfile.id)
    .eq("status", "active")
    .limit(1);

  if (classError) throw classError;

  const classRow = ((classRows ?? []) as { id: string; name: string }[])[0];

  if (!classRow) {
    return null;
  }

  const [
    progressResult,
    skillsResult,
    assignmentsResult,
    submissionsResult,
    feedbackResult,
    canvasResult,
    commentsResult,
  ] = await Promise.all([
    supabase
      .from("student_progress_totals")
      .select("assignments_completed,minutes_this_week,revisions_completed")
      .eq("student_profile_id", profile.id)
      .maybeSingle(),
    supabase
      .from("student_skill_progress")
      .select("skill,current_score,previous_score")
      .eq("student_profile_id", profile.id),
    supabase
      .from("student_assignments")
      .select("id,status,submitted_at,completed_at,current_submission_id,assignments(id,title_fallback,prompt_fallback,assignment_type,skill_focus,grade_level_min,grade_level_max,status,allow_canvas,due_at,created_at)")
      .eq("student_profile_id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("submissions")
      .select("id,student_assignment_id,status,typed_text_excerpt,word_count,submitted_at")
      .eq("student_profile_id", profile.id)
      .order("submitted_at", { ascending: false })
      .limit(12),
    supabase
      .from("feedback")
      .select("id,submission_id,strength_fallback,improvement_fallback,next_revision_task_fallback")
      .eq("student_profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("canvas_documents")
      .select("id,student_assignment_id,title")
      .eq("student_profile_id", profile.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("teacher_submission_comments")
      .select("submission_id,comment_text,created_at")
      .eq("teacher_profile_id", teacherProfile.id)
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  if (progressResult.error) throw progressResult.error;
  if (skillsResult.error) throw skillsResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;
  if (submissionsResult.error) throw submissionsResult.error;
  if (feedbackResult.error) throw feedbackResult.error;
  if (canvasResult.error) throw canvasResult.error;
  if (commentsResult.error) throw commentsResult.error;

  const feedbackRows = (feedbackResult.data ?? []) as TeacherFeedbackRow[];
  const feedbackIds = feedbackRows.map((row) => row.id);
  let rubricRows: TeacherRubricScoreRow[] = [];

  if (feedbackIds.length > 0) {
    const { data: rubricData, error: rubricError } = await supabase
      .from("feedback_rubric_scores")
      .select("id,feedback_id,score,max_score,coaching_note_fallback,rubric_criteria(id,label_fallback,description_fallback,max_score)")
      .in("feedback_id", feedbackIds);

    if (rubricError) throw rubricError;

    rubricRows = (rubricData ?? []) as TeacherRubricScoreRow[];
  }

  return {
    assignmentRows: (assignmentsResult.data ?? []) as TeacherStudentAssignmentRow[],
    canvasRows: (canvasResult.data ?? []) as TeacherCanvasRow[],
    classId: classRow.id,
    className: classRow.name,
    commentRows: (commentsResult.data ?? []) as TeacherCommentRow[],
    feedbackRows,
    gradeLevel: toGradeLevel(profile.grade_level),
    progressTotal: (progressResult.data as TeacherProgressTotalRow | null) ?? null,
    rubricRows,
    skillRows: (skillsResult.data ?? []) as TeacherSkillProgressRow[],
    studentDisplayName:
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : getDisplayNameFromEmail(user.email),
    studentId: profile.id,
    submissionRows: (submissionsResult.data ?? []) as TeacherSubmissionRow[],
    teacherProfileId: teacherProfile.id,
    teacherId,
  };
}

function buildSupabaseTeacherAssignments(data: TeacherSupabaseData): TeacherAssignmentSummary[] {
  const classSummary = buildDevClassSummary(data);

  return data.assignmentRows.flatMap((studentAssignment) => {
    const assignment = getAssignmentFromRow(studentAssignment);

    if (!assignment) {
      return [];
    }

    const submissionsCount = data.submissionRows.filter((row) => row.student_assignment_id === studentAssignment.id).length;
    const rubricRows = data.rubricRows.slice(0, 4);

    return [
      {
        allowCanvas: Boolean(assignment.allow_canvas),
        assignmentType: assignment.assignment_type,
        classId: classSummary.id,
        className: classSummary.name,
        completionPercent: studentAssignment.status === "completed" ? 100 : submissionsCount > 0 ? 75 : 0,
        createdAt: assignment.created_at,
        dueDate: assignment.due_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        dueLabel: assignment.due_at ? `Due ${assignment.due_at.slice(0, 10)}` : "No due date",
        gradeLevel: data.gradeLevel,
        id: assignment.id,
        prompt: assignment.prompt_fallback,
        rubric:
          rubricRows.length > 0
            ? rubricRows.map((row) => {
                const criterion = getRubricCriterion(row);

                return {
                  description: criterion?.description_fallback ?? "Writing skill",
                  id: criterion?.id ?? row.id,
                  label: criterion?.label_fallback ?? "Writing",
                  maxScore: criterion?.max_score ?? row.max_score,
                };
              })
            : [
                {
                  description: "Student writing has one clear next revision focus.",
                  id: "revision-focus",
                  label: "Revision focus",
                  maxScore: 4,
                },
              ],
        skillFocus: assignment.skill_focus && assignment.skill_focus.length > 0 ? assignment.skill_focus : ["clarity"],
        status: assignment.status === "archived" ? "closed" : assignment.status === "draft" ? "draft" : "active",
        submissionsCount,
        title: assignment.title_fallback,
      },
    ];
  });
}

function buildSupabaseTeacherSubmissions(data: TeacherSupabaseData): TeacherSubmissionSummary[] {
  const classSummary = buildDevClassSummary(data);

  return data.submissionRows.flatMap((submission) => {
    const studentAssignment = data.assignmentRows.find((row) => row.id === submission.student_assignment_id);
    const assignment = studentAssignment ? getAssignmentFromRow(studentAssignment) : null;

    if (!studentAssignment || !assignment) {
      return [];
    }

    const feedback = data.feedbackRows.find((row) => row.submission_id === submission.id);
    const scorePercent = feedback ? getAssignmentScorePercent(feedback, data.rubricRows) : null;

    return [
      {
        assignmentId: assignment.id,
        assignmentTitle: assignment.title_fallback,
        classId: classSummary.id,
        className: classSummary.name,
        gradeLevel: data.gradeLevel,
        hasCanvas: data.canvasRows.some((row) => row.student_assignment_id === studentAssignment.id),
        id: submission.id,
        priority: feedback ? "normal" : "high",
        scorePercent,
        status:
          submission.status === "completed"
            ? "completed"
            : submission.status === "revision_in_progress"
              ? "revision_requested"
              : feedback
                ? "reviewed"
                : "awaiting_review",
        studentId: data.studentId,
        studentName: data.studentDisplayName,
        submittedLabel: getSubmittedLabel(submission.submitted_at),
        wordCount: toInteger(submission.word_count),
      },
    ];
  });
}

function buildSupabaseTeacherClassProgress(data: TeacherSupabaseData): TeacherClassProgressApiResponse {
  const classSummary = buildDevClassSummary(data);
  const assignmentCompletionPercent = classSummary.averageCompletionPercent;
  const averageRubricScore =
    data.rubricRows.length > 0
      ? Math.round(
          (data.rubricRows.reduce((total, row) => total + row.score, 0) /
            data.rubricRows.reduce((total, row) => total + row.max_score, 0)) *
            100,
        )
      : classSummary.averageSkillScore;
  const focusSkill =
    data.skillRows.slice().sort((a, b) => toInteger(a.current_score) - toInteger(b.current_score))[0]?.skill ?? "clarity";
  const skillTrends = data.skillRows.map((row) => {
    const current = toInteger(row.current_score);
    const previous = toInteger(row.previous_score);
    const delta = current - previous;

    return {
      averageScore: current,
      changeLabel: delta > 0 ? `+${delta} this week` : delta < 0 ? `${delta} this week` : "steady",
      label: getSkillLabel(row.skill),
      skill: row.skill,
      studentCount: 1,
    };
  });

  return teacherClassProgressApiResponseSchema.parse({
    classSummary,
    connectionStatus: "online",
    generatedAt: new Date().toISOString(),
    instructionalGroups: [
      {
        action: getSkillAction(focusSkill),
        description: "This logged dev student has a current Supabase focus skill from progress data.",
        id: `dev-${focusSkill}`,
        skill: focusSkill,
        studentNames: [data.studentDisplayName],
        title: `${getSkillLabel(focusSkill)} focus`,
      },
    ],
    skillTrends,
    students: [
      {
        assignmentCompletionPercent,
        averageRubricScore,
        displayName: data.studentDisplayName,
        focusSkill,
        gradeLevel: data.gradeLevel,
        id: data.studentId,
        lastSubmissionLabel: getSubmittedLabel(data.submissionRows[0]?.submitted_at),
        needsSupport: averageRubricScore < 70,
        revisionRatePercent: Math.min(100, toInteger(data.progressTotal?.revisions_completed) * 25),
      },
    ],
  });
}

function buildSupabaseTeacherReview(data: TeacherSupabaseData, submissionId?: string): TeacherSubmissionReviewApiResponse {
  const submission =
    data.submissionRows.find((row) => row.id === submissionId) ??
    data.submissionRows.find((row) => data.feedbackRows.some((feedback) => feedback.submission_id === row.id));

  if (!submission) {
    return teacherSubmissionReviewApiResponseSchema.parse({
      connectionStatus: "online",
      generatedAt: new Date().toISOString(),
      review: null,
    });
  }

  const classSummary = buildDevClassSummary(data);
  const studentAssignment = data.assignmentRows.find((row) => row.id === submission.student_assignment_id);
  const assignment = studentAssignment ? getAssignmentFromRow(studentAssignment) : null;
  const feedback = data.feedbackRows.find((row) => row.submission_id === submission.id);
  const canvas = data.canvasRows.find((row) => row.student_assignment_id === studentAssignment?.id);
  const rubricRows = data.rubricRows.filter((row) => row.feedback_id === feedback?.id);
  const teacherComment = data.commentRows.find((row) => row.submission_id === submission.id)?.comment_text;

  return teacherSubmissionReviewApiResponseSchema.parse({
    connectionStatus: "online",
    generatedAt: new Date().toISOString(),
    review: {
      assignmentPrompt: assignment?.prompt_fallback ?? "Review the saved student response.",
      assignmentTitle: assignment?.title_fallback ?? "WriterHabit assignment",
      canvasPreview: canvas ? { pageCount: 1, title: canvas.title } : null,
      className: classSummary.name,
      gradeLevel: data.gradeLevel,
      id: submission.id,
      revisionTask: feedback?.next_revision_task_fallback ?? "Ask the student to revise one sentence for clarity.",
      rubric:
        rubricRows.length > 0
          ? rubricRows.map((row) => {
              const criterion = getRubricCriterion(row);

              return {
                coachingNote: row.coaching_note_fallback,
                criterionId: criterion?.id ?? row.id,
                label: criterion?.label_fallback ?? "Writing",
                maxScore: row.max_score,
                score: row.score,
              };
            })
          : [
              {
                coachingNote: "Use one strength and one next revision task.",
                criterionId: "revision-focus",
                label: "Revision focus",
                maxScore: 4,
                score: 3,
              },
            ],
      safetyNote,
      studentName: data.studentDisplayName,
      submittedLabel: getSubmittedLabel(submission.submitted_at),
      teacherComment: teacherComment ?? feedback?.improvement_fallback ?? "",
      writingPreview: submission.typed_text_excerpt || feedback?.strength_fallback || "Student writing preview unavailable.",
      wordCount: toInteger(submission.word_count),
    },
  });
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

async function createSignedInTeacherAssignment(
  input: CreateTeacherAssignmentInput & TeacherRequestInput,
): Promise<TeacherAssignmentSummary | null> {
  const data = await getSignedInTeacherSupabaseData(input.teacherId);

  if (!data || input.classId !== data.classId) {
    return null;
  }

  const now = new Date().toISOString();
  const { data: rubric, error: rubricError } = await supabase
    .from("rubrics")
    .insert({
      assignment_type: input.assignmentType,
      created_by_user_id: input.teacherId,
      grade_level_max: input.gradeLevel,
      grade_level_min: input.gradeLevel,
      name_fallback: `${input.title} rubric`,
      name_key: "teacher.created.rubric.name",
      status: "active",
    })
    .select("id")
    .single();

  if (rubricError) throw rubricError;

  const rubricId = (rubric as { id: string }).id;
  const criteriaRows = input.rubric.map((criterion, index) => ({
    description_fallback: criterion,
    description_key: "teacher.created.rubric.criterion.description",
    label_fallback: criterion,
    label_key: "teacher.created.rubric.criterion.label",
    max_score: 4,
    rubric_id: rubricId,
    skill: input.skillFocus[index] ?? input.skillFocus[0] ?? "clarity",
    sort_order: index + 1,
  }));

  const { error: criteriaError } = await supabase.from("rubric_criteria").insert(criteriaRows);

  if (criteriaError) throw criteriaError;

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .insert({
      allow_canvas: input.allowCanvas,
      assignment_type: input.assignmentType,
      class_id: data.classId,
      created_by_user_id: input.teacherId,
      difficulty: "moderate",
      due_at: `${input.dueDate}T23:59:00.000Z`,
      estimated_minutes: input.gradeLevel <= 5 ? 10 : input.gradeLevel <= 8 ? 15 : 25,
      grade_level_max: input.gradeLevel,
      grade_level_min: input.gradeLevel,
      instructions: [],
      prompt_fallback: input.prompt,
      prompt_key: "teacher.created.assignment.prompt",
      prompt_safety_status: "approved",
      published_at: now,
      rubric_id: rubricId,
      skill_focus: input.skillFocus,
      status: "published",
      title_fallback: input.title,
      title_key: "teacher.created.assignment.title",
    })
    .select("id,created_at")
    .single();

  if (assignmentError) throw assignmentError;

  const assignmentId = (assignment as { created_at: string; id: string }).id;
  const createdAt = (assignment as { created_at: string; id: string }).created_at;

  await supabase.from("student_assignments").upsert(
    {
      assignment_id: assignmentId,
      class_id: data.classId,
      daily_selection_metadata: {},
      due_at: `${input.dueDate}T23:59:00.000Z`,
      status: "not_started",
      student_profile_id: data.studentId,
    },
    { onConflict: "student_profile_id,assignment_id,class_id" },
  );

  return teacherAssignmentsApiResponseSchema.shape.assignments.element.parse({
    allowCanvas: input.allowCanvas,
    assignmentType: input.assignmentType,
    classId: data.classId,
    className: data.className,
    completionPercent: 0,
    createdAt,
    dueDate: input.dueDate,
    dueLabel: `Due ${input.dueDate}`,
    gradeLevel: input.gradeLevel,
    id: assignmentId,
    prompt: input.prompt,
    rubric: input.rubric.map((criterion, index) => ({
      description: criterion,
      id: `${rubricId}-${index + 1}`,
      label: criterion,
      maxScore: 4,
    })),
    skillFocus: input.skillFocus,
    status: "active",
    submissionsCount: 0,
    title: input.title,
  });
}

async function updateSignedInTeacherSubmissionComment(
  input: TeacherCommentInput,
): Promise<TeacherSubmissionReviewApiResponse | null> {
  const data = await getSignedInTeacherSupabaseData(input.teacherId);
  const comment = input.comment.trim();

  if (!data || !input.submissionId || !comment) {
    return null;
  }

  const { error } = await supabase.from("teacher_submission_comments").insert({
    comment_text: comment.slice(0, 2000),
    submission_id: input.submissionId,
    teacher_profile_id: data.teacherProfileId,
  });

  if (error) throw error;

  const refreshed = await getSignedInTeacherSupabaseData(input.teacherId);

  return refreshed ? buildSupabaseTeacherReview(refreshed, input.submissionId) : null;
}

export const teacherApi = {
  async createAssignment(input: CreateTeacherAssignmentInput & TeacherRequestInput) {
    const scenario = readScenario();

    assertNotErrorScenario(scenario);

    if (scenario !== "empty") {
      const signedInResponse = await createSignedInTeacherAssignment(input);

      if (signedInResponse) {
        return signedInResponse;
      }
    }

    const response = buildAssignmentFromInput(input, input.teacherId);

    return teacherAssignmentsApiResponseSchema.shape.assignments.element.parse(response);
  },

  async getAssignments(input: TeacherRequestInput) {
    const scenario = readScenario();

    assertNotErrorScenario(scenario);

    const supabaseData = scenario === "empty" ? null : await getSignedInTeacherSupabaseData(input.teacherId);

    if (supabaseData) {
      const classSummary = buildDevClassSummary(supabaseData);

      return teacherAssignmentsApiResponseSchema.parse({
        assignments: buildSupabaseTeacherAssignments(supabaseData),
        classes: [classSummary],
        connectionStatus: getConnectionStatus(scenario),
        generatedAt: new Date().toISOString(),
        teacherId: input.teacherId,
      });
    }

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

    const supabaseData = scenario === "empty" ? null : await getSignedInTeacherSupabaseData(input.teacherId);

    if (supabaseData && input.classId === supabaseData.classId) {
      return teacherClassProgressApiResponseSchema.parse({
        ...buildSupabaseTeacherClassProgress(supabaseData),
        connectionStatus: getConnectionStatus(scenario),
      });
    }

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

    const supabaseData = await getSignedInTeacherSupabaseData(input.teacherId);

    if (supabaseData) {
      return teacherDashboardApiResponseSchema.parse({
        assignments: buildSupabaseTeacherAssignments(supabaseData),
        classes: [buildDevClassSummary(supabaseData)],
        connectionStatus: getConnectionStatus(scenario),
        generatedAt: new Date().toISOString(),
        safetyNote,
        submissions: buildSupabaseTeacherSubmissions(supabaseData),
        teacherId: input.teacherId,
      });
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

    const supabaseData = scenario === "empty" ? null : await getSignedInTeacherSupabaseData(input.teacherId);

    if (supabaseData) {
      return teacherSubmissionReviewApiResponseSchema.parse({
        ...buildSupabaseTeacherReview(supabaseData, input.submissionId),
        connectionStatus: getConnectionStatus(scenario),
      });
    }

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

    const supabaseData = scenario === "empty" ? null : await getSignedInTeacherSupabaseData(input.teacherId);

    if (supabaseData) {
      return teacherSubmissionsApiResponseSchema.parse({
        connectionStatus: getConnectionStatus(scenario),
        generatedAt: new Date().toISOString(),
        submissions: buildSupabaseTeacherSubmissions(supabaseData),
        teacherId: input.teacherId,
      });
    }

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

    if (scenario !== "empty") {
      const signedInResponse = await updateSignedInTeacherSubmissionComment(input);

      if (signedInResponse) {
        return signedInResponse;
      }
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
