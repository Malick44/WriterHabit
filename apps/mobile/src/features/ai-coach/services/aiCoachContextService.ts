import {
  MAX_AI_COACH_CANVAS_EXCERPT_LENGTH,
  MAX_AI_COACH_DRAFT_EXCERPT_LENGTH,
  MAX_AI_COACH_STUDENT_REQUEST_LENGTH,
  aiCoachContextSchema,
  type AiCoachContext,
  type AiCoachContextBuilderInput,
  type AiCoachWritingLevel,
} from "../types";

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number): string {
  const normalized = compactWhitespace(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, maxLength).trimEnd();
}

export function getAiCoachWritingLevel(gradeLevel: number): AiCoachWritingLevel {
  if (gradeLevel <= 2) {
    return "early_elementary";
  }

  if (gradeLevel <= 5) {
    return "upper_elementary";
  }

  if (gradeLevel <= 8) {
    return "middle";
  }

  return "high";
}

export function buildAiCoachContext(input: AiCoachContextBuilderInput): AiCoachContext {
  return aiCoachContextSchema.parse({
    assignmentId: input.assignment.id,
    assignmentPrompt: compactWhitespace(input.assignment.prompt),
    assignmentTitle: compactWhitespace(input.assignment.title),
    assignmentType: input.assignment.assignmentType,
    canvasContext: input.canvasContext
      ? {
          ...input.canvasContext,
          recognizedTextExcerpt: input.canvasContext.recognizedTextExcerpt
            ? truncate(input.canvasContext.recognizedTextExcerpt, MAX_AI_COACH_CANVAS_EXCERPT_LENGTH)
            : undefined,
        }
      : null,
    connectionStatus: input.connectionStatus ?? "online",
    draftExcerpt: truncate(input.draftText, MAX_AI_COACH_DRAFT_EXCERPT_LENGTH),
    gradeLevel: input.gradeLevel,
    metrics: input.metrics,
    requestedAction: input.requestedAction,
    rubric: input.assignment.rubric,
    skillFocus: input.assignment.skillFocus,
    studentId: input.studentId,
    studentRequest: input.studentRequest
      ? truncate(input.studentRequest, MAX_AI_COACH_STUDENT_REQUEST_LENGTH)
      : undefined,
    writingLevel: getAiCoachWritingLevel(input.gradeLevel),
  });
}
