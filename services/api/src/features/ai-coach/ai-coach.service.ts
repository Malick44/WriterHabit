export const aiCoachEndpoints = [
  "POST /api/v1/ai/coach/hint",
  "POST /api/v1/ai/coach/brainstorm",
  "POST /api/v1/ai/coach/check-sentence",
  "POST /api/v1/ai/coach/explain-grammar",
  "POST /api/v1/ai/coach/suggest-vocabulary",
  "POST /api/v1/ai/coach/revision-question",
] as const;

export type AiCoachEndpoint = (typeof aiCoachEndpoints)[number];

export const allowedAiCoachActions = [
  "hint",
  "brainstorm",
  "check_sentence",
  "explain_grammar",
  "suggest_vocabulary",
  "revision_question",
] as const;

export type AllowedAiCoachAction = (typeof allowedAiCoachActions)[number];

// Framework-neutral placeholder for safe coaching, policy checks, and usage limits.
export class AiCoachService {}
