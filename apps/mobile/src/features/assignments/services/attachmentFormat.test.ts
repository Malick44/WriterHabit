import { formatAttachmentSize } from "./attachmentFormat";

describe("formatAttachmentSize", () => {
  it("returns null for unknown or invalid sizes", () => {
    expect(formatAttachmentSize(undefined)).toBeNull();
    expect(formatAttachmentSize(-1)).toBeNull();
    expect(formatAttachmentSize(Number.NaN)).toBeNull();
  });

  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatAttachmentSize(512)).toBe("512 B");
    expect(formatAttachmentSize(2048)).toBe("2 KB");
    expect(formatAttachmentSize(1_572_864)).toBe("1.5 MB");
  });
});
