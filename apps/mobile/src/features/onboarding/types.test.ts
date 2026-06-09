import {
  MAX_WRITING_GOALS,
  getCompletedOnboardingProfile,
  getFirstIncompleteOnboardingStep,
  getOnboardingValidationError,
} from "./types";

describe("onboarding validation", () => {
  it("returns the first missing step for incomplete progress", () => {
    expect(getFirstIncompleteOnboardingStep({ writingGoals: [] })).toBe("role");
    expect(getOnboardingValidationError({ role: "student", writingGoals: [] })).toBe("grade_required");
  });

  it("accepts a complete student onboarding profile", () => {
    const result = getCompletedOnboardingProfile({
      confidenceLevel: "steady",
      dailyPracticeMinutes: 15,
      gradeLevel: 7,
      role: "student",
      writingGoals: ["write_paragraphs", "improve_grammar"],
    });

    expect(result.success).toBe(true);
  });

  it("limits writing goals to the configured maximum", () => {
    const result = getCompletedOnboardingProfile({
      confidenceLevel: "confident",
      dailyPracticeMinutes: 20,
      gradeLevel: 10,
      role: "student",
      writingGoals: [
        "write_essays",
        "test_prep",
        "school_assignments",
        "improve_grammar",
        "creative_writing",
      ],
    });

    expect(result.success).toBe(false);
    expect(MAX_WRITING_GOALS).toBe(4);
  });
});
