import { chunkTextForSynthesis } from "./textChunker";

describe("chunkTextForSynthesis", () => {
  it("returns no chunks for empty or whitespace text", () => {
    expect(chunkTextForSynthesis("")).toEqual([]);
    expect(chunkTextForSynthesis("   \n ")).toEqual([]);
  });

  it("returns short text as a single normalized chunk", () => {
    expect(chunkTextForSynthesis("Great  hook!\nTry adding a detail.")).toEqual([
      "Great hook! Try adding a detail.",
    ]);
  });

  it("splits long text on sentence boundaries within the limit", () => {
    const sentence = "This sentence has exactly eight words in it.";
    const text = Array.from({ length: 12 }, () => sentence).join(" ");
    const chunks = chunkTextForSynthesis(text, 120);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(120);
      expect(chunk.endsWith(".")).toBe(true);
    }
    expect(chunks.join(" ")).toBe(text);
  });

  it("keeps an oversized single sentence whole instead of splitting mid-word", () => {
    const longSentence = `Word ${"and word ".repeat(40)}end.`;
    const normalized = longSentence.replace(/\s+/g, " ").trim();
    expect(chunkTextForSynthesis(longSentence, 80)).toEqual([normalized]);
  });
});
