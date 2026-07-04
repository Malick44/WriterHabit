import { estimateWordTimings, wordIndexAt } from "./wordTimings";

describe("estimateWordTimings", () => {
  it("returns no timings for empty text or invalid duration", () => {
    expect(estimateWordTimings("", 2)).toEqual([]);
    expect(estimateWordTimings("hello world", 0)).toEqual([]);
    expect(estimateWordTimings("hello world", Number.NaN)).toEqual([]);
  });

  it("covers the full duration contiguously in word order", () => {
    const timings = estimateWordTimings("Great hook! Add one more detail.", 3);

    expect(timings.map((t) => t.word)).toEqual(["Great", "hook!", "Add", "one", "more", "detail."]);
    expect(timings[0].startSec).toBe(0);
    expect(timings[timings.length - 1].endSec).toBeCloseTo(3, 6);
    for (let i = 1; i < timings.length; i += 1) {
      expect(timings[i].startSec).toBeCloseTo(timings[i - 1].endSec, 6);
    }
  });

  it("gives longer words a larger share of the duration", () => {
    const [short, long] = estimateWordTimings("a wonderful", 1);
    expect(long.endSec - long.startSec).toBeGreaterThan(short.endSec - short.startSec);
  });
});

describe("wordIndexAt", () => {
  const timings = estimateWordTimings("one two three four", 4);

  it("finds the word containing a position", () => {
    expect(wordIndexAt(timings, 0)).toBe(0);
    expect(wordIndexAt(timings, timings[2].startSec + 0.01)).toBe(2);
  });

  it("clamps trailing silence to the last word and rejects negatives", () => {
    expect(wordIndexAt(timings, 99)).toBe(timings.length - 1);
    expect(wordIndexAt(timings, -0.5)).toBe(-1);
    expect(wordIndexAt([], 1)).toBe(-1);
  });
});
