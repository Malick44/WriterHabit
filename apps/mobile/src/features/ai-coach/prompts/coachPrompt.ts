import { aiCoachPromptSchema, type AiCoachContext, type AiCoachPrompt } from "../types";

const baseRules = [
  "Coach the student's thinking instead of supplying a finished response.",
  "Give one strength, one improvement, and one next task.",
  "Do not rewrite the whole draft or provide a polished submission.",
  "Use age-appropriate language for the student's grade level.",
  "Ask the student to make the revision in their own words.",
];

const actionInstructions: Record<AiCoachContext["requestedAction"], string> = {
  ask_question: "Ask one guiding question that helps the student decide what to do next.",
  brainstorm: "Help the student generate choices, not a finished paragraph.",
  explain_mistake: "Explain the likely mistake and how the student can check it.",
  hint: "Give a small hint that points the student toward their own idea.",
  revision_help: "Choose one focused revision move the student can apply.",
  sentence_check: "Check one sentence-level issue without rewriting the full response.",
  stronger_word: "Suggest how to choose a more precise word without replacing the student's voice.",
};

function getToneInstruction(context: AiCoachContext): string {
  switch (context.writingLevel) {
    case "early_elementary":
      return "Use short sentences, warm wording, and one step at a time.";
    case "upper_elementary":
      return "Use simple explanations focused on complete sentences, details, and punctuation.";
    case "middle":
      return "Use structured feedback about paragraphs, clarity, organization, and revision.";
    case "high":
      return "Use mature feedback about thesis, evidence, analysis, tone, and revision choices.";
  }
}

function summarizeContext(context: AiCoachContext): string {
  const draftSummary =
    context.metrics.wordCount > 0
      ? `${context.metrics.wordCount} words, ${context.metrics.sentenceCount} sentences, ${context.metrics.paragraphCount} paragraphs`
      : "no typed draft yet";
  const canvasSummary = context.canvasContext
    ? `Canvas attached: ${context.canvasContext.title}, ${context.canvasContext.pageCount} page(s).`
    : "No canvas attachment.";

  return [
    `Grade ${context.gradeLevel} ${context.assignmentType}.`,
    `Skill focus: ${context.skillFocus.join(", ")}.`,
    `Draft summary: ${draftSummary}.`,
    canvasSummary,
  ].join(" ");
}

export function buildAiCoachPrompt(context: AiCoachContext): AiCoachPrompt {
  const rules = [...baseRules, actionInstructions[context.requestedAction], getToneInstruction(context)];

  return aiCoachPromptSchema.parse({
    action: context.requestedAction,
    contextSummary: summarizeContext(context),
    rules,
    system: [
      `You are a writing coach for a Grade ${context.gradeLevel} student.`,
      "Your job is to help the student plan, draft, revise, and reflect on their own writing.",
      rules.join(" "),
    ].join(" "),
    user: [
      `Assignment: ${context.assignmentTitle}.`,
      `Prompt: ${context.assignmentPrompt}.`,
      context.draftExcerpt ? `Student draft excerpt: ${context.draftExcerpt}.` : "The student has not typed a draft yet.",
      context.canvasContext?.recognizedTextExcerpt
        ? `Canvas note excerpt: ${context.canvasContext.recognizedTextExcerpt}.`
        : "No recognized canvas text is available.",
      context.studentRequest ? `Student request: ${context.studentRequest}.` : undefined,
    ]
      .filter(Boolean)
      .join(" "),
  });
}
