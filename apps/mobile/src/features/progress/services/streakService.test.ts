import { calculateWritingStreak } from "./streakService";
import type { ProgressDailyActivity } from "../types";

function activity(date: string): ProgressDailyActivity {
  return {
    aiFeedbackApplied: 0,
    assignmentsCompleted: 0,
    date,
    handwritingMinutes: 0,
    minutes: 10,
    revisionsCompleted: 0,
    rubricImprovement: 0,
    skillsPracticed: ["clarity"],
    words: 80,
  };
}

describe("calculateWritingStreak", () => {
  it("keeps an active streak through yesterday when today has not been practiced", () => {
    const streak = calculateWritingStreak({
      activity: [activity("2026-06-06"), activity("2026-06-07"), activity("2026-06-08")],
      referenceDate: "2026-06-09",
    });

    expect(streak).toMatchObject({
      bestDays: 3,
      currentDays: 3,
      daysUntilNextMilestone: 2,
      lastPracticeDate: "2026-06-08",
      nextMilestoneDays: 5,
      practicedToday: false,
      requiresPracticeToday: true,
    });
  });

  it("counts backward from today when the student practiced today", () => {
    const streak = calculateWritingStreak({
      activity: [
        activity("2026-06-04"),
        activity("2026-06-07"),
        activity("2026-06-08"),
        activity("2026-06-09"),
      ],
      referenceDate: "2026-06-09",
    });

    expect(streak.currentDays).toBe(3);
    expect(streak.bestDays).toBe(3);
    expect(streak.practicedToday).toBe(true);
    expect(streak.requiresPracticeToday).toBe(false);
  });

  it("returns zero streak values when there is no practice data", () => {
    const streak = calculateWritingStreak({
      activity: [],
      referenceDate: "2026-06-09",
    });

    expect(streak).toMatchObject({
      bestDays: 0,
      currentDays: 0,
      lastPracticeDate: null,
      nextMilestoneDays: 3,
      practicedToday: false,
      progressValue: 0,
      requiresPracticeToday: false,
    });
  });
});
