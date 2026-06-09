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
import { MAX_CANVAS_POINTS_PER_STROKE, MAX_CANVAS_STROKES, type CanvasStroke } from "../types";

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

  it("recovers oversized same-student stroke documents after reload", async () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "mind_map",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const oversizedStroke: CanvasStroke = {
      color: "#0F172A",
      createdAt: "2026-06-09T09:00:00.000Z",
      id: "stroke-many-points",
      points: Array.from({ length: MAX_CANVAS_POINTS_PER_STROKE + 8 }, (_, index) => ({
        x: index / 10,
        y: index / 10,
      })),
      tool: "pen",
      width: 4,
    };

    mockStore.set("canvas-doc.student-1.canvas-recovery", {
      ...document,
      id: "canvas-recovery",
      strokes: Array.from({ length: MAX_CANVAS_STROKES + 6 }, (_, index) => ({
        ...oversizedStroke,
        id: `stroke-${index}`,
      })),
    });

    const restored = await canvasPersistenceService.getDocument("student-1", "canvas-recovery");

    expect(restored?.strokes).toHaveLength(MAX_CANVAS_STROKES);
    expect(restored?.strokes[0]?.points).toHaveLength(MAX_CANVAS_POINTS_PER_STROKE);
  });

  it("keeps valid index summaries when one stored summary is malformed", async () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "blank_page",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const saved = await canvasPersistenceService.saveDocument(document);

    mockStore.set("canvas-index.student-1", [
      { id: "bad-summary" },
      {
        assignmentId: saved.assignmentId,
        id: saved.id,
        isAttached: false,
        strokeCount: 0,
        syncStatus: saved.syncStatus,
        template: saved.template,
        title: saved.title,
        updatedAt: saved.updatedAt,
        updatedLabel: "Saved just now",
      },
    ]);

    await expect(canvasPersistenceService.getDocuments("student-1")).resolves.toHaveLength(1);
  });
});
