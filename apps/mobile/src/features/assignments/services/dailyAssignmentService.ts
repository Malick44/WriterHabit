import type {
  AssignmentType,
  GradeLevel,
  WritingGoal,
  WritingSkill,
} from "@WriterHabit/shared";

import type { AssignmentDifficulty, AssignmentRubricCriterion } from "../types";

export type DailyAssignmentReasonCode =
  | "daily_minutes_fit"
  | "difficulty_step_down"
  | "difficulty_step_up"
  | "goal_match"
  | "grade_match"
  | "repeat_avoided"
  | "weak_skill_match";

export interface DailyAssignmentTemplate {
  assignmentType: AssignmentType;
  difficulty: AssignmentDifficulty;
  estimatedMinutes: number;
  gradeLevelMax: GradeLevel;
  gradeLevelMin: GradeLevel;
  id: string;
  instructions: string[];
  prompt: string;
  rubric: AssignmentRubricCriterion[];
  rubricId: string;
  skillFocus: WritingSkill[];
  teacherNote?: string;
  title: string;
}

export interface DailyAssignmentHistoryItem {
  assignmentId: string;
  assignmentType: AssignmentType;
  completedAt: string;
  difficulty: AssignmentDifficulty;
  skillFocus: WritingSkill[];
}

export interface DailyAssignmentSelectionInput {
  candidates?: DailyAssignmentTemplate[];
  dailyMinutes: number;
  goals: WritingGoal[];
  gradeLevel: GradeLevel;
  history: DailyAssignmentHistoryItem[];
  referenceDate: string;
  weakSkills: WritingSkill[];
}

export interface DailyAssignmentSelectionResult {
  assignment: DailyAssignmentTemplate;
  inactivityDays: number | null;
  matchedGoals: WritingGoal[];
  matchedWeakSkills: WritingSkill[];
  recentTypeCount: number;
  reasonCodes: DailyAssignmentReasonCode[];
  score: number;
  targetDifficulty: AssignmentDifficulty;
}

interface GoalProfile {
  skills: WritingSkill[];
  types: AssignmentType[];
}

interface ScoredDailyAssignment {
  assignment: DailyAssignmentTemplate;
  matchedGoals: WritingGoal[];
  matchedWeakSkills: WritingSkill[];
  recentTypeCount: number;
  reasonCodes: DailyAssignmentReasonCode[];
  score: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_TYPE_WINDOW = 3;
const INACTIVITY_EASIER_AFTER_DAYS = 3;

const difficultyRank = {
  easy: 0,
  moderate: 1,
  challenging: 2,
} satisfies Record<AssignmentDifficulty, number>;

const difficultyByRank = [
  "easy",
  "moderate",
  "challenging",
] as const satisfies AssignmentDifficulty[];

const writingGoalProfiles: Record<WritingGoal, GoalProfile> = {
  creative_writing: {
    skills: ["creativity", "vocabulary", "clarity"],
    types: ["creative_writing", "journal"],
  },
  improve_grammar: {
    skills: ["grammar", "punctuation", "sentence_structure"],
    types: ["grammar_practice", "sentence_practice"],
  },
  improve_handwriting: {
    skills: ["handwriting"],
    types: ["handwriting_practice"],
  },
  improve_spelling: {
    skills: ["spelling", "vocabulary"],
    types: ["vocabulary_practice", "sentence_practice"],
  },
  school_assignments: {
    skills: ["clarity", "organization", "reading_response", "revision_quality"],
    types: ["paragraph_writing", "reading_response", "essay_writing"],
  },
  test_prep: {
    skills: ["clarity", "evidence_usage", "reading_response"],
    types: ["test_prep", "reading_response"],
  },
  write_better_sentences: {
    skills: ["clarity", "punctuation", "sentence_structure", "vocabulary"],
    types: ["sentence_practice", "grammar_practice"],
  },
  write_essays: {
    skills: [
      "argument_strength",
      "evidence_usage",
      "organization",
      "revision_quality",
    ],
    types: ["essay_writing", "test_prep"],
  },
  write_paragraphs: {
    skills: ["clarity", "organization", "revision_quality"],
    types: ["paragraph_writing", "reading_response"],
  },
};

export const dailyAssignmentCatalog = [
  {
    assignmentType: "sentence_practice",
    difficulty: "easy",
    estimatedMinutes: 10,
    gradeLevelMax: 5,
    gradeLevelMin: 1,
    id: "daily-sentence-details",
    instructions: [
      "Write your own three sentences.",
      "Add one describing word to each sentence.",
      "Reread your favorite sentence before you submit.",
    ],
    prompt:
      "Write three sentences about a place you know. Add one describing word to each sentence.",
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
        description:
          "Sentences start with capital letters and end with punctuation.",
        id: "sentence-care",
        label: "Sentence care",
      },
    ],
    rubricId: "rubric-sentence-details",
    skillFocus: ["sentence_structure", "vocabulary"],
    teacherNote:
      "Use your own memory of the place. A hint can help you choose details.",
    title: "Add details to sentences",
  },
  {
    assignmentType: "handwriting_practice",
    difficulty: "easy",
    estimatedMinutes: 8,
    gradeLevelMax: 5,
    gradeLevelMin: 1,
    id: "daily-handwriting-clear-words",
    instructions: [
      "Choose five words from your day.",
      "Write each word slowly on the canvas or paper.",
      "Circle the word that looks clearest.",
    ],
    prompt:
      "Practice writing five clear words from your day, then choose your clearest word.",
    rubric: [
      {
        description: "Letters are spaced so each word is readable.",
        id: "spacing",
        label: "Word spacing",
      },
      {
        description: "The student chooses one clear word to review.",
        id: "self-check",
        label: "Self check",
      },
    ],
    rubricId: "rubric-handwriting-clear-words",
    skillFocus: ["handwriting", "spelling"],
    teacherNote: "Small handwriting practice can count as writing thinking.",
    title: "Write clear practice words",
  },
  {
    assignmentType: "vocabulary_practice",
    difficulty: "easy",
    estimatedMinutes: 10,
    gradeLevelMax: 5,
    gradeLevelMin: 1,
    id: "daily-vocabulary-detail-word",
    instructions: [
      "Pick one describing word.",
      "Use it in your own sentence.",
      "Draw or write one detail that explains the word.",
    ],
    prompt:
      "Choose a describing word and write one sentence that shows what it means.",
    rubric: [
      {
        description: "The sentence uses the chosen word correctly.",
        id: "word-use",
        label: "Word use",
      },
      {
        description: "A detail helps explain the word.",
        id: "detail",
        label: "Detail",
      },
    ],
    rubricId: "rubric-vocabulary-detail-word",
    skillFocus: ["vocabulary", "sentence_structure"],
    teacherNote:
      "The coach can ask a question if the student needs help choosing a detail.",
    title: "Show a describing word",
  },
  {
    assignmentType: "creative_writing",
    difficulty: "moderate",
    estimatedMinutes: 15,
    gradeLevelMax: 5,
    gradeLevelMin: 4,
    id: "daily-picture-story-plan",
    instructions: [
      "Name a character and setting.",
      "Write three events in order.",
      "Add one feeling word.",
    ],
    prompt:
      "Plan a short story with a character, a setting, and three events in order.",
    rubric: [
      {
        description: "The plan names a character and setting.",
        id: "story-parts",
        label: "Story parts",
      },
      {
        description: "Events are listed in an order that makes sense.",
        id: "sequence",
        label: "Sequence",
      },
    ],
    rubricId: "rubric-picture-story-plan",
    skillFocus: ["creativity", "organization", "vocabulary"],
    teacherNote:
      "Keep this as a plan so the student's own story can grow from it.",
    title: "Plan a tiny story",
  },
  {
    assignmentType: "paragraph_writing",
    difficulty: "moderate",
    estimatedMinutes: 15,
    gradeLevelMax: 8,
    gradeLevelMin: 6,
    id: "daily-paragraph-evidence",
    instructions: [
      "Write your own topic sentence.",
      "Add two details that support your reason.",
      "Revise one sentence so the reason is clearer.",
    ],
    prompt:
      "Write a paragraph explaining whether practice or talent matters more when learning a skill.",
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
    teacherNote:
      "A coach hint can ask a question, but the paragraph should stay in your words.",
    title: "Support a paragraph idea",
  },
  {
    assignmentType: "reading_response",
    difficulty: "moderate",
    estimatedMinutes: 18,
    gradeLevelMax: 8,
    gradeLevelMin: 6,
    id: "daily-reading-response-main-idea",
    instructions: [
      "State the main idea in your own words.",
      "Add one detail that helped you decide.",
      "Explain how the detail connects to the main idea.",
    ],
    prompt:
      "Write a short response explaining the main idea of something you read recently.",
    rubric: [
      {
        description: "The response names a main idea.",
        id: "main-idea",
        label: "Main idea",
      },
      {
        description: "A detail supports the main idea.",
        id: "supporting-detail",
        label: "Supporting detail",
      },
    ],
    rubricId: "rubric-reading-response-main-idea",
    skillFocus: ["reading_response", "clarity", "organization"],
    teacherNote: "Students should use a text or passage they already read.",
    title: "Explain a main idea",
  },
  {
    assignmentType: "grammar_practice",
    difficulty: "easy",
    estimatedMinutes: 12,
    gradeLevelMax: 8,
    gradeLevelMin: 6,
    id: "daily-grammar-combine-sentences",
    instructions: [
      "Write two short related sentences.",
      "Combine them into one clearer sentence.",
      "Check punctuation before submitting.",
    ],
    prompt:
      "Combine two related sentences into one clearer sentence in your own words.",
    rubric: [
      {
        description: "The combined sentence keeps the original meaning.",
        id: "meaning",
        label: "Meaning",
      },
      {
        description: "Punctuation supports the combined sentence.",
        id: "punctuation",
        label: "Punctuation",
      },
    ],
    rubricId: "rubric-grammar-combine-sentences",
    skillFocus: ["grammar", "punctuation", "sentence_structure"],
    teacherNote: "This is a sentence practice block, not a full paragraph.",
    title: "Combine two sentences",
  },
  {
    assignmentType: "essay_writing",
    difficulty: "challenging",
    estimatedMinutes: 22,
    gradeLevelMax: 8,
    gradeLevelMin: 8,
    id: "daily-middle-essay-plan",
    instructions: [
      "Choose a claim.",
      "List two reasons that support it.",
      "Write one sentence explaining why one reason matters.",
    ],
    prompt: "Plan a short argument with one claim and two reasons.",
    rubric: [
      {
        description: "The claim is clear and debatable.",
        id: "claim",
        label: "Claim",
      },
      {
        description: "Reasons connect to the claim.",
        id: "reasons",
        label: "Reasons",
      },
    ],
    rubricId: "rubric-middle-essay-plan",
    skillFocus: ["argument_strength", "organization", "revision_quality"],
    teacherNote:
      "This is planning practice for a future essay, not a finished essay.",
    title: "Plan a short argument",
  },
  {
    assignmentType: "essay_writing",
    difficulty: "challenging",
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
    prompt:
      "Draft a thesis and one evidence-based body paragraph about how technology affects learning.",
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
        description:
          "Revision improves clarity or reasoning before submission.",
        id: "revision-quality",
        label: "Revision quality",
      },
    ],
    rubricId: "rubric-essay-thesis-evidence",
    skillFocus: [
      "argument_strength",
      "evidence_usage",
      "organization",
      "revision_quality",
    ],
    teacherNote:
      "Use coach questions for planning and revision choices, not a finished response.",
    title: "Strengthen a thesis and evidence",
  },
  {
    assignmentType: "paragraph_writing",
    difficulty: "moderate",
    estimatedMinutes: 20,
    gradeLevelMax: 12,
    gradeLevelMin: 9,
    id: "daily-evidence-analysis-paragraph",
    instructions: [
      "Write one claim sentence.",
      "Add one piece of evidence.",
      "Write one analysis sentence that explains why the evidence matters.",
    ],
    prompt:
      "Write one evidence paragraph about whether technology helps students learn independently.",
    rubric: [
      {
        description: "The paragraph includes a focused claim.",
        id: "claim",
        label: "Claim",
      },
      {
        description: "Evidence is followed by student analysis.",
        id: "analysis",
        label: "Analysis",
      },
    ],
    rubricId: "rubric-evidence-analysis-paragraph",
    skillFocus: ["evidence_usage", "clarity", "organization"],
    teacherNote: "Keep the scope to one paragraph after inactive stretches.",
    title: "Explain evidence in one paragraph",
  },
  {
    assignmentType: "test_prep",
    difficulty: "moderate",
    estimatedMinutes: 18,
    gradeLevelMax: 12,
    gradeLevelMin: 9,
    id: "daily-test-prep-claim-evidence",
    instructions: [
      "Read the prompt carefully.",
      "Write a direct claim.",
      "Add one evidence detail and one explanation sentence.",
    ],
    prompt:
      "Write a short test-style response with one claim, one evidence detail, and one explanation.",
    rubric: [
      {
        description: "The answer directly responds to the prompt.",
        id: "direct-answer",
        label: "Direct answer",
      },
      {
        description: "Evidence is explained in the student's own words.",
        id: "explained-evidence",
        label: "Explained evidence",
      },
    ],
    rubricId: "rubric-test-prep-claim-evidence",
    skillFocus: ["evidence_usage", "reading_response", "clarity"],
    teacherNote:
      "This keeps test prep focused on structure and student reasoning.",
    title: "Build a claim and evidence response",
  },
  {
    assignmentType: "essay_writing",
    difficulty: "moderate",
    estimatedMinutes: 20,
    gradeLevelMax: 12,
    gradeLevelMin: 9,
    id: "daily-revision-argument-focus",
    instructions: [
      "Choose one sentence from a draft.",
      "Name what the sentence is trying to prove.",
      "Revise it so the reasoning is clearer.",
    ],
    prompt:
      "Revise one argument sentence so it explains the reason more clearly.",
    rubric: [
      {
        description: "The revised sentence keeps the student's idea.",
        id: "student-idea",
        label: "Student idea",
      },
      {
        description: "The reason is clearer after revision.",
        id: "clear-reason",
        label: "Clear reason",
      },
    ],
    rubricId: "rubric-revision-argument-focus",
    skillFocus: ["revision_quality", "argument_strength", "clarity"],
    teacherNote:
      "This revision task should improve one student-written sentence.",
    title: "Revise an argument sentence",
  },
] as const satisfies DailyAssignmentTemplate[];

function parseDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);

  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

function getDaysBetween(referenceDate: string, pastDate: string): number {
  return Math.max(
    0,
    Math.floor(
      (parseDate(referenceDate).getTime() - parseDate(pastDate).getTime()) /
        DAY_MS,
    ),
  );
}

function getRecentHistory(
  input: DailyAssignmentSelectionInput,
): DailyAssignmentHistoryItem[] {
  return [...input.history]
    .filter(
      (item) => getDaysBetween(input.referenceDate, item.completedAt) >= 0,
    )
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

function getInactivityDays(
  input: DailyAssignmentSelectionInput,
): number | null {
  const mostRecent = getRecentHistory(input)[0];

  return mostRecent
    ? getDaysBetween(input.referenceDate, mostRecent.completedAt)
    : null;
}

function getBaseDifficulty(
  gradeLevel: GradeLevel,
  dailyMinutes: number,
): AssignmentDifficulty {
  if (gradeLevel <= 5) {
    return dailyMinutes >= 15 ? "moderate" : "easy";
  }

  if (gradeLevel <= 8) {
    return dailyMinutes >= 22
      ? "challenging"
      : dailyMinutes <= 12
        ? "easy"
        : "moderate";
  }

  return dailyMinutes >= 25 ? "challenging" : "moderate";
}

function shiftDifficulty(
  difficulty: AssignmentDifficulty,
  amount: -1 | 0 | 1,
): AssignmentDifficulty {
  const nextRank = Math.min(
    2,
    Math.max(0, difficultyRank[difficulty] + amount),
  );

  return difficultyByRank[nextRank];
}

function getRecentCompletionCount(
  input: DailyAssignmentSelectionInput,
): number {
  return getRecentHistory(input).filter(
    (item) => getDaysBetween(input.referenceDate, item.completedAt) <= 7,
  ).length;
}

function getTargetDifficulty(input: DailyAssignmentSelectionInput): {
  reasonCode: DailyAssignmentReasonCode | null;
  targetDifficulty: AssignmentDifficulty;
} {
  const baseDifficulty = getBaseDifficulty(
    input.gradeLevel,
    input.dailyMinutes,
  );
  const inactivityDays = getInactivityDays(input);

  if (
    inactivityDays !== null &&
    inactivityDays >= INACTIVITY_EASIER_AFTER_DAYS
  ) {
    return {
      reasonCode: "difficulty_step_down",
      targetDifficulty: shiftDifficulty(baseDifficulty, -1),
    };
  }

  if (getRecentCompletionCount(input) >= 4 && input.dailyMinutes >= 15) {
    return {
      reasonCode: "difficulty_step_up",
      targetDifficulty: shiftDifficulty(baseDifficulty, 1),
    };
  }

  return {
    reasonCode: null,
    targetDifficulty: baseDifficulty,
  };
}

function getRecentTypeCount(
  input: DailyAssignmentSelectionInput,
  assignmentType: AssignmentType,
): number {
  return getRecentHistory(input)
    .slice(0, RECENT_TYPE_WINDOW)
    .filter((item) => item.assignmentType === assignmentType).length;
}

function getMatchedWeakSkills(
  candidate: DailyAssignmentTemplate,
  weakSkills: WritingSkill[],
): WritingSkill[] {
  return weakSkills.filter((skill) => candidate.skillFocus.includes(skill));
}

function getMatchedGoals(
  candidate: DailyAssignmentTemplate,
  goals: WritingGoal[],
): WritingGoal[] {
  return goals.filter((goal) => {
    const profile = writingGoalProfiles[goal];

    return (
      profile.types.includes(candidate.assignmentType) ||
      candidate.skillFocus.some((skill) => profile.skills.includes(skill))
    );
  });
}

function isGradeEligible(
  candidate: DailyAssignmentTemplate,
  gradeLevel: GradeLevel,
): boolean {
  return (
    candidate.gradeLevelMin <= gradeLevel &&
    candidate.gradeLevelMax >= gradeLevel
  );
}

function scoreCandidate(input: {
  candidate: DailyAssignmentTemplate;
  matchedGoals: WritingGoal[];
  matchedWeakSkills: WritingSkill[];
  recentTypeCount: number;
  targetDifficulty: AssignmentDifficulty;
  dailyMinutes: number;
  inactivityDays: number | null;
}): { reasonCodes: DailyAssignmentReasonCode[]; score: number } {
  const reasonCodes: DailyAssignmentReasonCode[] = ["grade_match"];
  let score = 100;
  const difficultyDistance = Math.abs(
    difficultyRank[input.candidate.difficulty] -
      difficultyRank[input.targetDifficulty],
  );
  const minutesOver = Math.max(
    0,
    input.candidate.estimatedMinutes - input.dailyMinutes,
  );
  const minutesUnder = Math.max(
    0,
    input.dailyMinutes - input.candidate.estimatedMinutes,
  );

  score += input.matchedWeakSkills.length * 28;
  score += input.matchedGoals.length * 16;
  score += Math.max(0, 18 - difficultyDistance * 10);
  score += minutesOver === 0 ? 12 : -minutesOver * 3;
  score -= minutesUnder > 12 ? 4 : 0;

  if (input.matchedWeakSkills.length > 0) {
    reasonCodes.push("weak_skill_match");
  }

  if (input.matchedGoals.length > 0) {
    reasonCodes.push("goal_match");
  }

  if (minutesOver <= 5) {
    reasonCodes.push("daily_minutes_fit");
  }

  if (input.recentTypeCount >= 2) {
    score -= 70;
    reasonCodes.push("repeat_avoided");
  } else if (input.recentTypeCount === 1) {
    score -= 12;
  }

  if (
    input.inactivityDays !== null &&
    input.inactivityDays >= INACTIVITY_EASIER_AFTER_DAYS
  ) {
    reasonCodes.push("difficulty_step_down");
  }

  return {
    reasonCodes: [...new Set(reasonCodes)],
    score,
  };
}

export function selectDailyAssignment(
  input: DailyAssignmentSelectionInput,
): DailyAssignmentSelectionResult {
  const candidates = (input.candidates ?? dailyAssignmentCatalog).filter(
    (candidate) => isGradeEligible(candidate, input.gradeLevel),
  );

  if (candidates.length === 0) {
    throw new Error(
      "No daily assignment candidates match the student's grade.",
    );
  }

  const { reasonCode, targetDifficulty } = getTargetDifficulty(input);
  const inactivityDays = getInactivityDays(input);
  const scoredCandidates = candidates.map<ScoredDailyAssignment>(
    (candidate) => {
      const matchedGoals = getMatchedGoals(candidate, input.goals);
      const matchedWeakSkills = getMatchedWeakSkills(
        candidate,
        input.weakSkills,
      );
      const recentTypeCount = getRecentTypeCount(
        input,
        candidate.assignmentType,
      );
      const scored = scoreCandidate({
        candidate,
        dailyMinutes: Math.max(5, input.dailyMinutes),
        inactivityDays,
        matchedGoals,
        matchedWeakSkills,
        recentTypeCount,
        targetDifficulty,
      });

      return {
        assignment: candidate,
        matchedGoals,
        matchedWeakSkills,
        recentTypeCount,
        reasonCodes: reasonCode
          ? [...new Set([...scored.reasonCodes, reasonCode])]
          : scored.reasonCodes,
        score: scored.score,
      };
    },
  );

  const selected = scoredCandidates.sort(
    (a, b) =>
      b.score - a.score ||
      a.assignment.estimatedMinutes - b.assignment.estimatedMinutes ||
      a.assignment.id.localeCompare(b.assignment.id),
  )[0];

  return {
    assignment: selected.assignment,
    inactivityDays,
    matchedGoals: selected.matchedGoals,
    matchedWeakSkills: selected.matchedWeakSkills,
    recentTypeCount: selected.recentTypeCount,
    reasonCodes: selected.reasonCodes,
    score: selected.score,
    targetDifficulty,
  };
}
