import { typography } from "@/design/tokens";

import {
  MAX_FEEDBACK_REVISION_TEXT_LENGTH,
  type FeedbackReview,
  type FeedbackReviewGradeAdaptation,
  type FeedbackReviewResponse,
  type FeedbackReviewViewModel,
  type FeedbackRevisionValidation,
} from "../types";

function normalizeForComparison(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function getFeedbackReviewGradeAdaptation(gradeLevel: number): FeedbackReviewGradeAdaptation {
  const band = typography.getGradeBandForGrade(gradeLevel);

  switch (band) {
    case "elementary":
      return {
        band,
        revisionInputMinHeight: 136,
        showDetailedRubric: false,
        showGrammarDetail: false,
        visibleRubricScoreCount: 2,
      };
    case "high":
      return {
        band,
        revisionInputMinHeight: 220,
        showDetailedRubric: true,
        showGrammarDetail: true,
        visibleRubricScoreCount: 8,
      };
    case "middle":
      return {
        band,
        revisionInputMinHeight: 180,
        showDetailedRubric: true,
        showGrammarDetail: true,
        visibleRubricScoreCount: 4,
      };
  }
}

export function getFeedbackRevisionValidation(
  revisedText: string,
  originalExcerpt: string,
): FeedbackRevisionValidation {
  const trimmed = revisedText.trim();

  if (!trimmed) {
    return {
      canSubmit: false,
      error: "empty_revision",
    };
  }

  if (trimmed.length > MAX_FEEDBACK_REVISION_TEXT_LENGTH) {
    return {
      canSubmit: false,
      error: "too_long",
    };
  }

  if (normalizeForComparison(trimmed) === normalizeForComparison(originalExcerpt)) {
    return {
      canSubmit: false,
      error: "unchanged_revision",
    };
  }

  return {
    canSubmit: true,
    error: null,
  };
}

export function getRubricScoreProgress(review: FeedbackReview): number {
  const earned = review.rubricScores.reduce((total, score) => total + score.score, 0);
  const possible = review.rubricScores.reduce((total, score) => total + score.maxScore, 0);

  return possible > 0 ? earned / possible : 0;
}

export function buildFeedbackReviewViewModel(response: FeedbackReviewResponse): FeedbackReviewViewModel | null {
  if (!response.review) {
    return null;
  }

  const gradeAdaptation = getFeedbackReviewGradeAdaptation(response.gradeLevel);

  return {
    gradeAdaptation,
    isOffline: response.connectionStatus === "offline_cached" || response.review.connectionStatus === "offline_cached",
    progressValue: getRubricScoreProgress(response.review),
    review: response.review,
    visibleGrammarSuggestions: gradeAdaptation.showGrammarDetail
      ? response.review.grammarSuggestions
      : response.review.grammarSuggestions.slice(0, 1),
    visibleRubricScores: response.review.rubricScores.slice(0, gradeAdaptation.visibleRubricScoreCount),
  };
}
