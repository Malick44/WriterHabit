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

import { attachCanvasToAssignment, createCanvasDocument } from "./canvasDocumentService";
import { canvasPersistenceService } from "./canvasPersistenceService";

describe("canvasPersistenceService", () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it("saves, indexes, and restores a canvas document", async () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "storyboard",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const saved = await canvasPersistenceService.saveDocument(document);
    const restored = await canvasPersistenceService.getDocument("student-1", saved.id);
    const summaries = await canvasPersistenceService.getDocuments("student-1");

    expect(restored).toMatchObject({
      id: saved.id,
      studentId: "student-1",
      template: "storyboard",
    });
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      id: saved.id,
      strokeCount: 0,
    });
  });

  it("finds an attached document by assignment", async () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "lined_paper",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const attached = attachCanvasToAssignment(document, "assignment-1");

    await canvasPersistenceService.saveDocument(attached);

    await expect(canvasPersistenceService.getAttachedDocument("student-1", "assignment-1")).resolves.toMatchObject({
      assignmentId: "assignment-1",
      id: attached.id,
    });
  });

  it("drops invalid stored documents", async () => {
    mockStore.set("canvas-doc.student-1.bad-doc", { id: "bad-doc" });

    await expect(canvasPersistenceService.getDocument("student-1", "bad-doc")).resolves.toBeNull();
  });
});
