import {
  type AiCoachRequest,
  type AiCoachResponse,
  type AiSafetyDecision,
  type AiSafetyFlag,
  type FeedbackResponse,
  type ReviewSubmissionRequest,
  compactWhitespace,
  createLocalizedCopy,
  isAiCoachAction,
} from "../contracts";
import { AcademicIntegrityService } from "./academic-integrity.service";

const draftDependentActions = new Set(["check_sentence", "explain_grammar", "suggest_vocabulary", "revision_question"]);

function createAllowedDecision(): AiSafetyDecision {
  return {
    allowed: true,
    flags: [],
    message: null,
    policyCodes: [],
  };
}

function createDeniedDecision(input: {
  code: string;
  fallback: string;
  key: string;
  flags?: AiSafetyFlag[];
}): AiSafetyDecision {
  return {
    allowed: false,
    flags: input.flags ?? [],
    message: createLocalizedCopy(input.key, input.fallback),
    policyCodes: [input.code],
  };
}

function joinLocalizedFallbacks(values: Array<{ fallback: string } | null | undefined>): string {
  return values
    .map((value) => value?.fallback)
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

export class AiSafetyPolicyService {
  private readonly academicIntegrity: AcademicIntegrityService;

  constructor(academicIntegrity = new AcademicIntegrityService()) {
    this.academicIntegrity = academicIntegrity;
  }

  evaluateRawCoachAction(action: string): AiSafetyDecision {
    if (isAiCoachAction(action)) {
      return createAllowedDecision();
    }

    return createDeniedDecision({
      code: "validation.unsupported_ai_action",
      fallback: "Choose a coaching action that helps you think, revise, or ask a question.",
      key: "errors.validation.unsupportedAiAction",
    });
  }

  evaluateCoachRequest(request: AiCoachRequest): AiSafetyDecision {
    const actionDecision = this.evaluateRawCoachAction(request.action);
    const needsText = draftDependentActions.has(request.action);
    const hasStudentText = Boolean(compactWhitespace([request.draftExcerpt, request.selectedText].join(" ")));
    const contextDecision =
      needsText && !hasStudentText
        ? createDeniedDecision({
            code: "validation.empty_submission",
            fallback: "Add a little of your own writing before asking for this kind of coaching.",
            key: "errors.validation.emptySubmission",
          })
        : createAllowedDecision();
    const requestDecision = request.studentRequest
      ? this.academicIntegrity.evaluateText({
          source: "student_request",
          text: request.studentRequest,
        })
      : createAllowedDecision();

    return this.academicIntegrity.mergeDecisions([actionDecision, contextDecision, requestDecision]);
  }

  evaluateReviewRequest(request: ReviewSubmissionRequest): AiSafetyDecision {
    const hasTypedText = Boolean(compactWhitespace(request.typedText));
    const lengthAllowed = request.typedText.length <= 40_000;

    if (!hasTypedText) {
      return createDeniedDecision({
        code: "validation.empty_submission",
        fallback: "Add your own writing before submitting for review.",
        key: "errors.validation.emptySubmission",
      });
    }

    if (!lengthAllowed) {
      return createDeniedDecision({
        code: "validation.text_too_long",
        fallback: "Shorten the text and try again.",
        key: "errors.validation.textTooLong",
      });
    }

    return this.academicIntegrity.evaluateText({
      source: "student_work",
      text: [request.typedText, request.canvasRecognizedText ?? ""].join(" "),
    });
  }

  evaluateCoachOutput(response: AiCoachResponse): AiSafetyDecision {
    return this.academicIntegrity.evaluateText({
      source: "model_output",
      text: joinLocalizedFallbacks([
        response.title,
        response.coachingMessage,
        response.nextStep,
        response.questionForStudent,
      ]),
    });
  }

  evaluateFeedbackOutput(feedback: FeedbackResponse): AiSafetyDecision {
    const rubricNotes = feedback.rubricScores.map((score) => score.coachingNote);
    const grammarCopy = feedback.grammarSuggestions.flatMap((suggestion) => [
      suggestion.title,
      suggestion.explanation,
      suggestion.studentAction,
    ]);

    return this.academicIntegrity.evaluateText({
      source: "model_output",
      text: joinLocalizedFallbacks([
        feedback.assignmentTitle,
        feedback.summary.strength,
        feedback.summary.improvement,
        feedback.summary.nextRevisionTask,
        feedback.revisionTask.instruction,
        feedback.revisionTask.guidingQuestion,
        ...rubricNotes,
        ...grammarCopy,
      ]),
    });
  }
}
