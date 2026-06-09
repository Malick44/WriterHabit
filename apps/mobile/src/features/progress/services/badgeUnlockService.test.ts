import { evaluateBadgeUnlocks } from "./badgeUnlockService";
import type { ProgressStreakSummary, ProgressTotals } from "../types";

function createTotals(overrides: Partial<ProgressTotals> = {}): ProgressTotals {
  return {
    aiFeedbackApplied: 0,
    assignmentsCompleted: 0,
    handwritingMinutes: 0,
    minutesThisWeek: 0,
    revisionsCompleted: 0,
    rubricImprovement: 0,
    weeklyMinutesGoal: 60,
    wordsWritten: 0,
    ...overrides,
  };
}

function createStreak(currentDays: number): ProgressStreakSummary {
  return {
    bestDays: currentDays,
    currentDays,
    daysUntilNextMilestone: Math.max(0, 5 - currentDays),
    lastPracticeDate: currentDays > 0 ? "2026-06-09" : null,
    nextMilestoneDays: currentDays >= 3 ? 5 : 3,
    practicedToday: currentDays > 0,
    progressValue: currentDays >= 3 ? currentDays / 5 : currentDays / 3,
    referenceDate: "2026-06-09",
    requiresPracticeToday: false,
  };
}

describe("evaluateBadgeUnlocks", () => {
  it("unlocks badges from progress totals and marks newly earned badges", () => {
    const badges = evaluateBadgeUnlocks({
      newBadgeIds: ["three_day_streak"],
      streak: createStreak(3),
      totals: createTotals({
        aiFeedbackApplied: 5,
        assignmentsCompleted: 1,
        handwritingMinutes: 30,
        minutesThisWeek: 60,
        revisionsCompleted: 3,
        rubricImprovement: 8,
        wordsWritten: 500,
      }),
    });

    expect(badges.find((badge) => badge.id === "first_assignment")?.status).toBe("unlocked");
    expect(badges.find((badge) => badge.id === "three_day_streak")?.status).toBe("new");
    expect(badges.every((badge) => badge.unlocked)).toBe(true);
  });

  it("keeps locked badges with bounded progress values", () => {
    const badges = evaluateBadgeUnlocks({
      streak: createStreak(1),
      totals: createTotals({
        minutesThisWeek: 30,
        wordsWritten: 250,
      }),
    });

    const weeklyGoal = badges.find((badge) => badge.id === "weekly_goal");
    const wordBuilder = badges.find((badge) => badge.id === "word_builder");

    expect(weeklyGoal?.status).toBe("locked");
    expect(weeklyGoal?.progressValue).toBe(0.5);
    expect(wordBuilder?.status).toBe("locked");
    expect(wordBuilder?.progressValue).toBe(0.5);
  });
});
