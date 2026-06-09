import {
  type AiProviderUsageEstimate,
  type AiServiceOperation,
  type AiUsageLimitDecision,
  type AiUsagePlan,
  type AiUsageSnapshot,
  estimateTokensFromText,
} from "../contracts";

interface AiUsagePlanLimits {
  coachDailyLimit: number;
  dailyTokenBudget: number;
  reviewDailyLimit: number;
  singleCoachTokenLimit: number;
  singleReviewTokenLimit: number;
}

export interface AiUsageLimitInput {
  operation: AiServiceOperation;
  inputText: string;
  maxOutputTokens: number;
  snapshot?: AiUsageSnapshot;
}

const planLimits: Record<AiUsagePlan, AiUsagePlanLimits> = {
  free: {
    coachDailyLimit: 20,
    dailyTokenBudget: 30_000,
    reviewDailyLimit: 3,
    singleCoachTokenLimit: 2_000,
    singleReviewTokenLimit: 12_000,
  },
  plus: {
    coachDailyLimit: 100,
    dailyTokenBudget: 150_000,
    reviewDailyLimit: 10,
    singleCoachTokenLimit: 4_000,
    singleReviewTokenLimit: 24_000,
  },
  school: {
    coachDailyLimit: 200,
    dailyTokenBudget: 300_000,
    reviewDailyLimit: 25,
    singleCoachTokenLimit: 4_000,
    singleReviewTokenLimit: 24_000,
  },
};

function getDefaultSnapshot(): AiUsageSnapshot {
  return {
    coachRequestsToday: 0,
    estimatedTokensToday: 0,
    plan: "free",
    reviewJobsToday: 0,
  };
}

function getUsageEstimate(inputText: string, maxOutputTokens: number): AiProviderUsageEstimate {
  const inputTokens = estimateTokensFromText(inputText);
  const outputTokens = Math.max(1, maxOutputTokens);

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

export class AiUsageLimitService {
  evaluate(input: AiUsageLimitInput): AiUsageLimitDecision {
    const snapshot = input.snapshot ?? getDefaultSnapshot();
    const limits = planLimits[snapshot.plan];
    const estimatedTokens = getUsageEstimate(input.inputText, input.maxOutputTokens);
    const isCoach = input.operation === "coach";
    const requestsToday = isCoach ? snapshot.coachRequestsToday : snapshot.reviewJobsToday;
    const dailyLimit = isCoach ? limits.coachDailyLimit : limits.reviewDailyLimit;
    const singleRequestLimit = isCoach ? limits.singleCoachTokenLimit : limits.singleReviewTokenLimit;

    if (estimatedTokens.totalTokens > singleRequestLimit) {
      return {
        allowed: false,
        dailyLimit,
        dailyTokenBudget: limits.dailyTokenBudget,
        estimatedTokens,
        operation: input.operation,
        plan: snapshot.plan,
        reason: "single_request_too_large",
        requestsToday,
      };
    }

    if (requestsToday >= dailyLimit) {
      return {
        allowed: false,
        dailyLimit,
        dailyTokenBudget: limits.dailyTokenBudget,
        estimatedTokens,
        operation: input.operation,
        plan: snapshot.plan,
        reason: isCoach ? "daily_request_limit" : "daily_review_limit",
        requestsToday,
      };
    }

    if (snapshot.estimatedTokensToday + estimatedTokens.totalTokens > limits.dailyTokenBudget) {
      return {
        allowed: false,
        dailyLimit,
        dailyTokenBudget: limits.dailyTokenBudget,
        estimatedTokens,
        operation: input.operation,
        plan: snapshot.plan,
        reason: "daily_token_budget",
        requestsToday,
      };
    }

    return {
      allowed: true,
      dailyLimit,
      dailyTokenBudget: limits.dailyTokenBudget,
      estimatedTokens,
      operation: input.operation,
      plan: snapshot.plan,
      reason: "within_limit",
      requestsToday,
    };
  }
}
