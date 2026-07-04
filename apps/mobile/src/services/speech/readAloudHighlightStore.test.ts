import { normalizeUtteranceText, segmentWordOffset } from "./readAloudHighlightStore";

describe("segmentWordOffset", () => {
  const utterance = normalizeUtteranceText(
    "Strong opening sentence.\n\nTry adding a feeling word. What happens next?",
  );

  it("matches the full utterance at offset zero", () => {
    expect(segmentWordOffset(utterance, utterance)).toEqual({
      offset: 0,
      wordCount: 11,
    });
  });

  it("locates a rendered segment inside a joined utterance", () => {
    const segment = normalizeUtteranceText("Try adding a feeling word.");
    expect(segmentWordOffset(utterance, segment)).toEqual({ offset: 3, wordCount: 5 });
  });

  it("rejects partial-word and absent matches", () => {
    expect(segmentWordOffset("restart the app", "art")).toBeNull();
    expect(segmentWordOffset(utterance, "unrelated text")).toBeNull();
    expect(segmentWordOffset(utterance, "")).toBeNull();
  });
});
