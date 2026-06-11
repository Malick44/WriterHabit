import { buildAiCoachPrompt } from "../prompts/coachPrompt";
import { evaluateAiCoachOutput, evaluateAiCoachRequest } from "../services/aiCoachPolicyService";
import {
  aiCoachResponseSchema,
  aiCoachScenarioSchema,
  type AiCoachAction,
  type AiCoachContext,
  type AiCoachRequestInput,
  type AiCoachResponse,
  type AiCoachSafetyFlag,
  type AiCoachScenario,
} from "../types";

export type AiCoachApiErrorCode = "offline" | "request_failed";
type AiCoachGuidance = Omit<AiCoachResponse, "action" | "generatedAt" | "learningMode" | "safetyFlags" | "state">;

export class AiCoachApiError extends Error {
  code: AiCoachApiErrorCode;

  constructor(code: AiCoachApiErrorCode, message: string) {
    super(message);
    this.name = "AiCoachApiError";
    this.code = code;
  }
}

function readScenario(): AiCoachScenario {
  const parsed = aiCoachScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WriterHabit_AI_COACH_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

function getSkillLabel(context: AiCoachContext): string {
  return context.skillFocus[0]?.replace(/_/g, " ") ?? "clarity";
}

function getAudiencePrefix(context: AiCoachContext): "elementary" | "middle" | "high" {
  if (context.gradeLevel <= 5) {
    return "elementary";
  }

  if (context.gradeLevel <= 8) {
    return "middle";
  }

  return "high";
}

function getActionGuidance(action: AiCoachAction, context: AiCoachContext) {
  const skill = getSkillLabel(context);
  const audience = getAudiencePrefix(context);

  const elementary: Record<AiCoachAction, AiCoachGuidance> = {
    ask_question: {
      guidingQuestion: "What is one detail you can add from your own idea?",
      improvement: "Pick one part that still feels small.",
      nextStep: "Say your idea out loud, then write one more detail.",
      strength: "You are asking for help before you submit.",
    },
    brainstorm: {
      guidingQuestion: "Which idea feels most like yours?",
      improvement: "Choose one idea before you start adding sentences.",
      nextStep: "List three tiny ideas, then circle the one you want to use.",
      strength: "You are getting ready to plan first.",
    },
    explain_mistake: {
      guidingQuestion: "What mark or word can you check again?",
      improvement: "Look for one capital letter, ending mark, or missing word.",
      nextStep: "Read the sentence slowly and fix one thing you notice.",
      strength: "You are learning how to spot your own sentence choices.",
    },
    hint: {
      guidingQuestion: "What do you already know about this topic?",
      improvement: "Add one clear detail instead of many ideas at once.",
      nextStep: "Write one sentence starter in your own words.",
      strength: "You have the prompt open and are ready to try.",
    },
    revision_help: {
      guidingQuestion: "Which sentence could be clearer?",
      improvement: `Work on one ${skill} choice at a time.`,
      nextStep: "Choose one sentence and make it easier to understand.",
      strength: "You are checking your work before sending it.",
    },
    sentence_check: {
      guidingQuestion: "Does the sentence tell one complete idea?",
      improvement: "Check the start, the ending mark, and one describing word.",
      nextStep: "Point to the sentence and reread it once.",
      strength: "You already have writing to review.",
    },
    stronger_word: {
      guidingQuestion: "What word tells the reader exactly what you mean?",
      improvement: "Pick one plain word and try a more exact word.",
      nextStep: "Circle one word, then choose a stronger word that still sounds like you.",
      strength: "You are thinking about word choice.",
    },
  };

  const middle: Record<AiCoachAction, AiCoachGuidance> = {
    ask_question: {
      guidingQuestion: "What claim, detail, or explanation would make your next move clearer?",
      improvement: "Focus the question on one part of the paragraph.",
      nextStep: "Write a note that names the one part you want to improve.",
      strength: "You are using coaching to make a writing decision.",
    },
    brainstorm: {
      guidingQuestion: "Which idea can you support with a real detail or example?",
      improvement: "Sort your ideas before drafting so the paragraph has a clear direction.",
      nextStep: "Make a three-item list: claim, detail, explanation.",
      strength: "You are planning before expanding the paragraph.",
    },
    explain_mistake: {
      guidingQuestion: "What pattern do you notice in the sentence or paragraph?",
      improvement: "Name the issue first, then fix just that issue.",
      nextStep: "Reread the line and mark where the idea becomes unclear.",
      strength: "You are trying to understand the correction, not just change words.",
    },
    hint: {
      guidingQuestion: "What part of the prompt tells you what the paragraph must prove?",
      improvement: "Turn the prompt into one focused writing task.",
      nextStep: "Underline the task word and write one possible topic sentence.",
      strength: "You are pausing to understand the assignment.",
    },
    revision_help: {
      guidingQuestion: "Which sentence best shows your main point, and which one needs support?",
      improvement: `Strengthen one ${skill} move before changing anything else.`,
      nextStep: "Choose one sentence and add or clarify the support for it.",
      strength: "You have a draft you can improve through revision.",
    },
    sentence_check: {
      guidingQuestion: "Does this sentence connect clearly to the paragraph's main idea?",
      improvement: "Check whether the sentence has one clear subject, action, and purpose.",
      nextStep: "Revise one sentence for clarity, then reread the paragraph around it.",
      strength: "You are checking sentence clarity before submission.",
    },
    stronger_word: {
      guidingQuestion: "What word would make the meaning more precise without changing your idea?",
      improvement: "Replace one vague word with a precise word that fits the sentence.",
      nextStep: "Pick one word to improve and test whether the sentence still sounds like you.",
      strength: "You are improving vocabulary while keeping your own voice.",
    },
  };

  const high: Record<AiCoachAction, AiCoachGuidance> = {
    ask_question: {
      guidingQuestion: "What is the strongest next question about claim, evidence, analysis, or structure?",
      improvement: "Make the question specific enough that it leads to a concrete revision.",
      nextStep: "Write one margin note that names the exact decision you need to make.",
      strength: "You are using coaching to sharpen your own reasoning.",
    },
    brainstorm: {
      guidingQuestion: "Which idea can become a defensible claim with evidence and analysis?",
      improvement: "Separate possible claims from evidence before drafting.",
      nextStep: "Draft a short plan: claim, evidence, analysis, revision check.",
      strength: "You are building structure before committing to a draft.",
    },
    explain_mistake: {
      guidingQuestion: "Is the problem grammar, clarity, evidence, or reasoning?",
      improvement: "Diagnose the issue before revising the sentence.",
      nextStep: "Annotate the sentence with one label, then revise only that issue.",
      strength: "You are looking for the reason behind the correction.",
    },
    hint: {
      guidingQuestion: "What does the prompt require you to argue, explain, or prove?",
      improvement: "Convert the prompt into a specific writing objective.",
      nextStep: "Write a working claim or purpose statement in your own words.",
      strength: "You are grounding the draft in the assignment task.",
    },
    revision_help: {
      guidingQuestion: "Which revision would most improve reasoning: claim, evidence, analysis, or organization?",
      improvement: `Target one ${skill} move instead of revising everything at once.`,
      nextStep: "Choose one paragraph or sentence and make a focused revision plan.",
      strength: "You have enough work to make a meaningful revision choice.",
    },
    sentence_check: {
      guidingQuestion: "Does this sentence advance the claim, explain evidence, or clarify reasoning?",
      improvement: "Check for precision, logic, and connection to the surrounding paragraph.",
      nextStep: "Revise one sentence for purpose, then read it with the sentence before and after.",
      strength: "You are treating sentence clarity as part of the argument.",
    },
    stronger_word: {
      guidingQuestion: "Which word would make the tone more precise for this assignment?",
      improvement: "Choose vocabulary that clarifies the idea rather than decorating it.",
      nextStep: "Replace one imprecise word and check that the meaning is still yours.",
      strength: "You are refining style with control.",
    },
  };

  if (audience === "elementary") {
    return elementary[action];
  }

  if (audience === "middle") {
    return middle[action];
  }

  return high[action];
}

function createResponse(
  context: AiCoachContext,
  state: AiCoachResponse["state"],
  flags: AiCoachSafetyFlag[],
): AiCoachResponse {
  const guidance = state === "success" ? getActionGuidance(context.requestedAction, context) : {};

  return aiCoachResponseSchema.parse({
    ...guidance,
    action: context.requestedAction,
    generatedAt: new Date().toISOString(),
    learningMode: true,
    safetyFlags: flags,
    state,
  });
}

export const aiCoachApi = {
  async requestCoaching(input: AiCoachRequestInput): Promise<AiCoachResponse> {
    const scenario = readScenario();
    const prompt = buildAiCoachPrompt(input.context);
    const requestPolicy = evaluateAiCoachRequest(input.context);

    if (scenario === "error") {
      throw new AiCoachApiError("request_failed", "AI coach mock request failed");
    }

    if (scenario === "offline" || input.context.connectionStatus === "offline_cached") {
      throw new AiCoachApiError("offline", "AI coach is unavailable while offline");
    }

    if (scenario === "safety_blocked" || !requestPolicy.allowed) {
      return createResponse(input.context, "safety_blocked", requestPolicy.flags);
    }

    if (scenario === "empty" || requestPolicy.flags.includes("empty_context")) {
      return createResponse(input.context, "empty", requestPolicy.flags);
    }

    if (!prompt.action) {
      throw new AiCoachApiError("request_failed", "AI coach prompt was not created");
    }

    const response = createResponse(input.context, "success", requestPolicy.flags);
    const outputPolicy = evaluateAiCoachOutput(response);

    if (!outputPolicy.allowed) {
      return createResponse(input.context, "safety_blocked", outputPolicy.flags);
    }

    return aiCoachResponseSchema.parse({
      ...response,
      safetyFlags: outputPolicy.flags,
    });
  },
};
