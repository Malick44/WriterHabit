import type { AssignmentAttachment } from "./attachmentTypes";
import { composeExtractedText } from "./textExtractionService";

function attachment(
  id: string,
  status: AssignmentAttachment["extraction"]["status"],
  text: string,
): AssignmentAttachment {
  return {
    id,
    kind: "image",
    uri: `file://${id}`,
    name: `${id}.jpg`,
    extraction: { status, text },
  };
}

describe("composeExtractedText", () => {
  it("joins only completed extractions in order", () => {
    const result = composeExtractedText([
      attachment("a", "done", "First page."),
      attachment("b", "extracting", "ignored"),
      attachment("c", "done", "Second page."),
    ]);

    expect(result).toBe("First page.\n\nSecond page.");
  });

  it("skips empty or whitespace-only text", () => {
    const result = composeExtractedText([
      attachment("a", "done", "  "),
      attachment("b", "done", "Real text."),
      attachment("c", "error", "should not appear"),
    ]);

    expect(result).toBe("Real text.");
  });

  it("returns an empty string when nothing is extracted", () => {
    expect(composeExtractedText([attachment("a", "pending", "")])).toBe("");
    expect(composeExtractedText([])).toBe("");
  });
});
