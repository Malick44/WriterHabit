import {
  type AiCoachRequest,
  type AiCoachResponse,
  type AiModerationResult,
  type AiSafetyDecision,
  type FeedbackResponse,
  type ReviewSubmissionRequest,
  compactWhitespace,
} from "../contracts";

type AiModerationCategory = AiModerationResult["categories"][number];

function categoriesForDecision(decision: AiSafetyDecision, text: string): AiModerationCategory[] {
  const categories: AiModerationCategory[] = [];

  if (decision.flags.length > 0) {
    categories.push("academic_integrity");
  }

  if (decision.flags.includes("age_inappropriate")) {
    categories.push("age_appropriate");
  }

  if (!compactWhitespace(text)) {
    categories.push("empty_context");
  }

  return categories.filter((category, index) => categories.indexOf(category) === index);
}

export class AiModerationService {
  private readonly now: () => string;

  constructor(now: () => string = () => new Date().toISOString()) {
    this.now = now;
  }

  moderateInput(text: string, safetyDecision: AiSafetyDecision): AiModerationResult {
    return {
      allowed: safetyDecision.allowed,
      categories: categoriesForDecision(safetyDecision, text),
      checkedAt: this.now(),
      direction: "input",
      flags: safetyDecision.flags,
      provider: "deterministic_placeholder",
    };
  }

  moderateOutput(text: string, safetyDecision: AiSafetyDecision): AiModerationResult {
    return {
      allowed: safetyDecision.allowed,
      categories: categoriesForDecision(safetyDecision, text),
      checkedAt: this.now(),
      direction: "output",
      flags: safetyDecision.flags,
      provider: "deterministic_placeholder",
    };
  }

  moderateCoachInput(request: AiCoachRequest, safetyDecision: AiSafetyDecision): AiModerationResult {
    return this.moderateInput(
      [request.studentRequest ?? "", request.selectedText ?? "", request.draftExcerpt, request.canvasRecognizedText ?? ""].join(
        " ",
      ),
      safetyDecision,
    );
  }

  moderateReviewInput(request: ReviewSubmissionRequest, safetyDecision: AiSafetyDecision): AiModerationResult {
    return this.moderateInput([request.typedText, request.canvasRecognizedText ?? ""].join(" "), safetyDecision);
  }

  moderateCoachOutput(response: AiCoachResponse, safetyDecision: AiSafetyDecision): AiModerationResult {
    return this.moderateOutput(
      [
        response.title.fallback,
        response.coachingMessage.fallback,
        response.nextStep.fallback,
        response.questionForStudent?.fallback ?? "",
      ].join(" "),
      safetyDecision,
    );
  }

  moderateFeedbackOutput(feedback: FeedbackResponse, safetyDecision: AiSafetyDecision): AiModerationResult {
    return this.moderateOutput(
      [
        feedback.summary.strength.fallback,
        feedback.summary.improvement.fallback,
        feedback.summary.nextRevisionTask.fallback,
        feedback.revisionTask.instruction.fallback,
        feedback.revisionTask.guidingQuestion.fallback,
        ...feedback.rubricScores.map((score) => score.coachingNote.fallback),
        ...feedback.grammarSuggestions.flatMap((suggestion) => [
          suggestion.title.fallback,
          suggestion.explanation.fallback,
          suggestion.studentAction.fallback,
        ]),
      ].join(" "),
      safetyDecision,
    );
  }
}
