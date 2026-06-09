import {
  type AiSafetyDecision,
  type AiSafetyFlag,
  createLocalizedCopy,
} from "../contracts";

type AcademicIntegrityPattern = {
  flag: AiSafetyFlag;
  code: string;
  pattern: RegExp;
};

export interface AcademicIntegrityTextInput {
  text: string;
  source: "student_request" | "model_output" | "teacher_prompt" | "student_work";
}

const blockedPatterns: AcademicIntegrityPattern[] = [
  {
    code: "ai_safety.assignment_completion_request",
    flag: "assignment_completion_request",
    pattern: /\b(write|complete|finish|do)\b.{0,40}\b(essay|assignment|homework|paper|response)\b/i,
  },
  {
    code: "ai_safety.full_rewrite_request",
    flag: "full_rewrite_request",
    pattern: /\b(full|whole|entire|final|polished)\b.{0,30}\b(rewrite|draft|version|essay|answer)\b/i,
  },
  {
    code: "ai_safety.answer_request",
    flag: "answer_request",
    pattern: /\b(give|tell|show)\b.{0,30}\b(answer|solution|what to submit)\b/i,
  },
  {
    code: "ai_safety.age_inappropriate",
    flag: "age_inappropriate",
    pattern: /\b(age[-\s]?inappropriate|explicit sexual|graphic violence|hate speech|self harm)\b/i,
  },
];

function dedupeFlags(flags: AiSafetyFlag[]): AiSafetyFlag[] {
  return flags.filter((flag, index) => flags.indexOf(flag) === index);
}

function getMessageForFlag(flag: AiSafetyFlag) {
  switch (flag) {
    case "assignment_completion_request":
      return createLocalizedCopy(
        "errors.aiSafety.assignmentCompletionRequest",
        "I can help you think through it, but I cannot do the assignment for you.",
      );
    case "full_rewrite_request":
      return createLocalizedCopy(
        "errors.aiSafety.fullRewriteRequest",
        "I can suggest revisions, but your final draft needs to be yours.",
      );
    case "answer_request":
      return createLocalizedCopy(
        "errors.aiSafety.answerRequest",
        "I can give a hint or ask a guiding question.",
      );
    case "age_inappropriate":
      return createLocalizedCopy(
        "errors.aiSafety.ageInappropriate",
        "Try a school-appropriate request.",
      );
  }
}

export class AcademicIntegrityService {
  evaluateText(input: AcademicIntegrityTextInput): AiSafetyDecision {
    const flags: AiSafetyFlag[] = [];
    const policyCodes: string[] = [];
    const applicablePatterns =
      input.source === "student_work"
        ? blockedPatterns.filter((rule) => rule.flag === "age_inappropriate")
        : blockedPatterns;

    for (const rule of applicablePatterns) {
      if (rule.pattern.test(input.text)) {
        flags.push(rule.flag);
        policyCodes.push(rule.code);
      }
    }

    const uniqueFlags = dedupeFlags(flags);

    return {
      allowed: uniqueFlags.length === 0,
      flags: uniqueFlags,
      message: uniqueFlags[0] ? getMessageForFlag(uniqueFlags[0]) : null,
      policyCodes: policyCodes.filter((code, index) => policyCodes.indexOf(code) === index),
    };
  }

  mergeDecisions(decisions: AiSafetyDecision[]): AiSafetyDecision {
    const flags = dedupeFlags(decisions.flatMap((decision) => decision.flags));
    const policyCodes = decisions
      .flatMap((decision) => decision.policyCodes)
      .filter((code, index, values) => values.indexOf(code) === index);

    return {
      allowed: flags.length === 0 && decisions.every((decision) => decision.allowed),
      flags,
      message: flags[0] ? getMessageForFlag(flags[0]) : decisions.find((decision) => !decision.allowed)?.message ?? null,
      policyCodes,
    };
  }
}
