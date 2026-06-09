import {
  aiCoachActionSchema,
  aiCoachResponseSchema,
  type AiCoachContext,
  type AiCoachResponse,
  type AiCoachSafetyFlag,
} from "../types";
import {
  createAllowedAcademicIntegrityDecision,
  evaluateAcademicIntegrityText,
  mergeAcademicIntegrityDecisions,
  type AcademicIntegrityRedirect,
} from "./academicIntegrityService";

export interface AiCoachPolicyResult {
  allowed: boolean;
  flags: AiCoachSafetyFlag[];
  policyCodes: string[];
  redirects: AcademicIntegrityRedirect[];
}

const actionNeedsStudentText = new Set(["sentence_check", "explain_mistake", "revision_help", "stronger_word"]);

function addFlag(flags: AiCoachSafetyFlag[], flag: AiCoachSafetyFlag) {
  if (!flags.includes(flag)) {
    flags.push(flag);
  }
}

export function evaluateAiCoachRequest(context: AiCoachContext): AiCoachPolicyResult {
  const flags: AiCoachSafetyFlag[] = [];
  const action = aiCoachActionSchema.safeParse(context.requestedAction);
  const integrityDecision = context.studentRequest
    ? evaluateAcademicIntegrityText({
        source: "student_request",
        text: context.studentRequest,
      })
    : createAllowedAcademicIntegrityDecision();

  if (!action.success) {
    addFlag(flags, "unsupported_action");
  }

  if (actionNeedsStudentText.has(context.requestedAction) && context.metrics.wordCount === 0) {
    addFlag(flags, "empty_context");
  }

  const merged = mergeAcademicIntegrityDecisions([
    integrityDecision,
    {
      allowed: !flags.includes("unsupported_action"),
      flags,
      messageKey: null,
      policyCodes: flags.includes("unsupported_action") ? ["validation.unsupported_ai_action"] : [],
      redirects: [],
    },
  ]);

  return {
    allowed:
      !merged.flags.includes("assignment_completion_request") &&
      !merged.flags.includes("full_rewrite_request") &&
      !merged.flags.includes("answer_request") &&
      !merged.flags.includes("unsupported_action"),
    flags: merged.flags,
    policyCodes: merged.policyCodes,
    redirects: merged.redirects,
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
  const integrityDecision = evaluateAcademicIntegrityText({
    source: "model_output",
    text: outputText,
  });

  if (!integrityDecision.allowed) {
    addFlag(flags, "unsafe_output");
  }

  const merged = mergeAcademicIntegrityDecisions([
    integrityDecision,
    {
      allowed: !flags.includes("unsafe_output"),
      flags,
      messageKey: null,
      policyCodes: flags.includes("unsafe_output") ? ["ai_safety.unsafe_output"] : [],
      redirects: integrityDecision.redirects,
    },
  ]);

  return {
    allowed:
      !merged.flags.includes("assignment_completion_request") &&
      !merged.flags.includes("full_rewrite_request") &&
      !merged.flags.includes("answer_request") &&
      !merged.flags.includes("unsafe_output"),
    flags: merged.flags,
    policyCodes: merged.policyCodes,
    redirects: merged.redirects,
  };
}
