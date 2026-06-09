const mockStore = new Map<string, unknown>();

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

import { MAX_FEEDBACK_REVISION_TEXT_LENGTH } from "../types";
import { revisionPersistenceService } from "./revisionPersistenceService";

describe("revisionPersistenceService", () => {
  beforeEach(() => {
    mockStore.clear();
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
});
