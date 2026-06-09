import {
  aiCoachActionSchema,
  aiCoachResponseSchema,
  type AiCoachContext,
  type AiCoachResponse,
  type AiCoachSafetyFlag,
} from "../types";

export interface AiCoachPolicyResult {
  allowed: boolean;
  flags: AiCoachSafetyFlag[];
}

const actionNeedsStudentText = new Set(["sentence_check", "explain_mistake", "revision_help", "stronger_word"]);

const blockedTermSets = [
  ["write", "essay"],
  ["finish"],
  ["give", "answer"],
  ["generate", "final", "draft"],
  ["do", "homework"],
  ["complete", "assignment"],
  ["full", "rewrite"],
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function containsAllTerms(value: string, terms: string[]): boolean {
  return terms.every((term) => value.includes(term));
}

function containsCompletionIntent(value: string): boolean {
  const normalized = normalize(value);

  return blockedTermSets.some((terms) => containsAllTerms(normalized, terms));
}

function addFlag(flags: AiCoachSafetyFlag[], flag: AiCoachSafetyFlag) {
  if (!flags.includes(flag)) {
    flags.push(flag);
  }
}

export function evaluateAiCoachRequest(context: AiCoachContext): AiCoachPolicyResult {
  const flags: AiCoachSafetyFlag[] = [];
  const action = aiCoachActionSchema.safeParse(context.requestedAction);

  if (!action.success) {
    addFlag(flags, "unsupported_action");
  }

  if (context.studentRequest && containsCompletionIntent(context.studentRequest)) {
    addFlag(flags, "assignment_completion_request");
  }

  if (actionNeedsStudentText.has(context.requestedAction) && context.metrics.wordCount === 0) {
    addFlag(flags, "empty_context");
  }

  return {
    allowed: !flags.includes("assignment_completion_request") && !flags.includes("unsupported_action"),
    flags,
  };
}

export function evaluateAiCoachOutput(response: AiCoachResponse): AiCoachPolicyResult {
  const parsed = aiCoachResponseSchema.parse(response);
  const flags = [...parsed.safetyFlags];
  const outputText = [
    parsed.strength,
    parsed.improvement,
    parsed.nextStep,
    parsed.guidingQuestion,
  ]
    .filter(Boolean)
    .join(" ");

  if (containsCompletionIntent(outputText)) {
    addFlag(flags, "unsafe_output");
  }

  return {
    allowed: !flags.includes("unsafe_output"),
    flags,
  };
}
