import type { AiCoachResponse } from "../features/ai/contracts";

export function mapAiCoachApiResponse(input: {
  clientAction?: string;
  response: AiCoachResponse;
}) {
  return {
    action: input.clientAction ?? input.response.action,
    generatedAt: input.response.generatedAt,
    guidingQuestion: input.response.questionForStudent?.fallback,
    improvement: input.response.coachingMessage.fallback,
    learningMode: true as const,
    nextStep: input.response.nextStep.fallback,
    safetyFlags: input.response.safetyFlags,
    state: input.response.status === "completed" ? ("success" as const) : ("safety_blocked" as const),
    strength: input.response.title.fallback,
  };
}
