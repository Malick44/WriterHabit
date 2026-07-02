import {
  defaultGrade3PlanningState,
  deserializeGrade3PlanningState,
  normalizeGrade3PlanningState,
  serializeGrade3PlanningState,
} from "./grade3PlanningState";

describe("grade3PlanningState", () => {
  it("round-trips a planning state through serialize/deserialize", () => {
    const planning = {
      beginning: "Maya finds the lunchbox.",
      end: "They fly home for dinner.",
      middle: "The rocket takes off.",
      talkIdea: "Maybe the lunchbox is magic.",
    };

    expect(deserializeGrade3PlanningState(serializeGrade3PlanningState(planning))).toEqual(planning);
  });

  it("falls back to the default state for missing or invalid JSON", () => {
    expect(deserializeGrade3PlanningState(null)).toEqual(defaultGrade3PlanningState);
    expect(deserializeGrade3PlanningState(undefined)).toEqual(defaultGrade3PlanningState);
    expect(deserializeGrade3PlanningState("not json {")).toEqual(defaultGrade3PlanningState);
    expect(deserializeGrade3PlanningState("[1,2]")).toEqual(defaultGrade3PlanningState);
  });

  it("normalizes non-string fields and drops unknown keys", () => {
    expect(
      normalizeGrade3PlanningState({ beginning: 7, extra: "ignored", talkIdea: "Keep me" }),
    ).toEqual({ ...defaultGrade3PlanningState, talkIdea: "Keep me" });
  });

  it("caps each planning field at the max length", () => {
    const long = "a".repeat(5000);
    const normalized = normalizeGrade3PlanningState({ beginning: long });

    expect(normalized.beginning).toHaveLength(1200);
  });
});
