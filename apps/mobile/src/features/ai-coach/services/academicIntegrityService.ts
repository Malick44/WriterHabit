import type { TranslationKey } from "@/shared/i18n";

import type { AiCoachAction, AiCoachSafetyFlag } from "../types";

export type AcademicIntegritySource = "student_request" | "model_output" | "teacher_prompt" | "student_work";

export interface AcademicIntegrityRedirect {
  action: AiCoachAction;
  labelKey: TranslationKey;
  reasonKey: TranslationKey;
}

export interface AcademicIntegrityDecision {
  allowed: boolean;
  flags: AiCoachSafetyFlag[];
  messageKey: TranslationKey | null;
  policyCodes: string[];
  redirects: AcademicIntegrityRedirect[];
}

interface AcademicIntegrityRule {
  code: string;
  flag: AiCoachSafetyFlag;
  messageKey: TranslationKey;
  pattern: RegExp;
  redirectActions: AiCoachAction[];
}

const redirectLabelKeys: Record<AiCoachAction, TranslationKey> = {
  ask_question: "aiCoach.askQuestionCta",
  brainstorm: "aiCoach.brainstormCta",
  explain_mistake: "aiCoach.explainMistakeCta",
  hint: "aiCoach.hintCta",
  revision_help: "aiCoach.revisionHelpCta",
  sentence_check: "aiCoach.sentenceCheckCta",
  stronger_word: "aiCoach.strongerWordCta",
};

const blockedRules: AcademicIntegrityRule[] = [
  {
    code: "ai_safety.assignment_completion_request",
    flag: "assignment_completion_request",
    messageKey: "aiCoach.safetyBlocked.description",
    pattern: /\b(write|complete|finish|do)\b.{0,48}\b(essay|assignment|homework|paper|response)\b/i,
    redirectActions: ["hint", "brainstorm", "ask_question"],
  },
  {
    code: "ai_safety.full_rewrite_request",
    flag: "full_rewrite_request",
    messageKey: "aiCoach.safetyBlocked.description",
    pattern: /\b(full|whole|entire|final|polished)\b.{0,36}\b(rewrite|draft|version|essay|answer)\b/i,
    redirectActions: ["revision_help", "sentence_check", "stronger_word"],
  },
  {
    code: "ai_safety.answer_request",
    flag: "answer_request",
    messageKey: "aiCoach.safetyBlocked.description",
    pattern: /\b(give|tell|show)\b.{0,36}\b(answer|solution|what to submit)\b/i,
    redirectActions: ["hint", "ask_question", "brainstorm"],
  },
];

function dedupe<T>(values: T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function getApplicableRules(source: AcademicIntegritySource): AcademicIntegrityRule[] {
  if (source === "student_work") {
    return [];
  }

  return blockedRules;
}

function buildRedirects(actions: AiCoachAction[]): AcademicIntegrityRedirect[] {
  return dedupe(actions).map((action) => ({
    action,
    labelKey: redirectLabelKeys[action],
    reasonKey: "aiCoach.safetyBlocked.description",
  }));
}

export function evaluateAcademicIntegrityText(input: {
  source: AcademicIntegritySource;
  text: string;
}): AcademicIntegrityDecision {
  const flags: AiCoachSafetyFlag[] = [];
  const policyCodes: string[] = [];
  const redirectActions: AiCoachAction[] = [];
  let messageKey: TranslationKey | null = null;

  for (const rule of getApplicableRules(input.source)) {
    if (!rule.pattern.test(input.text)) {
      continue;
    }

    flags.push(rule.flag);
    policyCodes.push(rule.code);
    redirectActions.push(...rule.redirectActions);
    messageKey ??= rule.messageKey;
  }

  const uniqueFlags = dedupe(flags);

  return {
    allowed: uniqueFlags.length === 0,
    flags: uniqueFlags,
    messageKey,
    policyCodes: dedupe(policyCodes),
    redirects: buildRedirects(redirectActions),
  };
}

export function createAllowedAcademicIntegrityDecision(): AcademicIntegrityDecision {
  return {
    allowed: true,
    flags: [],
    messageKey: null,
    policyCodes: [],
    redirects: [],
  };
}

export function mergeAcademicIntegrityDecisions(decisions: AcademicIntegrityDecision[]): AcademicIntegrityDecision {
  const flags = dedupe(decisions.flatMap((decision) => decision.flags));
  const policyCodes = dedupe(decisions.flatMap((decision) => decision.policyCodes));
  const redirects = buildRedirects(decisions.flatMap((decision) => decision.redirects.map((redirect) => redirect.action)));

  return {
    allowed: decisions.every((decision) => decision.allowed) && flags.length === 0,
    flags,
    messageKey: decisions.find((decision) => decision.messageKey)?.messageKey ?? null,
    policyCodes,
    redirects,
  };
}
