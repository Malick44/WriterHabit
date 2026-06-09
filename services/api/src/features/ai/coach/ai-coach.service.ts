import {
  MAX_AI_CANVAS_RECOGNIZED_TEXT_LENGTH,
  MAX_AI_COACH_DRAFT_EXCERPT_LENGTH,
  MAX_AI_COACH_SELECTED_TEXT_LENGTH,
  MAX_AI_COACH_STUDENT_REQUEST_LENGTH,
  type AiCoachRequest,
  type AiCoachResponse,
  type AiCoachServiceResult,
  type AiModelProvider,
  type AiSafetyDecision,
  type AiServiceError,
  type AiUsageLimitDecision,
  createBoundedExcerpt,
  createLocalizedCopy,
} from "../contracts";
import { AiModerationService } from "../moderation/ai-moderation.service";
import { MockAiProvider } from "../providers/mock-ai-provider";
import { AiPromptBuilderService } from "../prompts/ai-prompt-builder.service";
import { AiSafetyPolicyService } from "../safety/ai-safety-policy.service";
import { AiUsageLimitService } from "../usage/ai-usage-limit.service";

interface AiCoachServiceDependencies {
  moderation?: AiModerationService;
  now?: () => string;
  provider?: AiModelProvider;
  promptBuilder?: AiPromptBuilderService;
  safetyPolicy?: AiSafetyPolicyService;
  usageLimits?: AiUsageLimitService;
}

function createUsageError(decision: AiUsageLimitDecision): AiServiceError {
  if (decision.reason === "daily_token_budget") {
    return {
      code: "rate_limit.ai_token_budget",
      message: createLocalizedCopy(
        "errors.rateLimit.aiTokenBudget",
        "Coaching is paused because today's AI budget has been reached.",
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
    code: "rate_limit.ai_daily_limit",
    message: createLocalizedCopy("errors.rateLimit.aiDailyLimit", "You have reached today's coaching limit."),
    retryable: false,
  };
}

function normalizeRequest(request: AiCoachRequest): AiCoachRequest {
  return {
    ...request,
    canvasRecognizedText: request.canvasRecognizedText
      ? createBoundedExcerpt(request.canvasRecognizedText, MAX_AI_CANVAS_RECOGNIZED_TEXT_LENGTH)
      : undefined,
    draftExcerpt: createBoundedExcerpt(request.draftExcerpt, MAX_AI_COACH_DRAFT_EXCERPT_LENGTH),
    selectedText: request.selectedText
      ? createBoundedExcerpt(request.selectedText, MAX_AI_COACH_SELECTED_TEXT_LENGTH)
      : undefined,
    studentRequest: request.studentRequest
      ? createBoundedExcerpt(request.studentRequest, MAX_AI_COACH_STUDENT_REQUEST_LENGTH)
      : undefined,
  };
}

export class AiCoachService {
  private readonly moderation: AiModerationService;
  private readonly now: () => string;
  private readonly promptBuilder: AiPromptBuilderService;
  private readonly provider: AiModelProvider;
  private readonly safetyPolicy: AiSafetyPolicyService;
  private readonly usageLimits: AiUsageLimitService;

  constructor(dependencies: AiCoachServiceDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.moderation = dependencies.moderation ?? new AiModerationService(this.now);
    this.promptBuilder = dependencies.promptBuilder ?? new AiPromptBuilderService();
    this.provider = dependencies.provider ?? new MockAiProvider();
    this.safetyPolicy = dependencies.safetyPolicy ?? new AiSafetyPolicyService();
    this.usageLimits = dependencies.usageLimits ?? new AiUsageLimitService();
  }

  async requestCoaching(request: AiCoachRequest): Promise<AiCoachServiceResult> {
    const normalizedRequest = normalizeRequest(request);
    const prompt = this.promptBuilder.buildCoachPrompt(normalizedRequest);
    const safetyDecision = this.safetyPolicy.evaluateCoachRequest(normalizedRequest);
    const inputModeration = this.moderation.moderateCoachInput(normalizedRequest, safetyDecision);
    const usage = this.usageLimits.evaluate({
      inputText: [prompt.system, prompt.user].join(" "),
      maxOutputTokens: prompt.maxOutputTokens,
      operation: "coach",
      snapshot: normalizedRequest.usageSnapshot,
    });

    if (!usage.allowed) {
      return {
        error: createUsageError(usage),
        moderation: {
          input: inputModeration,
          output: null,
        },
        response: null,
        usage,
      };
    }

    if (!safetyDecision.allowed || !inputModeration.allowed) {
      return {
        error: null,
        moderation: {
          input: inputModeration,
          output: null,
        },
        response: this.createSafetyBlockedResponse(normalizedRequest, usage, safetyDecision),
        usage,
      };
    }

    const providerOutput = await this.provider.generateCoachResponse({
      prompt,
      request: normalizedRequest,
      safety: safetyDecision,
      usage,
    });
    const response: AiCoachResponse = {
      ...providerOutput.response,
      generatedAt: this.now(),
      id: `coach-${normalizedRequest.studentAssignmentId}-${normalizedRequest.action}`,
      provider: {
        estimatedTokens: providerOutput.usage,
        kind: this.provider.kind,
        requestId: providerOutput.requestId,
      },
      usage: {
        dailyLimit: usage.dailyLimit,
        requestsToday: usage.requestsToday + 1,
      },
    };
    const outputSafetyDecision = this.safetyPolicy.evaluateCoachOutput(response);
    const outputModeration = this.moderation.moderateCoachOutput(response, outputSafetyDecision);

    if (!outputSafetyDecision.allowed || !outputModeration.allowed) {
      return {
        error: null,
        moderation: {
          input: inputModeration,
          output: outputModeration,
        },
        response: this.createSafetyBlockedResponse(normalizedRequest, usage, outputSafetyDecision),
        usage,
      };
    }

    return {
      error: null,
      moderation: {
        input: inputModeration,
        output: outputModeration,
      },
      response: {
        ...response,
        safetyFlags: outputSafetyDecision.flags,
      },
      usage,
    };
  }

  private createSafetyBlockedResponse(
    request: AiCoachRequest,
    usage: AiUsageLimitDecision,
    decision: AiSafetyDecision,
  ): AiCoachResponse {
    return {
      action: request.action,
      coachingMessage:
        decision.message ??
        createLocalizedCopy(
          "aiCoach.safetyBlocked.message",
          "I can help with hints, questions, and revision steps, but I cannot complete the assignment.",
        ),
      generatedAt: this.now(),
      id: `coach-blocked-${request.studentAssignmentId}-${request.action}`,
      nextStep: createLocalizedCopy(
        "aiCoach.safetyBlocked.nextStep",
        "Choose a hint, brainstorming help, sentence check, or revision question.",
      ),
      provider: {
        estimatedTokens: usage.estimatedTokens,
        kind: this.provider.kind,
        requestId: `blocked-${request.studentAssignmentId}-${request.action}`,
      },
      questionForStudent: createLocalizedCopy(
        "aiCoach.safetyBlocked.question",
        "What part do you want to think through yourself first?",
      ),
      safetyFlags: decision.flags,
      status: "safety_blocked",
      title: createLocalizedCopy("aiCoach.safetyBlocked.title", "Let's keep this as coaching"),
      usage: {
        dailyLimit: usage.dailyLimit,
        requestsToday: usage.requestsToday,
      },
    };
  }
}
