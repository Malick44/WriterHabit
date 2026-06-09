import {
  MAX_AI_CANVAS_RECOGNIZED_TEXT_LENGTH,
  MAX_AI_REVIEW_TEXT_LENGTH,
  type AiModelProvider,
  type AiReviewJobStatus,
  type AiReviewServiceResult,
  type AiSafetyDecision,
  type AiServiceError,
  type AiUsageLimitDecision,
  type FeedbackResponse,
  type ReviewSubmissionRequest,
  type ReviewSubmissionResponse,
  createBoundedExcerpt,
  createLocalizedCopy,
} from "../contracts";
import { AiModerationService } from "../moderation/ai-moderation.service";
import { MockAiProvider } from "../providers/mock-ai-provider";
import { AiPromptBuilderService } from "../prompts/ai-prompt-builder.service";
import { AiSafetyPolicyService } from "../safety/ai-safety-policy.service";
import { AiUsageLimitService } from "../usage/ai-usage-limit.service";
import { parseStructuredFeedbackPayload } from "./structured-feedback-parser";

interface AiReviewServiceDependencies {
  moderation?: AiModerationService;
  now?: () => string;
  provider?: AiModelProvider;
  promptBuilder?: AiPromptBuilderService;
  safetyPolicy?: AiSafetyPolicyService;
  usageLimits?: AiUsageLimitService;
}

function normalizeRequest(request: ReviewSubmissionRequest): ReviewSubmissionRequest {
  return {
    ...request,
    canvasRecognizedText: request.canvasRecognizedText
      ? createBoundedExcerpt(request.canvasRecognizedText, MAX_AI_CANVAS_RECOGNIZED_TEXT_LENGTH)
      : undefined,
    typedText: createBoundedExcerpt(request.typedText, MAX_AI_REVIEW_TEXT_LENGTH),
  };
}

function createUsageError(decision: AiUsageLimitDecision): AiServiceError {
  if (decision.reason === "daily_token_budget") {
    return {
      code: "rate_limit.ai_token_budget",
      message: createLocalizedCopy(
        "errors.rateLimit.aiTokenBudget",
        "Review is paused because today's AI budget has been reached.",
      ),
      retryable: false,
    };
  }

  if (decision.reason === "single_request_too_large") {
    return {
      code: "validation.text_too_long",
      message: createLocalizedCopy("errors.validation.textTooLong", "Shorten the text and try again."),
      retryable: false,
    };
  }

  return {
    code: "rate_limit.ai_review_limit",
    message: createLocalizedCopy("errors.rateLimit.aiReviewLimit", "You have reached today's review limit."),
    retryable: false,
  };
}

function createPolicyError(decision: AiSafetyDecision): AiServiceError {
  const code = decision.policyCodes[0];

  if (code === "validation.empty_submission") {
    return {
      code: "validation.empty_submission",
      message:
        decision.message ??
        createLocalizedCopy("errors.validation.emptySubmission", "Add your own writing before submitting for review."),
      retryable: false,
    };
  }

  if (code === "validation.text_too_long") {
    return {
      code: "validation.text_too_long",
      message: decision.message ?? createLocalizedCopy("errors.validation.textTooLong", "Shorten the text and try again."),
      retryable: false,
    };
  }

  if (code === "ai_safety.full_rewrite_request") {
    return {
      code: "ai_safety.full_rewrite_request",
      message:
        decision.message ??
        createLocalizedCopy(
          "errors.aiSafety.fullRewriteRequest",
          "I can suggest revisions, but your final draft needs to be yours.",
        ),
      retryable: false,
    };
  }

  if (code === "ai_safety.answer_request") {
    return {
      code: "ai_safety.answer_request",
      message: decision.message ?? createLocalizedCopy("errors.aiSafety.answerRequest", "I can give a hint or ask a guiding question."),
      retryable: false,
    };
  }

  if (code === "ai_safety.age_inappropriate") {
    return {
      code: "ai_safety.age_inappropriate",
      message: decision.message ?? createLocalizedCopy("errors.aiSafety.ageInappropriate", "Try a school-appropriate request."),
      retryable: false,
    };
  }

  return {
    code: "ai_safety.assignment_completion_request",
    message:
      decision.message ??
      createLocalizedCopy(
        "errors.aiSafety.assignmentCompletionRequest",
        "I can help you think through it, but I cannot do the assignment for you.",
      ),
    retryable: false,
  };
}

export class AiReviewService {
  private readonly moderation: AiModerationService;
  private readonly now: () => string;
  private readonly promptBuilder: AiPromptBuilderService;
  private readonly provider: AiModelProvider;
  private readonly safetyPolicy: AiSafetyPolicyService;
  private readonly usageLimits: AiUsageLimitService;

  constructor(dependencies: AiReviewServiceDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.moderation = dependencies.moderation ?? new AiModerationService(this.now);
    this.promptBuilder = dependencies.promptBuilder ?? new AiPromptBuilderService();
    this.provider = dependencies.provider ?? new MockAiProvider();
    this.safetyPolicy = dependencies.safetyPolicy ?? new AiSafetyPolicyService();
    this.usageLimits = dependencies.usageLimits ?? new AiUsageLimitService();
  }

  async requestReview(request: ReviewSubmissionRequest): Promise<AiReviewServiceResult> {
    const safetyDecision = this.safetyPolicy.evaluateReviewRequest(request);
    const normalizedRequest = normalizeRequest(request);
    const prompt = this.promptBuilder.buildReviewPrompt(normalizedRequest);
    const inputModeration = this.moderation.moderateReviewInput(normalizedRequest, safetyDecision);
    const usage = this.usageLimits.evaluate({
      inputText: [prompt.system, prompt.user].join(" "),
      maxOutputTokens: prompt.maxOutputTokens,
      operation: "review",
      snapshot: normalizedRequest.usageSnapshot,
    });

    if (!usage.allowed) {
      return {
        error: createUsageError(usage),
        feedback: null,
        moderation: {
          input: inputModeration,
          output: null,
        },
        response: this.createReviewResponse(normalizedRequest, "failed", [], null, null),
        usage,
      };
    }

    if (!safetyDecision.allowed || !inputModeration.allowed) {
      const status: AiReviewJobStatus = safetyDecision.flags.length > 0 ? "safety_blocked" : "failed";

      return {
        error: createPolicyError(safetyDecision),
        feedback: null,
        moderation: {
          input: inputModeration,
          output: null,
        },
        response: this.createReviewResponse(normalizedRequest, status, safetyDecision.flags, null, null),
        usage,
      };
    }

    const providerOutput = await this.provider.generateReviewFeedback({
      prompt,
      request: normalizedRequest,
      safety: safetyDecision,
      usage,
    });
    const parsed = parseStructuredFeedbackPayload(providerOutput.rawFeedback);

    if (!parsed.success) {
      return {
        error: {
          code: "ai.review_failed",
          message: createLocalizedCopy(
            "errors.ai.reviewFailed",
            "Review could not be completed right now.",
            { reason: parsed.errors.join("; ") },
          ),
          retryable: true,
        },
        feedback: null,
        moderation: {
          input: inputModeration,
          output: null,
        },
        response: this.createReviewResponse(normalizedRequest, "failed", [], null, providerOutput.requestId),
        usage,
      };
    }

    const feedback: FeedbackResponse = {
      ...parsed.feedback,
      provider: {
        estimatedTokens: providerOutput.usage,
        kind: this.provider.kind,
        requestId: providerOutput.requestId,
      },
    };
    const outputSafetyDecision = this.safetyPolicy.evaluateFeedbackOutput(feedback);
    const outputModeration = this.moderation.moderateFeedbackOutput(feedback, outputSafetyDecision);

    if (!outputSafetyDecision.allowed || !outputModeration.allowed) {
      return {
        error: createPolicyError(outputSafetyDecision),
        feedback: null,
        moderation: {
          input: inputModeration,
          output: outputModeration,
        },
        response: this.createReviewResponse(
          normalizedRequest,
          "safety_blocked",
          outputSafetyDecision.flags,
          null,
          providerOutput.requestId,
        ),
        usage,
      };
    }

    return {
      error: null,
      feedback,
      moderation: {
        input: inputModeration,
        output: outputModeration,
      },
      response: this.createReviewResponse(
        normalizedRequest,
        "completed",
        outputSafetyDecision.flags,
        feedback.id,
        providerOutput.requestId,
      ),
      usage,
    };
  }

  private createReviewResponse(
    request: ReviewSubmissionRequest,
    status: AiReviewJobStatus,
    safetyFlags: ReviewSubmissionResponse["safetyFlags"],
    feedbackId: string | null,
    providerRequestId: string | null,
  ): ReviewSubmissionResponse {
    return {
      feedbackId,
      providerRequestId,
      queuedAt: this.now(),
      reviewJobId: `review-${request.submissionId}-${request.idempotencyKey}`,
      safetyFlags,
      status,
    };
  }
}
