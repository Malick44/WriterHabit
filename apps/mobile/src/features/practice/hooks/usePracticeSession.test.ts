jest.mock("@/core/supabase/supabaseClient", () => ({
  supabase: {},
}));

import {
  MAX_PRACTICE_EVIDENCE_TEXT_LENGTH,
  normalizePracticeAttachmentCount,
  normalizePracticeEvidenceText,
} from "./usePracticeSession";

describe("practice session evidence normalization", () => {
  it("normalizes bounded practice evidence text", () => {
    expect(normalizePracticeEvidenceText("  I   used handwriting.  ")).toBe(
      "I used handwriting.",
    );
    expect(normalizePracticeEvidenceText("   ")).toBeNull();
    expect(normalizePracticeEvidenceText("x".repeat(1200))).toHaveLength(
      MAX_PRACTICE_EVIDENCE_TEXT_LENGTH,
    );
  });

  it("bounds practice attachment counts", () => {
    expect(normalizePracticeAttachmentCount(-1)).toBe(0);
    expect(normalizePracticeAttachmentCount(3.8)).toBe(3);
    expect(normalizePracticeAttachmentCount(30)).toBe(12);
    expect(normalizePracticeAttachmentCount(Number.NaN)).toBe(0);
  });
});
