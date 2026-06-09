import { buildPersonalizedPlan } from "./personalizedPlanService";

describe("personalizedPlanService", () => {
  it("creates an elementary sentence-practice plan", () => {
    expect(
      buildPersonalizedPlan({
        confidenceLevel: "getting_started",
        dailyPracticeMinutes: 10,
        gradeLevel: 3,
        role: "student",
        writingGoals: ["improve_spelling"],
      }),
    ).toMatchObject({
      assignmentFocus: "sentence_practice",
      gradeBand: "elementary",
      weeklyPracticeMinutes: 50,
    });
  });

  it("creates a high-school essay-practice plan", () => {
    expect(
      buildPersonalizedPlan({
        confidenceLevel: "confident",
        dailyPracticeMinutes: 30,
        gradeLevel: 11,
        role: "student",
        writingGoals: ["write_essays", "test_prep"],
      }),
    ).toMatchObject({
      assignmentFocus: "essay_practice",
      firstWeekGoals: ["write_essays", "test_prep"],
      gradeBand: "high",
      weeklyPracticeMinutes: 150,
    });
  });
});
