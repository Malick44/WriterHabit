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

import { MAX_DRAFT_TEXT_LENGTH } from "../types";
import { createWritingDraft, draftPersistenceService } from "./draftPersistenceService";

describe("draftPersistenceService", () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it("saves and restores a validated writing draft", async () => {
    const fallback = createWritingDraft({
      assignmentId: "assignment-1",
      canvasAttachment: null,
      studentId: "student-1",
      timestamp: "2026-06-08T09:00:00.000Z",
    });

    const saved = await draftPersistenceService.saveDraft({
      ...fallback,
      text: "This is my own draft.",
    });
    const restored = await draftPersistenceService.getDraft(fallback);

    expect(restored).toMatchObject({
      assignmentId: "assignment-1",
      studentId: "student-1",
      text: "This is my own draft.",
    });
    expect(saved.updatedAt).not.toBe(fallback.updatedAt);
  });

  it("falls back when stored draft data is invalid", async () => {
    const fallback = createWritingDraft({
      assignmentId: "assignment-2",
      canvasAttachment: null,
      seedText: "Fallback idea",
      studentId: "student-1",
      timestamp: "2026-06-08T09:00:00.000Z",
    });

    mockStore.set("writing-draft.student-1.assignment-2", { text: "missing required fields" });

    await expect(draftPersistenceService.getDraft(fallback)).resolves.toEqual(fallback);
  });

  it("clamps oversized draft text before saving", async () => {
    const fallback = createWritingDraft({
      assignmentId: "assignment-3",
      canvasAttachment: null,
      studentId: "student-1",
    });
    const saved = await draftPersistenceService.saveDraft({
      ...fallback,
      text: "a".repeat(MAX_DRAFT_TEXT_LENGTH + 10),
    });

    expect(saved.text).toHaveLength(MAX_DRAFT_TEXT_LENGTH);
  });
});
