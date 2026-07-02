const mockStore = new Map<string, unknown>();
const mockGetSession = jest.fn();
const mockMaybeSingle = jest.fn();
const mockSubmissionMaybeSingle = jest.fn();
const mockRevisionDraftSelectEqSubmission = jest.fn();
const mockRevisionDraftSelectEqProfile = jest.fn();
const mockRevisionDraftSelect = jest.fn();
const mockRevisionDraftDeleteEqSubmission = jest.fn();
const mockRevisionDraftDeleteEqProfile = jest.fn();
const mockRevisionDraftDelete = jest.fn();
const mockRevisionDraftUpsert = jest.fn();
const mockSubmissionSelectEqProfile = jest.fn();
const mockSubmissionSelectEqId = jest.fn();
const mockSubmissionSelect = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/services/storage/localJsonStorage", () => ({
  localJsonStorage: {
    getItem: jest.fn(async (key: string, fallback: unknown) => mockStore.get(key) ?? fallback),
    removeItem: jest.fn(async (key: string) => {
      mockStore.delete(key);
    }),
    setItem: jest.fn(async (key: string, value: unknown) => {
      mockStore.set(key, value);
    }),
  },
}));

jest.mock("@/core/supabase/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { MAX_FEEDBACK_REVISION_TEXT_LENGTH } from "../types";
import { revisionPersistenceService } from "./revisionPersistenceService";

describe("revisionPersistenceService", () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockMaybeSingle.mockResolvedValue({ data: { id: "student-profile-1" }, error: null });
    mockSubmissionMaybeSingle.mockResolvedValue({ data: { id: "submission-remote" }, error: null });
    mockRevisionDraftSelectEqSubmission.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockRevisionDraftSelectEqProfile.mockReturnValue({ eq: mockRevisionDraftSelectEqSubmission });
    mockRevisionDraftSelect.mockReturnValue({ eq: mockRevisionDraftSelectEqProfile });
    mockRevisionDraftDeleteEqSubmission.mockResolvedValue({ error: null });
    mockRevisionDraftDeleteEqProfile.mockReturnValue({ eq: mockRevisionDraftDeleteEqSubmission });
    mockRevisionDraftDelete.mockReturnValue({ eq: mockRevisionDraftDeleteEqProfile });
    mockRevisionDraftUpsert.mockResolvedValue({ error: null });
    mockSubmissionSelectEqProfile.mockReturnValue({ maybeSingle: mockSubmissionMaybeSingle });
    mockSubmissionSelectEqId.mockReturnValue({ eq: mockSubmissionSelectEqProfile });
    mockSubmissionSelect.mockReturnValue({ eq: mockSubmissionSelectEqId });
    mockFrom.mockImplementation((table: string) => {
      if (table === "student_profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        };
      }

      if (table === "submissions") {
        return {
          select: mockSubmissionSelect,
        };
      }

      if (table === "submission_revision_drafts") {
        return {
          delete: mockRevisionDraftDelete,
          select: mockRevisionDraftSelect,
          upsert: mockRevisionDraftUpsert,
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });
  });

  it("saves and restores a focused revision draft", async () => {
    await revisionPersistenceService.saveRevisionDraft({
      revisedText: "My revised sentence has one clearer detail.",
      studentId: "student-1",
      submissionId: "submission-1",
    });

    await expect(
      revisionPersistenceService.getRevisionDraft({
        studentId: "student-1",
        submissionId: "submission-1",
      }),
    ).resolves.toMatchObject({
      revisedText: "My revised sentence has one clearer detail.",
      studentId: "student-1",
      submissionId: "submission-1",
    });
  });

  it("clamps oversized revision drafts before saving", async () => {
    const saved = await revisionPersistenceService.saveRevisionDraft({
      revisedText: "a".repeat(MAX_FEEDBACK_REVISION_TEXT_LENGTH + 10),
      studentId: "student-1",
      submissionId: "submission-2",
    });

    expect(saved.revisedText).toHaveLength(MAX_FEEDBACK_REVISION_TEXT_LENGTH);
  });

  it("removes submitted revision drafts", async () => {
    await revisionPersistenceService.saveRevisionDraft({
      revisedText: "A temporary revision.",
      studentId: "student-1",
      submissionId: "submission-3",
    });
    await revisionPersistenceService.removeRevisionDraft({
      studentId: "student-1",
      submissionId: "submission-3",
    });

    await expect(
      revisionPersistenceService.getRevisionDraft({
        studentId: "student-1",
        submissionId: "submission-3",
      }),
    ).resolves.toBeNull();
  });

  it("saves signed-in revision drafts to Supabase", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });

    const saved = await revisionPersistenceService.saveRevisionDraft({
      revisedText: "A remote revision draft.",
      studentId: "student-1",
      submissionId: "submission-remote",
    });

    expect(saved.revisedText).toBe("A remote revision draft.");
    expect(mockRevisionDraftUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        revised_text: "A remote revision draft.",
        student_profile_id: "student-profile-1",
        submission_id: "submission-remote",
      }),
      { onConflict: "submission_id" },
    );
    expect(mockStore.size).toBe(0);
  });

  it("restores signed-in revision drafts from Supabase", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { id: "student-profile-1" }, error: null })
      .mockResolvedValueOnce({
        data: {
          client_updated_at: "2026-06-10T12:00:00.000Z",
          revised_text: "Remote restored revision.",
          submission_id: "submission-remote",
          updated_at: "2026-06-10T12:01:00.000Z",
        },
        error: null,
      });

    await expect(
      revisionPersistenceService.getRevisionDraft({
        studentId: "student-1",
        submissionId: "submission-remote",
      }),
    ).resolves.toMatchObject({
      revisedText: "Remote restored revision.",
      submissionId: "submission-remote",
      updatedAt: "2026-06-10T12:00:00.000Z",
    });
  });

  it("removes signed-in revision drafts from Supabase and local recovery", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
    mockStore.set("feedback-revision.student-1.submission-remote", {
      revisedText: "Local recovery.",
      studentId: "student-1",
      submissionId: "submission-remote",
      updatedAt: "2026-06-10T12:00:00.000Z",
    });

    await revisionPersistenceService.removeRevisionDraft({
      studentId: "student-1",
      submissionId: "submission-remote",
    });

    expect(mockRevisionDraftDeleteEqSubmission).toHaveBeenCalledWith("submission_id", "submission-remote");
    expect(mockStore.has("feedback-revision.student-1.submission-remote")).toBe(false);
  });
});
