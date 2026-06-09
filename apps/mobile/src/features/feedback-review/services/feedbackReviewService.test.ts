import {
  getFeedbackReviewGradeAdaptation,
  getFeedbackRevisionValidation,
  getRubricScoreProgress,
} from "./feedbackReviewService";

import type { FeedbackReview } from "../types";

describe("feedbackReviewService", () => {
  it("adapts feedback detail by grade band", () => {
    expect(getFeedbackReviewGradeAdaptation(3)).toMatchObject({
      band: "elementary",
      showDetailedRubric: false,
      visibleRubricScoreCount: 2,
    });
    expect(getFeedbackReviewGradeAdaptation(11)).toMatchObject({
      band: "high",
      showDetailedRubric: true,
      visibleRubricScoreCount: 8,
    });
  });

  it("requires a focused student revision before completion", () => {
    expect(getFeedbackRevisionValidation("   ", "Original sentence.")).toEqual({
      canSubmit: false,
      error: "empty_revision",
    });
    expect(getFeedbackRevisionValidation("Original sentence.", "original sentence.")).toEqual({
      canSubmit: false,
      error: "unchanged_revision",
    });
    expect(getFeedbackRevisionValidation("Original sentence with one clearer detail.", "Original sentence.")).toEqual({
      canSubmit: true,
      error: null,
    });
  });

  it("calculates rubric progress from visible score data", () => {
    const review = {
      rubricScores: [
        { maxScore: 4, score: 3 },
        { maxScore: 4, score: 2 },
      ],
    } as FeedbackReview;

    expect(getRubricScoreProgress(review)).toBe(0.625);
  });
});
