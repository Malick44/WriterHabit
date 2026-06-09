import {
  type FeedbackResponse,
  type FeedbackRubricLevel,
  type FeedbackRubricScoreContract,
  type FeedbackSummaryContract,
  type FeedbackRevisionTaskContract,
  type GrammarSuggestionContract,
  type LocalizedCopy,
  type WritingSkill,
  createLocalizedCopy,
  isWritingSkill,
} from "../contracts";

export type StructuredFeedbackPayload = Omit<FeedbackResponse, "provider">;

export type StructuredFeedbackParseResult =
  | {
      success: true;
      feedback: StructuredFeedbackPayload;
    }
  | {
      success: false;
      errors: string[];
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string, path: string, errors: string[]): string {
  const value = record[key];

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  errors.push(`${path}.${key} must be a non-empty string`);
  return "";
}

function readNumber(record: Record<string, unknown>, key: string, path: string, errors: string[]): number {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  errors.push(`${path}.${key} must be a number`);
  return 0;
}

function parseLocalizedCopy(value: unknown, path: string, errors: string[]): LocalizedCopy {
  if (!isRecord(value)) {
    errors.push(`${path} must be a localized copy object`);
    return createLocalizedCopy(`${path}.missing`, "");
  }

  const key = readString(value, "key", path, errors);
  const fallback = readString(value, "fallback", path, errors);
  const paramsValue = value.params;
  const params: Record<string, string | number | boolean> = {};

  if (paramsValue !== undefined) {
    if (!isRecord(paramsValue)) {
      errors.push(`${path}.params must be an object when present`);
    } else {
      for (const [paramKey, paramValue] of Object.entries(paramsValue)) {
        if (
          typeof paramValue === "string" ||
          typeof paramValue === "number" ||
          typeof paramValue === "boolean"
        ) {
          params[paramKey] = paramValue;
        } else {
          errors.push(`${path}.params.${paramKey} must be a string, number, or boolean`);
        }
      }
    }
  }

  return Object.keys(params).length > 0 ? { fallback, key, params } : { fallback, key };
}

function parseSummary(value: unknown, errors: string[]): FeedbackSummaryContract | null {
  if (!isRecord(value)) {
    errors.push("summary must be an object");
    return null;
  }

  return {
    improvement: parseLocalizedCopy(value.improvement, "summary.improvement", errors),
    nextRevisionTask: parseLocalizedCopy(value.nextRevisionTask, "summary.nextRevisionTask", errors),
    strength: parseLocalizedCopy(value.strength, "summary.strength", errors),
  };
}

function parseWritingSkill(value: unknown, path: string, errors: string[]): WritingSkill {
  if (typeof value === "string" && isWritingSkill(value)) {
    return value;
  }

  errors.push(`${path} must be a supported writing skill`);
  return "clarity";
}

function parseRevisionTask(value: unknown, errors: string[]): FeedbackRevisionTaskContract | null {
  if (!isRecord(value)) {
    errors.push("revisionTask must be an object");
    return null;
  }

  return {
    guidingQuestion: parseLocalizedCopy(value.guidingQuestion, "revisionTask.guidingQuestion", errors),
    id: readString(value, "id", "revisionTask", errors),
    instruction: parseLocalizedCopy(value.instruction, "revisionTask.instruction", errors),
    originalExcerpt: readString(value, "originalExcerpt", "revisionTask", errors),
    targetSkill: parseWritingSkill(value.targetSkill, "revisionTask.targetSkill", errors),
  };
}

function parseScore(value: unknown, path: string, errors: string[]): 1 | 2 | 3 | 4 {
  if (value === 1 || value === 2 || value === 3 || value === 4) {
    return value;
  }

  errors.push(`${path} must be an integer from 1 to 4`);
  return 1;
}

function parseRubricLevel(value: unknown, path: string, errors: string[]): FeedbackRubricLevel {
  if (value === "starting" || value === "building" || value === "meeting" || value === "strong") {
    return value;
  }

  errors.push(`${path} must be a rubric level`);
  return "starting";
}

function parseRubricScore(value: unknown, index: number, errors: string[]): FeedbackRubricScoreContract | null {
  const path = `rubricScores.${index}`;

  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return null;
  }

  const maxScore = value.maxScore;

  if (maxScore !== 4) {
    errors.push(`${path}.maxScore must be 4`);
  }

  return {
    coachingNote: parseLocalizedCopy(value.coachingNote, `${path}.coachingNote`, errors),
    criterionId: readString(value, "criterionId", path, errors),
    level: parseRubricLevel(value.level, `${path}.level`, errors),
    maxScore: 4,
    score: parseScore(value.score, `${path}.score`, errors),
  };
}

function parseGrammarSuggestion(value: unknown, index: number, errors: string[]): GrammarSuggestionContract | null {
  const path = `grammarSuggestions.${index}`;

  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return null;
  }

  return {
    explanation: parseLocalizedCopy(value.explanation, `${path}.explanation`, errors),
    id: readString(value, "id", path, errors),
    originalExcerpt: readString(value, "originalExcerpt", path, errors),
    studentAction: parseLocalizedCopy(value.studentAction, `${path}.studentAction`, errors),
    title: parseLocalizedCopy(value.title, `${path}.title`, errors),
  };
}

function parseProgress(value: unknown, errors: string[]): StructuredFeedbackPayload["progressEarned"] | null {
  if (!isRecord(value)) {
    errors.push("progressEarned must be an object");
    return null;
  }

  return {
    minutes: Math.max(0, Math.floor(readNumber(value, "minutes", "progressEarned", errors))),
    points: Math.max(0, Math.floor(readNumber(value, "points", "progressEarned", errors))),
    skill: parseWritingSkill(value.skill, "progressEarned.skill", errors),
  };
}

export function parseStructuredFeedbackPayload(payload: unknown): StructuredFeedbackParseResult {
  const errors: string[] = [];

  if (!isRecord(payload)) {
    return {
      errors: ["feedback payload must be an object"],
      success: false,
    };
  }

  const summary = parseSummary(payload.summary, errors);
  const revisionTask = parseRevisionTask(payload.revisionTask, errors);
  const progressEarned = parseProgress(payload.progressEarned, errors);
  const rubricScoresRaw = payload.rubricScores;
  const grammarSuggestionsRaw = payload.grammarSuggestions;

  if (!Array.isArray(rubricScoresRaw) || rubricScoresRaw.length === 0) {
    errors.push("rubricScores must include at least one score");
  }

  if (!Array.isArray(grammarSuggestionsRaw)) {
    errors.push("grammarSuggestions must be an array");
  }

  const rubricScores = Array.isArray(rubricScoresRaw)
    ? rubricScoresRaw
        .map((score, index) => parseRubricScore(score, index, errors))
        .filter((score): score is FeedbackRubricScoreContract => score !== null)
    : [];
  const grammarSuggestions = Array.isArray(grammarSuggestionsRaw)
    ? grammarSuggestionsRaw
        .map((suggestion, index) => parseGrammarSuggestion(suggestion, index, errors))
        .filter((suggestion): suggestion is GrammarSuggestionContract => suggestion !== null)
    : [];

  const assignmentId = readString(payload, "assignmentId", "feedback", errors);
  const assignmentTitle = parseLocalizedCopy(payload.assignmentTitle, "feedback.assignmentTitle", errors);
  const createdAt = readString(payload, "createdAt", "feedback", errors);
  const id = readString(payload, "id", "feedback", errors);
  const studentId = readString(payload, "studentId", "feedback", errors);
  const submissionId = readString(payload, "submissionId", "feedback", errors);
  const submittedTextExcerpt = readString(payload, "submittedTextExcerpt", "feedback", errors);

  if (!summary || !revisionTask || !progressEarned || errors.length > 0) {
    return {
      errors,
      success: false,
    };
  }

  return {
    feedback: {
      assignmentId,
      assignmentTitle,
      createdAt,
      grammarSuggestions,
      id,
      progressEarned,
      revisionTask,
      rubricScores,
      studentId,
      submissionId,
      submittedTextExcerpt,
      summary,
    },
    success: true,
  };
}
