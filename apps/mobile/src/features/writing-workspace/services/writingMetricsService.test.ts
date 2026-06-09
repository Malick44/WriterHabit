import {
  getWritingMetrics,
  getWritingValidation,
  getWritingWorkspaceGradeAdaptation,
} from "./writingMetricsService";

describe("writingMetricsService", () => {
  it("counts words, sentences, and paragraphs", () => {
    expect(getWritingMetrics("First sentence. Second sentence!\n\nNew paragraph here.")).toEqual({
      paragraphCount: 2,
      sentenceCount: 3,
      wordCount: 7,
    });
  });

  it("blocks empty draft submission", () => {
    expect(getWritingValidation("   ")).toMatchObject({
      canSubmit: false,
      error: "empty_draft",
      metrics: {
        wordCount: 0,
      },
    });
    expect(getWritingValidation("My own draft.")).toMatchObject({
      canSubmit: true,
      error: null,
    });
  });

  it("adapts workspace supports by grade band", () => {
    expect(getWritingWorkspaceGradeAdaptation(3)).toMatchObject({
      band: "elementary",
      showDetailedRubric: false,
      visibleCoachActionCount: 2,
    });
    expect(getWritingWorkspaceGradeAdaptation(10)).toMatchObject({
      band: "high",
      showDetailedRubric: true,
      visibleCoachActionCount: 4,
    });
  });
});
