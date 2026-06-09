import type { AssignmentType } from "@writewise/shared";

import {
  selectDailyAssignment,
  type DailyAssignmentHistoryItem,
} from "./dailyAssignmentService";

function historyItem(
  assignmentType: AssignmentType,
  completedAt: string,
  assignmentId = `${assignmentType}-${completedAt}`,
): DailyAssignmentHistoryItem {
  return {
    assignmentId,
    assignmentType,
    completedAt,
    difficulty: assignmentType === "essay_writing" ? "challenging" : "moderate",
    skillFocus: assignmentType === "reading_response" ? ["reading_response", "clarity"] : ["organization"],
  };
}

describe("selectDailyAssignment", () => {
  it("selects a grade-appropriate assignment that matches goals and weak skills", () => {
    const result = selectDailyAssignment({
      dailyMinutes: 15,
      goals: ["write_paragraphs"],
      gradeLevel: 7,
      history: [historyItem("reading_response", "2026-06-08")],
      referenceDate: "2026-06-09",
      weakSkills: ["organization", "clarity", "revision_quality"],
    });

    expect(result.assignment.id).toBe("daily-paragraph-evidence");
    expect(result.matchedWeakSkills).toEqual(["organization", "clarity", "revision_quality"]);
    expect(result.reasonCodes).toContain("goal_match");
    expect(result.reasonCodes).toContain("weak_skill_match");
  });

  it("avoids repeating the same assignment type too often", () => {
    const result = selectDailyAssignment({
      dailyMinutes: 15,
      goals: ["write_paragraphs"],
      gradeLevel: 7,
      history: [
        historyItem("paragraph_writing", "2026-06-08", "recent-1"),
        historyItem("paragraph_writing", "2026-06-07", "recent-2"),
        historyItem("grammar_practice", "2026-06-06", "recent-3"),
      ],
      referenceDate: "2026-06-09",
      weakSkills: ["organization", "clarity"],
    });

    expect(result.assignment.assignmentType).not.toBe("paragraph_writing");
    expect(result.recentTypeCount).toBe(0);
    expect(result.reasonCodes).not.toContain("repeat_avoided");
  });

  it("steps difficulty down after inactivity", () => {
    const result = selectDailyAssignment({
      dailyMinutes: 25,
      goals: ["write_essays", "school_assignments"],
      gradeLevel: 10,
      history: [historyItem("essay_writing", "2026-06-02")],
      referenceDate: "2026-06-09",
      weakSkills: ["evidence_usage"],
    });

    expect(result.inactivityDays).toBe(7);
    expect(result.targetDifficulty).toBe("moderate");
    expect(result.assignment.difficulty).toBe("moderate");
    expect(result.reasonCodes).toContain("difficulty_step_down");
  });

  it("steps difficulty up gradually after recent completion consistency", () => {
    const result = selectDailyAssignment({
      dailyMinutes: 25,
      goals: ["write_essays", "school_assignments"],
      gradeLevel: 8,
      history: [
        historyItem("reading_response", "2026-06-08", "recent-1"),
        historyItem("grammar_practice", "2026-06-07", "recent-2"),
        historyItem("paragraph_writing", "2026-06-06", "recent-3"),
        historyItem("reading_response", "2026-06-05", "recent-4"),
      ],
      referenceDate: "2026-06-09",
      weakSkills: ["argument_strength", "organization"],
    });

    expect(result.targetDifficulty).toBe("challenging");
    expect(result.assignment.id).toBe("daily-middle-essay-plan");
    expect(result.reasonCodes).toContain("difficulty_step_up");
  });
});
