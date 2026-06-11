import type { GradeLevel, WritingSkill } from "@WriterHabit/shared";

import { aiCoachApi } from "../api/aiCoachApi";
import { buildAiCoachPrompt } from "../prompts/coachPrompt";
import { buildAiCoachContext } from "./aiCoachContextService";
import { evaluateAcademicIntegrityText } from "./academicIntegrityService";
import { evaluateAiCoachRequest } from "./aiCoachPolicyService";
import {
  MAX_AI_COACH_DRAFT_EXCERPT_LENGTH,
  type AiCoachAction,
  type AiCoachContext,
  type AiCoachContextBuilderInput,
} from "../types";

const assignment: AiCoachContextBuilderInput["assignment"] = {
  assignmentType: "paragraph_writing",
  id: "daily-paragraph-evidence",
  prompt: "Write a paragraph explaining whether practice or talent matters more when learning a skill.",
  rubric: [
    {
      description: "The first sentence states a focused opinion.",
      id: "topic-sentence",
      label: "Topic sentence",
    },
  ],
  skillFocus: ["clarity", "revision_quality"] as WritingSkill[],
  title: "Support a paragraph idea",
};

function makeContext(overrides: Partial<AiCoachContextBuilderInput> = {}): AiCoachContext {
  return buildAiCoachContext({
    assignment,
    connectionStatus: "online",
    draftText: "Practice matters because people can improve when they use feedback and keep trying.",
    gradeLevel: 7 as GradeLevel,
    metrics: {
      paragraphCount: 1,
      sentenceCount: 1,
      wordCount: 13,
    },
    requestedAction: "revision_help",
    studentId: "student-test",
    ...overrides,
  });
}

describe("aiCoachPolicyService", () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_WriterHabit_AI_COACH_SCENARIO;
  });

  it("builds bounded AI coach context for a request", () => {
    const context = makeContext({
      draftText: "word ".repeat(500),
      requestedAction: "hint",
    });

    expect(context.draftExcerpt.length).toBeLessThanOrEqual(MAX_AI_COACH_DRAFT_EXCERPT_LENGTH);
    expect(context.writingLevel).toBe("middle");
    expect(context.skillFocus).toEqual(["clarity", "revision_quality"]);
  });

  it("blocks assignment-completion intent before API response generation", () => {
    const completionRequest = ["write", "my", "essay"].join(" ");
    const context = makeContext({
      requestedAction: "hint",
      studentRequest: completionRequest,
    });

    expect(evaluateAiCoachRequest(context)).toMatchObject({
      allowed: false,
      flags: ["assignment_completion_request"],
      policyCodes: ["ai_safety.assignment_completion_request"],
    });
  });

  it("redirects cheating-oriented requests to approved coaching actions", () => {
    const decision = evaluateAcademicIntegrityText({
      source: "student_request",
      text: "Give me the answer and make a final draft.",
    });

    expect(decision).toMatchObject({
      allowed: false,
      flags: ["full_rewrite_request", "answer_request"],
      policyCodes: ["ai_safety.full_rewrite_request", "ai_safety.answer_request"],
    });
    expect(decision.redirects.map((redirect) => redirect.action)).toEqual([
      "revision_help",
      "sentence_check",
      "stronger_word",
      "hint",
      "ask_question",
      "brainstorm",
    ]);
  });

  it("returns empty context for draft-dependent actions without student text", async () => {
    const context = makeContext({
      draftText: "",
      metrics: {
        paragraphCount: 0,
        sentenceCount: 0,
        wordCount: 0,
      },
      requestedAction: "sentence_check",
    });

    await expect(aiCoachApi.requestCoaching({ context })).resolves.toMatchObject({
      action: "sentence_check",
      learningMode: true,
      safetyFlags: ["empty_context"],
      state: "empty",
    });
  });

  it("returns a policy-safe coaching response for every approved action", async () => {
    const actions: AiCoachAction[] = [
      "hint",
      "brainstorm",
      "ask_question",
      "sentence_check",
      "revision_help",
      "explain_mistake",
      "stronger_word",
    ];

    for (const requestedAction of actions) {
      const response = await aiCoachApi.requestCoaching({ context: makeContext({ requestedAction }) });

      expect(response).toMatchObject({
        action: requestedAction,
        learningMode: true,
        safetyFlags: [],
        state: "success",
      });
      expect(response.nextStep).toBeDefined();
      expect(`${response.strength} ${response.improvement} ${response.nextStep}`).not.toMatch(/finished response/i);
    }
  });

  it("builds grade-aware prompts from the same safe context", () => {
    const elementaryPrompt = buildAiCoachPrompt(makeContext({ gradeLevel: 3 as GradeLevel, requestedAction: "hint" }));
    const highPrompt = buildAiCoachPrompt(makeContext({ gradeLevel: 10 as GradeLevel, requestedAction: "revision_help" }));

    expect(elementaryPrompt.rules.join(" ")).toContain("simple explanations");
    expect(highPrompt.rules.join(" ")).toContain("thesis");
  });
});
