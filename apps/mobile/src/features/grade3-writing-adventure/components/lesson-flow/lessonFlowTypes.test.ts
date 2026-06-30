import {
  canProceedToNextStep,
  deserializeGrade3PlanningState,
  getNextLessonStep,
  getPreviousLessonStep,
  serializeGrade3PlanningState,
} from "./lessonFlowTypes";

describe("grade 3 lesson flow helpers", () => {
  it("moves through the focused lesson steps in order", () => {
    expect(getNextLessonStep("read")).toBe("talk");
    expect(getNextLessonStep("talk")).toBe("plan");
    expect(getNextLessonStep("plan")).toBe("write");
    expect(getNextLessonStep("write")).toBe("check");
    expect(getNextLessonStep("check")).toBe("submit");
    expect(getPreviousLessonStep("check")).toBe("write");
  });

  it("requires meaningful typed writing before moving from write to check", () => {
    expect(
      canProceedToNextStep("write", {
        checklist: {},
        checklistItems: ["I checked my capitals."],
        draft: "Hi",
        strongerSentence: "",
      }),
    ).toEqual({ canProceed: false, reason: "draft" });

    expect(
      canProceedToNextStep("write", {
        checklist: {},
        checklistItems: ["I checked my capitals."],
        draft: "Maya found a puppy.",
        strongerSentence: "",
      }),
    ).toEqual({ canProceed: true, reason: null });
  });

  it("allows completed check step without handwriting evidence", () => {
    expect(
      canProceedToNextStep("check", {
        checklist: {
          "I checked my capitals.": true,
          "I checked my ending marks.": true,
        },
        checklistItems: ["I checked my capitals.", "I checked my ending marks."],
        draft: "Maya found a puppy.",
        strongerSentence: "The tiny puppy wagged its tail.",
      }),
    ).toEqual({ canProceed: true, reason: null });
  });

  it("serializes and deserializes planning state", () => {
    const serialized = serializeGrade3PlanningState({
      beginning: "Maya sees a puppy.",
      end: "She helps it go home.",
      middle: "The puppy is lost.",
      talkIdea: "Maybe the puppy needs help.",
    });

    expect(deserializeGrade3PlanningState(serialized)).toEqual({
      beginning: "Maya sees a puppy.",
      end: "She helps it go home.",
      middle: "The puppy is lost.",
      talkIdea: "Maybe the puppy needs help.",
    });
    expect(deserializeGrade3PlanningState("not json")).toEqual({
      beginning: "",
      end: "",
      middle: "",
      talkIdea: "",
    });
  });
});
