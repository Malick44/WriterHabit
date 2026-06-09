import { buildAiCoachPrompt } from "./coachPrompt";
import {
  MAX_AI_COACH_DRAFT_EXCERPT_LENGTH,
  aiCoachContextSchema,
  type AiCoachContext,
} from "../types";

interface BuildReviewPromptParams {
  assignmentPrompt: string;
  gradeLevel: number;
  skillFocus: AiCoachContext["skillFocus"];
  studentText: string;
}

export function buildReviewPrompt(params: BuildReviewPromptParams) {
  const skillFocus: AiCoachContext["skillFocus"] = params.skillFocus.length > 0 ? params.skillFocus : ["clarity"];
  const context = aiCoachContextSchema.parse({
    assignmentId: "review-context",
    assignmentPrompt: params.assignmentPrompt,
    assignmentTitle: "Writing review",
    assignmentType: params.gradeLevel <= 5 ? "sentence_practice" : params.gradeLevel <= 8 ? "paragraph_writing" : "essay_writing",
    canvasContext: null,
    connectionStatus: "online",
    draftExcerpt: params.studentText.slice(0, MAX_AI_COACH_DRAFT_EXCERPT_LENGTH),
    gradeLevel: params.gradeLevel,
    metrics: {
      paragraphCount: params.studentText.trim() ? params.studentText.trim().split(/\n{2,}/).length : 0,
      sentenceCount: params.studentText.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.length ?? 0,
      wordCount: params.studentText.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0,
    },
    requestedAction: "revision_help",
    rubric: [],
    skillFocus,
    studentId: "review-student",
    writingLevel:
      params.gradeLevel <= 2
        ? "early_elementary"
        : params.gradeLevel <= 5
          ? "upper_elementary"
          : params.gradeLevel <= 8
            ? "middle"
            : "high",
  });
  const prompt = buildAiCoachPrompt(context);

  return [prompt.system, prompt.user].join("\n\n");
}
