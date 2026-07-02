import { getAttachmentSubmissionText } from "./AssignmentSubmissionScreen";

describe("getAttachmentSubmissionText", () => {
  it("uses extracted or edited attachment text when attachments are present", () => {
    expect(
      getAttachmentSubmissionText({
        attachmentCount: 1,
        responseText: "My uploaded response text.",
      }),
    ).toBe("My uploaded response text.");
  });

  it("falls back to the saved draft when there is no usable attachment text", () => {
    expect(
      getAttachmentSubmissionText({
        attachmentCount: 0,
        responseText: "Typed but no attachment.",
      }),
    ).toBeUndefined();
    expect(
      getAttachmentSubmissionText({
        attachmentCount: 1,
        responseText: "   ",
      }),
    ).toBeUndefined();
  });
});
