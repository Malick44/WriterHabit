export const aiCoachEndpoints = [
  "POST /api/v1/ai/coach/hint",
  "POST /api/v1/ai/coach/brainstorm",
  "POST /api/v1/ai/coach/check-sentence",
  "POST /api/v1/ai/coach/explain-grammar",
  "POST /api/v1/ai/coach/suggest-vocabulary",
  "POST /api/v1/ai/coach/revision-question",
] as const;

export type AiCoachEndpoint = (typeof aiCoachEndpoints)[number];

export const aiReviewEndpoints = [
  "POST /api/v1/ai/review/submissions/:submissionId",
  "GET /api/v1/ai/review/submissions/:submissionId/status",
  "GET /api/v1/submissions/:submissionId/feedback",
  "POST /api/v1/submissions/:submissionId/revisions",
] as const;

export type AiReviewEndpoint = (typeof aiReviewEndpoints)[number];

export const allowedAiCoachActions = [
  "hint",
  "brainstorm",
  "check_sentence",
  "explain_grammar",
  "suggest_vocabulary",
  "revision_question",
] as const;

export type AiCoachAction = (typeof allowedAiCoachActions)[number];

export const aiCanonicalSafetyFlags = [
  "assignment_completion_request",
  "full_rewrite_request",
  "answer_request",
  "age_inappropriate",
] as const;

export type AiSafetyFlag = (typeof aiCanonicalSafetyFlags)[number];

export const writingSkills = [
  "spelling",
  "grammar",
  "punctuation",
  "sentence_structure",
  "vocabulary",
  "organization",
  "creativity",
  "clarity",
  "evidence_usage",
  "argument_strength",
  "revision_quality",
  "handwriting",
  "reading_response",
] as const;

export type WritingSkill = (typeof writingSkills)[number];

export const assignmentTypes = [
  "sentence_practice",
  "paragraph_writing",
  "essay_writing",
  "creative_writing",
  "reading_response",
  "grammar_practice",
  "vocabulary_practice",
  "test_prep",
  "journal",
  "handwriting_practice",
] as const;

export type AssignmentType = (typeof assignmentTypes)[number];

export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type GradeBand = "elementary" | "middle" | "high";

export type AiReviewJobStatus = "queued" | "processing" | "completed" | "failed" | "safety_blocked";

export type AiCoachResponseStatus = "completed" | "safety_blocked";

export type AiProviderKind = "mock";

export type AiServiceOperation = "coach" | "review";

export type AiUsagePlan = "free" | "plus" | "school";

export const MAX_AI_COACH_DRAFT_EXCERPT_LENGTH = 1_000;
export const MAX_AI_COACH_SELECTED_TEXT_LENGTH = 1_000;
export const MAX_AI_COACH_STUDENT_REQUEST_LENGTH = 360;
export const MAX_AI_REVIEW_TEXT_LENGTH = 40_000;
export const MAX_AI_REVIEW_EXCERPT_LENGTH = 1_000;
export const MAX_AI_CANVAS_RECOGNIZED_TEXT_LENGTH = 1_000;

export interface LocalizedCopy {
  key: string;
  params?: Record<string, string | number | boolean>;
  fallback: string;
}

export interface AssignmentRubricCriterion {
  id: string;
  label: LocalizedCopy;
  description: LocalizedCopy;
  maxScore: 4;
  skill?: WritingSkill;
}

export interface AiDraftMetrics {
  paragraphCount: number;
  sentenceCount: number;
  wordCount: number;
}

export interface AiProviderUsageEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AiUsageSnapshot {
  plan: AiUsagePlan;
  coachRequestsToday: number;
  reviewJobsToday: number;
  estimatedTokensToday: number;
}

export interface AiUsageLimitDecision {
  allowed: boolean;
  operation: AiServiceOperation;
  plan: AiUsagePlan;
  requestsToday: number;
  dailyLimit: number;
  estimatedTokens: AiProviderUsageEstimate;
  dailyTokenBudget: number;
  reason:
    | "within_limit"
    | "daily_request_limit"
    | "daily_review_limit"
    | "daily_token_budget"
    | "single_request_too_large";
}

export interface AiModerationResult {
  allowed: boolean;
  checkedAt: string;
  direction: "input" | "output";
  flags: AiSafetyFlag[];
  provider: "deterministic_placeholder";
  categories: Array<"academic_integrity" | "age_appropriate" | "empty_context">;
}

export interface AiSafetyDecision {
  allowed: boolean;
  flags: AiSafetyFlag[];
  policyCodes: string[];
  message: LocalizedCopy | null;
}

export interface AiPrompt {
  gradeBand: GradeBand;
  kind: AiServiceOperation;
  maxOutputTokens: number;
  responseContract: string[];
  safetyRules: string[];
  system: string;
  temperature: number;
  user: string;
}

export interface AiCoachRequest {
  action: AiCoachAction;
  studentId: string;
  studentAssignmentId: string;
  gradeLevel: GradeLevel;
  writingLevel: "getting_started" | "building" | "steady" | "confident";
  draftExcerpt: string;
  selectedText?: string;
  canvasRecognizedText?: string;
  rubricCriteria: AssignmentRubricCriterion[];
  locale: string;
  studentRequest?: string;
  usageSnapshot?: AiUsageSnapshot;
}

export interface AiCoachResponse {
  id: string;
  action: AiCoachAction;
  status: AiCoachResponseStatus;
  safetyFlags: AiSafetyFlag[];
  title: LocalizedCopy;
  coachingMessage: LocalizedCopy;
  nextStep: LocalizedCopy;
  questionForStudent: LocalizedCopy | null;
  usage: {
    requestsToday: number;
    dailyLimit: number;
  };
  provider: {
    kind: AiProviderKind;
    requestId: string;
    estimatedTokens: AiProviderUsageEstimate;
  };
  generatedAt: string;
}

export interface ReviewSubmissionRequest {
  submissionId: string;
  studentId: string;
  gradeLevel: GradeLevel;
  assignmentId: string;
  assignmentTitle: LocalizedCopy;
  assignmentPrompt: LocalizedCopy;
  assignmentType: AssignmentType;
  skillFocus: WritingSkill[];
  rubricId: string;
  rubricCriteria: AssignmentRubricCriterion[];
  typedText: string;
  canvasRecognizedText?: string;
  locale: string;
  idempotencyKey: string;
  usageSnapshot?: AiUsageSnapshot;
}

export interface ReviewSubmissionResponse {
  reviewJobId: string;
  feedbackId: string | null;
  status: AiReviewJobStatus;
  queuedAt: string;
  safetyFlags: AiSafetyFlag[];
  providerRequestId: string | null;
}

export interface FeedbackSummaryContract {
  strength: LocalizedCopy;
  improvement: LocalizedCopy;
  nextRevisionTask: LocalizedCopy;
}

export interface FeedbackRevisionTaskContract {
  id: string;
  instruction: LocalizedCopy;
  targetSkill: WritingSkill;
  guidingQuestion: LocalizedCopy;
  originalExcerpt: string;
}

export type FeedbackRubricLevel = "starting" | "building" | "meeting" | "strong";

export interface FeedbackRubricScoreContract {
  criterionId: string;
  score: 1 | 2 | 3 | 4;
  maxScore: 4;
  level: FeedbackRubricLevel;
  coachingNote: LocalizedCopy;
}

export interface GrammarSuggestionContract {
  id: string;
  title: LocalizedCopy;
  explanation: LocalizedCopy;
  originalExcerpt: string;
  studentAction: LocalizedCopy;
}

export interface FeedbackResponse {
  id: string;
  submissionId: string;
  studentId: string;
  assignmentId: string;
  assignmentTitle: LocalizedCopy;
  submittedTextExcerpt: string;
  summary: FeedbackSummaryContract;
  revisionTask: FeedbackRevisionTaskContract;
  rubricScores: FeedbackRubricScoreContract[];
  grammarSuggestions: GrammarSuggestionContract[];
  progressEarned: {
    minutes: number;
    points: number;
    skill: WritingSkill;
  };
  provider: {
    kind: AiProviderKind;
    requestId: string;
    estimatedTokens: AiProviderUsageEstimate;
  };
  createdAt: string;
}

export interface AiReviewServiceResult {
  response: ReviewSubmissionResponse;
  feedback: FeedbackResponse | null;
  moderation: {
    input: AiModerationResult;
    output: AiModerationResult | null;
  };
  usage: AiUsageLimitDecision;
  error: AiServiceError | null;
}

export interface AiCoachServiceResult {
  response: AiCoachResponse | null;
  moderation: {
    input: AiModerationResult;
    output: AiModerationResult | null;
  };
  usage: AiUsageLimitDecision;
  error: AiServiceError | null;
}

export interface AiServiceError {
  code:
    | "validation.empty_submission"
    | "validation.text_too_long"
    | "validation.unsupported_ai_action"
    | "rate_limit.ai_daily_limit"
    | "rate_limit.ai_review_limit"
    | "rate_limit.ai_token_budget"
    | "ai_safety.assignment_completion_request"
    | "ai_safety.full_rewrite_request"
    | "ai_safety.answer_request"
    | "ai_safety.age_inappropriate"
    | "ai.review_failed";
  message: LocalizedCopy;
  retryable: boolean;
}

export interface AiModelProviderCoachInput {
  prompt: AiPrompt;
  request: AiCoachRequest;
  safety: AiSafetyDecision;
  usage: AiUsageLimitDecision;
}

export interface AiModelProviderReviewInput {
  prompt: AiPrompt;
  request: ReviewSubmissionRequest;
  safety: AiSafetyDecision;
  usage: AiUsageLimitDecision;
}

export interface AiModelProviderCoachOutput {
  requestId: string;
  response: Omit<AiCoachResponse, "id" | "provider" | "usage" | "generatedAt">;
  usage: AiProviderUsageEstimate;
}

export interface AiModelProviderReviewOutput {
  requestId: string;
  rawFeedback: unknown;
  usage: AiProviderUsageEstimate;
}

export interface AiModelProvider {
  kind: AiProviderKind;
  generateCoachResponse(input: AiModelProviderCoachInput): Promise<AiModelProviderCoachOutput>;
  generateReviewFeedback(input: AiModelProviderReviewInput): Promise<AiModelProviderReviewOutput>;
}

export function getGradeBandForGrade(gradeLevel: GradeLevel): GradeBand {
  if (gradeLevel <= 5) {
    return "elementary";
  }

  if (gradeLevel <= 8) {
    return "middle";
  }

  return "high";
}

export function isGradeLevel(value: number): value is GradeLevel {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

export function isAiCoachAction(value: string): value is AiCoachAction {
  return (allowedAiCoachActions as readonly string[]).includes(value);
}

export function isWritingSkill(value: string): value is WritingSkill {
  return (writingSkills as readonly string[]).includes(value);
}

export function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function createBoundedExcerpt(value: string, maxLength: number): string {
  const compacted = compactWhitespace(value);

  if (compacted.length <= maxLength) {
    return compacted;
  }

  return compacted.slice(0, maxLength).trimEnd();
}

export function createLocalizedCopy(
  key: string,
  fallback: string,
  params?: Record<string, string | number | boolean>,
): LocalizedCopy {
  return params ? { fallback, key, params } : { fallback, key };
}

export function estimateTokensFromText(value: string): number {
  return Math.max(1, Math.ceil(value.length / 4));
}

export function getDraftMetrics(text: string): AiDraftMetrics {
  const compacted = compactWhitespace(text);
  const wordCount = compacted ? compacted.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0 : 0;
  const sentenceCount = compacted ? compacted.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.length ?? 0 : 0;
  const paragraphCount = text.trim() ? text.trim().split(/\n{2,}/).length : 0;

  return {
    paragraphCount,
    sentenceCount,
    wordCount,
  };
}
