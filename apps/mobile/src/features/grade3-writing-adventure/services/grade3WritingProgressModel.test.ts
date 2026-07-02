import type { Grade3WritingProgress } from "../types";

import { getGrade3Summary, isGrade3DayUnlocked } from "./grade3WritingProgressModel";

function makeProgress(
  day: number,
  overrides: Partial<Grade3WritingProgress> = {},
): Grade3WritingProgress {
  return {
    checklist: {},
    completed: false,
    day,
    draft: "",
    favoriteSentence: "",
    planning: {
      beginning: "",
      end: "",
      middle: "",
      talkIdea: "",
    },
    strongerSentence: "",
    updatedAt: "2026-06-30T12:00:00.000Z",
    ...overrides,
  };
}

describe("grade3WritingProgressModel", () => {
  it("unlocks only day 1 until the previous day is complete", () => {
    expect(isGrade3DayUnlocked(1, [])).toBe(true);
    expect(isGrade3DayUnlocked(2, [])).toBe(false);
    expect(isGrade3DayUnlocked(2, [makeProgress(1, { completed: true })])).toBe(true);
  });

  it("treats out-of-range or non-integer days as locked", () => {
    const allComplete = [makeProgress(1, { completed: true })];

    expect(isGrade3DayUnlocked(0, allComplete)).toBe(false);
    expect(isGrade3DayUnlocked(-5, allComplete)).toBe(false);
    expect(isGrade3DayUnlocked(31, allComplete)).toBe(false);
    expect(isGrade3DayUnlocked(1.5, allComplete)).toBe(false);
  });

  it("reports an empty summary when nothing is saved yet", () => {
    expect(getGrade3Summary([])).toMatchObject({
      completedDays: 0,
      currentStreakDays: 0,
      draftDays: 0,
      totalDays: 30,
      unlockedDays: 1,
    });
  });

  it("ignores whitespace-only writing when counting draft days", () => {
    const summary = getGrade3Summary([makeProgress(1, { draft: "   " })]);

    expect(summary.draftDays).toBe(0);
  });

  it("breaks the streak at the first incomplete day even with later completions", () => {
    const summary = getGrade3Summary([
      makeProgress(1, { completed: true }),
      makeProgress(2, { completed: true }),
      makeProgress(4, { completed: true }),
    ]);

    expect(summary.currentStreakDays).toBe(2);
    expect(summary.completedDays).toBe(3);
  });

  it("summarizes completed days, drafts, unlocked days, and the ordered streak", () => {
    const summary = getGrade3Summary([
      makeProgress(1, { completed: true, draft: "My handwritten copy" }),
      makeProgress(2, { completed: true, strongerSentence: "A stronger sentence." }),
      makeProgress(3, { favoriteSentence: "My favorite sentence." }),
    ]);

    expect(summary).toMatchObject({
      completedDays: 2,
      currentStreakDays: 2,
      draftDays: 3,
      totalDays: 30,
      unlockedDays: 3,
    });
  });
});
