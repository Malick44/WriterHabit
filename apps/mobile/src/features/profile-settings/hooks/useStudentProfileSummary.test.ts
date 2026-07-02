jest.mock("@/core/auth/useAuthSession", () => ({
  useAuthSession: () => ({ session: null }),
}));

jest.mock("@/core/supabase/supabaseClient", () => ({
  supabase: {},
}));

import {
  buildStudentProfileSummary,
  calculateProfilePoints,
} from "./useStudentProfileSummary";

describe("student profile summary", () => {
  it("calculates profile points from persisted progress totals", () => {
    expect(
      calculateProfilePoints({
        aiFeedbackApplied: 3,
        assignmentsCompleted: 2,
        handwritingMinutes: 10,
        minutesThisWeek: 40,
        revisionsCompleted: 1,
        wordsWritten: 275,
      }),
    ).toBe(597);
  });

  it("builds level progress and badge counts without fixed fixture data", () => {
    expect(
      buildStudentProfileSummary({
        badgesEarned: 2,
        badgesInReach: 1,
        dailyGoalMinutes: 20,
        totals: {
          aiFeedbackApplied: 1,
          assignmentsCompleted: 3,
          handwritingMinutes: 0,
          minutesThisWeek: 30,
          revisionsCompleted: 2,
          wordsWritten: 300,
        },
      }),
    ).toEqual({
      badgesEarned: 2,
      badgesInReach: 1,
      dailyGoalMinutes: 20,
      level: 3,
      levelProgress: 0.1,
      points: 630,
      xpToNext: 270,
    });
  });
});
