import type { FeedbackWithDetails } from "../data/types";
import { createResourceNotFoundError } from "../runtime/errors";

export function mapFeedbackReviewApiResponse(
  details: FeedbackWithDetails,
  options: { includeRubricScores: boolean } = { includeRubricScores: true },
) {
  const feedback = details.feedback;
  const revisionTask = details.revisionTask;

  if (!revisionTask) {
    throw createResourceNotFoundError({ feedbackId: feedback.id, reason: "revision_task_missing" });
  }

  return {
    assignmentId: details.assignment.id,
    assignmentPrompt: details.assignment.promptFallback,
    assignmentTitle: details.assignment.titleFallback,
    assignmentType: details.assignment.assignmentType,
    connectionStatus: "online" as const,
    createdAt: feedback.createdAt,
    gradeLevel: feedback.gradeLevel,
    grammarSuggestions: details.grammarSuggestions.map((suggestion) => ({
      explanation: suggestion.explanationFallback,
      id: suggestion.id,
      originalExcerpt: suggestion.originalExcerpt,
      studentAction: suggestion.studentActionFallback,
      title: suggestion.titleFallback,
    })),
    id: feedback.id,
    progressEarned: {
      minutes: feedback.progressMinutes,
      points: feedback.progressPoints,
      skill: feedback.progressSkill,
    },
    revisionTask: {
      focusLabel: revisionTask.targetSkill.replace(/_/g, " "),
      guidingQuestion: revisionTask.guidingQuestionFallback,
      id: revisionTask.id,
      instruction: revisionTask.instructionFallback,
      originalExcerpt: revisionTask.originalExcerpt,
      targetSkill: revisionTask.targetSkill,
    },
    rubricScores: options.includeRubricScores
      ? details.rubricScores.map((score) => ({
          coachingNote: score.coachingNoteFallback,
          criterionId: score.criterionId,
          description: score.criterionDescriptionFallback,
          label: score.criterionLabelFallback,
          level: score.level,
          maxScore: 4 as const,
          score: score.score,
        }))
      : [],
    status: "completed" as const,
    studentId: feedback.studentProfileId,
    submissionId: feedback.submissionId,
    submittedTextExcerpt: feedback.submittedTextExcerpt,
    summary: {
      improvement: feedback.improvementFallback,
      nextRevisionTask: feedback.nextRevisionTaskFallback,
      strength: feedback.strengthFallback,
    },
  };
}

export function mapFeedbackResponseApiResponse(
  details: FeedbackWithDetails,
  options: { generatedAt: string; includeRubricScores: boolean },
) {
  return {
    generatedAt: options.generatedAt,
    review: mapFeedbackReviewApiResponse(details, { includeRubricScores: options.includeRubricScores }),
    reviewJobStatus: "completed" as const,
    status: "completed" as const,
    submissionId: details.submission.id,
  };
}

export function mapFeedbackProcessingApiResponse(input: {
  generatedAt: string;
  reviewJobStatus: "queued" | "processing" | "completed" | "failed" | "safety_blocked";
  submissionId: string;
}) {
  return {
    generatedAt: input.generatedAt,
    review: null,
    reviewJobStatus: input.reviewJobStatus,
    status:
      input.reviewJobStatus === "failed" || input.reviewJobStatus === "safety_blocked"
        ? input.reviewJobStatus
        : ("processing" as const),
    submissionId: input.submissionId,
  };
}

export function mapFeedbackToMobileViewModel(input: {
  generatedAt: string;
  gradeLevel: number;
  response: ReturnType<typeof mapFeedbackResponseApiResponse> | ReturnType<typeof mapFeedbackProcessingApiResponse>;
  studentId: string;
}) {
  return {
    connectionStatus: "online" as const,
    generatedAt: input.generatedAt,
    gradeLevel: input.gradeLevel,
    review: input.response.review,
    status: input.response.status === "completed" ? "completed" : input.response.review ? "completed" : "processing",
    studentId: input.studentId,
  };
}
