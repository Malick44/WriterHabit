jest.mock("@/core/api/apiClient", () => ({
  apiClient: {},
}));

jest.mock("@/core/supabase/supabaseClient", () => ({
  supabase: {},
}));

import { buildSubmissionAttachmentMetadataRows } from "./assignmentsApi";

describe("buildSubmissionAttachmentMetadataRows", () => {
  it("builds bounded metadata rows without local file URIs", () => {
    const [row] = buildSubmissionAttachmentMetadataRows({
      attachments: [
        {
          extraction: {
            status: "done",
            text: ` ${"recognized ".repeat(160)} `,
          },
          id: "attachment-1",
          kind: "image",
          mimeType: `${"image/jpeg;".repeat(20)}`,
          name: `${"notebook-photo-".repeat(30)}.jpg`,
          sizeBytes: 1234.7,
          uri: "file:///private/local/path/photo.jpg",
        },
      ],
      studentProfileId: "student-profile-1",
      submissionId: "submission-1",
    });

    expect(row).toMatchObject({
      client_attachment_id: "attachment-1",
      extraction_status: "done",
      kind: "image",
      size_bytes: 1234,
      student_profile_id: "student-profile-1",
      submission_id: "submission-1",
    });
    expect(row?.extracted_text_excerpt?.length).toBeLessThanOrEqual(1000);
    expect(row?.mime_type?.length).toBeLessThanOrEqual(120);
    expect(row?.name.length).toBeLessThanOrEqual(240);
    expect(JSON.stringify(row)).not.toContain("file://");
  });
});
