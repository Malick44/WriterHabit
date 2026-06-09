import {
  MAX_AI_CANVAS_RECOGNIZED_TEXT_LENGTH,
  MAX_AI_COACH_DRAFT_EXCERPT_LENGTH,
  MAX_AI_COACH_SELECTED_TEXT_LENGTH,
  MAX_AI_REVIEW_TEXT_LENGTH,
  type AiCoachAction,
  type AiCoachRequest,
  type AiPrompt,
  type GradeBand,
  type ReviewSubmissionRequest,
  compactWhitespace,
  createBoundedExcerpt,
  getDraftMetrics,
  getGradeBandForGrade,
} from "../contracts";

const coreSafetyRules = [
  "Coach the student's thinking instead of supplying a finished response.",
  "Do not write the assignment, finish the draft, or provide a final answer.",
  "Do not rewrite the whole student response as a polished replacement.",
  "Give one strength, one improvement, and one next revision task.",
  "Ask the student to make the revision in their own words.",
] as const;

const coachActionInstructions: Record<AiCoachAction, string> = {
  brainstorm: "Help the student list choices or angles, not a finished paragraph.",
  check_sentence: "Check one sentence-level issue without rewriting the full response.",
  explain_grammar: "Explain the likely grammar pattern and how the student can check it.",
  hint: "Give a small hint that points the student toward their own idea.",
  revision_question: "Ask one focused question that helps the student choose a revision.",
  suggest_vocabulary: "Suggest how to choose a precise word without replacing the student's voice.",
};

function getToneRule(gradeBand: GradeBand): string {
  switch (gradeBand) {
    case "elementary":
      return "Use short, friendly sentences and one step at a time.";
    case "middle":
      return "Use structured paragraph-level feedback about clarity, organization, and revision.";
    case "high":
      return "Use mature feedback about thesis, evidence, analysis, tone, and revision choices.";
  }
}

function getReviewFocusRule(gradeBand: GradeBand): string {
  switch (gradeBand) {
    case "elementary":
      return "Focus on clear details, complete sentences, capitalization, punctuation, and confidence.";
    case "middle":
      return "Focus on paragraph structure, support, transitions, grammar patterns, and revision.";
    case "high":
      return "Focus on claim, evidence, analysis, organization, tone, style, and rubric detail.";
  }
}

function formatRubric(request: Pick<AiCoachRequest | ReviewSubmissionRequest, "rubricCriteria">): string {
  if (request.rubricCriteria.length === 0) {
    return "No rubric criteria were supplied.";
  }

  return request.rubricCriteria
    .map((criterion) => {
      const skill = criterion.skill ? ` Skill: ${criterion.skill}.` : "";

      return `${criterion.id}: ${criterion.label.fallback}. ${criterion.description.fallback}.${skill}`;
    })
    .join(" ");
}

function getCoachContextSummary(request: AiCoachRequest): string {
  const draftMetrics = getDraftMetrics(request.draftExcerpt);
  const selectedText = createBoundedExcerpt(request.selectedText ?? "", MAX_AI_COACH_SELECTED_TEXT_LENGTH);
  const canvasText = createBoundedExcerpt(request.canvasRecognizedText ?? "", MAX_AI_CANVAS_RECOGNIZED_TEXT_LENGTH);

  return [
    `Action: ${request.action}.`,
    `Grade: ${request.gradeLevel}. Writing level: ${request.writingLevel}.`,
    `Draft metrics: ${draftMetrics.wordCount} words, ${draftMetrics.sentenceCount} sentences, ${draftMetrics.paragraphCount} paragraphs.`,
    selectedText ? `Selected text: ${selectedText}.` : "No selected text.",
    canvasText ? `Canvas text excerpt: ${canvasText}.` : "No canvas text excerpt.",
    request.studentRequest
      ? `Student request: ${createBoundedExcerpt(request.studentRequest, 360)}.`
      : "No extra student request.",
  ].join(" ");
}

export class AiPromptBuilderService {
  buildCoachPrompt(request: AiCoachRequest): AiPrompt {
    const gradeBand = getGradeBandForGrade(request.gradeLevel);
    const draftExcerpt = createBoundedExcerpt(request.draftExcerpt, MAX_AI_COACH_DRAFT_EXCERPT_LENGTH);
    const safetyRules = [...coreSafetyRules, coachActionInstructions[request.action], getToneRule(gradeBand)];

    return {
      gradeBand,
      kind: "coach",
      maxOutputTokens: gradeBand === "elementary" ? 220 : 320,
      responseContract: [
        "Return localization-ready copy fields.",
        "Status must be completed or safety_blocked.",
        "Include one coaching message, one next step, and at most one guiding question.",
        "Do not include a replacement draft.",
      ],
      safetyRules,
      system: [
        `You are a writing coach for a Grade ${request.gradeLevel} student.`,
        "Your job is to help the student think, plan, draft, revise, and improve their own writing.",
        safetyRules.join(" "),
      ].join(" "),
      temperature: 0.3,
      user: [
        getCoachContextSummary(request),
        `Draft excerpt: ${draftExcerpt || "No typed draft excerpt was supplied."}`,
        `Rubric: ${formatRubric(request)}`,
      ].join(" "),
    };
  }

  buildReviewPrompt(request: ReviewSubmissionRequest): AiPrompt {
    const gradeBand = getGradeBandForGrade(request.gradeLevel);
    const typedText = createBoundedExcerpt(request.typedText, MAX_AI_REVIEW_TEXT_LENGTH);
    const canvasText = createBoundedExcerpt(request.canvasRecognizedText ?? "", MAX_AI_CANVAS_RECOGNIZED_TEXT_LENGTH);
    const metrics = getDraftMetrics(request.typedText);
    const safetyRules = [...coreSafetyRules, getToneRule(gradeBand), getReviewFocusRule(gradeBand)];

    return {
      gradeBand,
      kind: "review",
      maxOutputTokens: gradeBand === "elementary" ? 700 : gradeBand === "middle" ? 950 : 1_200,
      responseContract: [
        "Return a structured feedback object.",
        "Summary must include exactly one strength, one improvement, and one next revision task.",
        "Revision task must be focused and student-authored.",
        "Rubric scores must use 1-4 scores and coaching notes.",
        "Grammar suggestions must explain the issue and name the student's action.",
        "Do not include a complete replacement draft.",
      ],
      safetyRules,
      system: [
        `You are reviewing student writing for a Grade ${request.gradeLevel} student.`,
        "Give coaching feedback that helps the student revise their own work.",
        safetyRules.join(" "),
      ].join(" "),
      temperature: 0.2,
      user: [
        `Assignment title: ${request.assignmentTitle.fallback}.`,
        `Assignment prompt: ${request.assignmentPrompt.fallback}.`,
        `Assignment type: ${request.assignmentType}. Skills: ${request.skillFocus.join(", ")}.`,
        `Draft metrics: ${metrics.wordCount} words, ${metrics.sentenceCount} sentences, ${metrics.paragraphCount} paragraphs.`,
        `Student text: ${typedText}.`,
        canvasText ? `Canvas text excerpt: ${canvasText}.` : "No canvas text excerpt.",
        `Rubric: ${formatRubric(request)}.`,
        `Locale: ${compactWhitespace(request.locale) || "en"}.`,
      ].join(" "),
    };
  }
}
