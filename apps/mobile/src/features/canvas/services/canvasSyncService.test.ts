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

import { addCanvasStroke, createCanvasDocument, createCanvasStroke } from "./canvasDocumentService";
import { canvasPersistenceService } from "./canvasPersistenceService";
import {
  CANVAS_AUTOSAVE_DEBOUNCE_MS,
  canvasSyncService,
  createCanvasAutosaveScheduler,
} from "./canvasSyncService";

describe("canvasSyncService", () => {
  const originalCanvasScenario = process.env.EXPO_PUBLIC_WriterHabit_CANVAS_SCENARIO;
  const originalBackendSync = process.env.EXPO_PUBLIC_WriterHabit_ENABLE_CANVAS_BACKEND_SYNC;

  beforeEach(() => {
    mockStore.clear();
    delete process.env.EXPO_PUBLIC_WriterHabit_CANVAS_SCENARIO;
    delete process.env.EXPO_PUBLIC_WriterHabit_ENABLE_CANVAS_BACKEND_SYNC;
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_WriterHabit_CANVAS_SCENARIO = originalCanvasScenario;
    process.env.EXPO_PUBLIC_WriterHabit_ENABLE_CANVAS_BACKEND_SYNC = originalBackendSync;
  });

  it("saves locally first and records backend placeholder metadata by default", async () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "essay_plan",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const result = await canvasSyncService.saveLocalFirst({
      document,
      studentId: "student-1",
    });
    const restored = await canvasPersistenceService.getDocument("student-1", document.id);

    expect(result.backendStatus).toBe("backend_disabled");
    expect(result.document).toMatchObject({
      exportStatus: "queued",
      storageObjectPath: expect.stringContaining(document.id),
      syncStatus: "saved",
    });
    expect(result.signedUpload?.uploadUrl).toContain("placeholder://canvas-upload/");
    expect(restored).toMatchObject({
      id: document.id,
      syncStatus: "saved",
    });
  });

  it("preserves local strokes when backend sync fails", async () => {
    process.env.EXPO_PUBLIC_WriterHabit_CANVAS_SCENARIO = "sync_failed";
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "mind_map",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const stroke = createCanvasStroke({
      color: "#0F172A",
      point: { x: 0.4, y: 0.5 },
      timestamp: "2026-06-09T09:01:00.000Z",
      tool: "pen",
      width: 5,
    });
    const dirtyDocument = addCanvasStroke(document, stroke);
    const result = await canvasSyncService.saveLocalFirst({
      document: dirtyDocument,
      studentId: "student-1",
    });
    const restored = await canvasPersistenceService.getDocument("student-1", document.id);

    expect(result.backendStatus).toBe("sync_failed");
    expect(result.document.syncStatus).toBe("sync_failed");
    expect(restored?.strokes).toHaveLength(1);
    expect(restored?.strokes[0]?.id).toBe(stroke.id);
  });

  it("attaches a canvas locally before backend sync status is applied", async () => {
    process.env.EXPO_PUBLIC_WriterHabit_CANVAS_SCENARIO = "offline";
    const document = await canvasPersistenceService.saveDocument(
      createCanvasDocument({
        studentId: "student-1",
        template: "lined_paper",
        timestamp: "2026-06-09T09:00:00.000Z",
      }),
    );
    const result = await canvasSyncService.attachCanvasToAssignment({
      assignmentId: "assignment-1",
      canvasId: document.id,
      studentId: "student-1",
    });

    expect(result.backendStatus).toBe("offline");
    expect(result.document).toMatchObject({
      assignmentId: "assignment-1",
      syncStatus: "local_only",
    });
  });

  it("debounces autosave to the latest pending document", async () => {
    jest.useFakeTimers();
    const firstDocument = createCanvasDocument({
      studentId: "student-1",
      template: "blank_page",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const secondDocument = {
      ...firstDocument,
      title: "Latest page",
    };
    const save = jest.fn(async () => true);
    const scheduler = createCanvasAutosaveScheduler({ save });

    scheduler.schedule(firstDocument);
    scheduler.schedule(secondDocument);
    jest.advanceTimersByTime(CANVAS_AUTOSAVE_DEBOUNCE_MS - 1);
    expect(save).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(secondDocument);
    scheduler.cancel();
    jest.useRealTimers();
  });

  it("returns the latest pending autosave document when cancelled", () => {
    jest.useFakeTimers();
    const firstDocument = createCanvasDocument({
      studentId: "student-1",
      template: "blank_page",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const secondDocument = {
      ...firstDocument,
      title: "Cancel keeps this page",
    };
    const save = jest.fn(async () => true);
    const scheduler = createCanvasAutosaveScheduler({ save });

    scheduler.schedule(firstDocument);
    scheduler.schedule(secondDocument);

    expect(scheduler.cancel()).toBe(secondDocument);
    jest.advanceTimersByTime(CANVAS_AUTOSAVE_DEBOUNCE_MS);
    expect(save).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
