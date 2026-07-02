const mockStore = new Map<string, unknown>();
const mockApiPost = jest.fn();
const mockApiPut = jest.fn();
const mockGetApiAccessToken = jest.fn<Promise<string | null>, []>();
const mockStorageUpload = jest.fn();
const mockGetSession = jest.fn();

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

jest.mock("@/core/api/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
    post: (...args: unknown[]) => mockApiPost(...args),
    put: (...args: unknown[]) => mockApiPut(...args),
  },
}));

jest.mock("@/core/api/apiTokenProvider", () => ({
  getApiAccessToken: () => mockGetApiAccessToken(),
}));

jest.mock("@/core/supabase/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockStorageUpload(...args),
      }),
    },
  },
}));

import { addCanvasStroke, createCanvasDocument, createCanvasStroke } from "./canvasDocumentService";
import { canvasPersistenceService } from "./canvasPersistenceService";
import {
  CANVAS_AUTOSAVE_DEBOUNCE_MS,
  canvasBackendMetadataSchema,
  canvasExportPlaceholderSchema,
  canvasSignedUploadPlaceholderSchema,
  canvasSyncService,
  createCanvasAutosaveScheduler,
} from "./canvasSyncService";

describe("canvasSyncService", () => {
  const originalCanvasScenario = process.env.EXPO_PUBLIC_WriterHabit_CANVAS_SCENARIO;
  const originalBackendSync = process.env.EXPO_PUBLIC_WriterHabit_ENABLE_CANVAS_BACKEND_SYNC;

  beforeEach(() => {
    mockStore.clear();
    mockApiPost.mockReset();
    mockApiPut.mockReset();
    mockGetApiAccessToken.mockReset();
    mockGetApiAccessToken.mockResolvedValue(null);
    mockGetSession.mockReset();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockStorageUpload.mockReset();
    mockStorageUpload.mockResolvedValue({ data: null, error: null });
    delete process.env.EXPO_PUBLIC_WriterHabit_CANVAS_SCENARIO;
    delete process.env.EXPO_PUBLIC_WriterHabit_ENABLE_CANVAS_BACKEND_SYNC;
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_WriterHabit_CANVAS_SCENARIO = originalCanvasScenario;
    process.env.EXPO_PUBLIC_WriterHabit_ENABLE_CANVAS_BACKEND_SYNC = originalBackendSync;
  });

  it("saves locally first and records backend placeholder metadata when backend sync is disabled", async () => {
    process.env.EXPO_PUBLIC_WriterHabit_ENABLE_CANVAS_BACKEND_SYNC = "false";
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

  it("uses schema-backed API calls when backend canvas sync is enabled", async () => {
    process.env.EXPO_PUBLIC_WriterHabit_ENABLE_CANVAS_BACKEND_SYNC = "true";
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } }, error: null });
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "essay_plan",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const signedUpload = {
      contentType: "application/json",
      expiresAt: "2026-06-09T09:15:00.000Z",
      method: "PUT",
      objectPath: `user-1/canvas/${document.id}/stroke-document/v1.json`,
      requiredHeaders: {
        "content-type": "application/json",
      },
      uploadUrl: "https://storage.example/upload",
    };
    const metadata = {
      attachedAt: null,
      canvasDocumentId: document.id,
      clientVersion: 1,
      previewImageUrl: null,
      serverVersion: 1,
      storageObjectPath: signedUpload.objectPath,
      syncedAt: "2026-06-09T09:01:00.000Z",
    };
    const exportPlaceholder = {
      canvasDocumentId: document.id,
      exportId: "export-1",
      format: "preview_png",
      generatedAt: "2026-06-09T09:02:00.000Z",
      previewImageUrl: null,
      status: "queued",
    };

    mockApiPost.mockResolvedValueOnce(signedUpload).mockResolvedValueOnce(exportPlaceholder);
    mockApiPut.mockResolvedValueOnce(metadata);

    const result = await canvasSyncService.saveLocalFirst({
      document,
      studentId: "student-1",
    });

    expect(result.backendStatus).toBe("synced");
    expect(mockStorageUpload).toHaveBeenCalledWith(
      signedUpload.objectPath,
      expect.stringContaining(document.id),
      expect.objectContaining({
        contentType: "application/json",
        upsert: true,
      }),
    );
    expect(mockApiPost).toHaveBeenNthCalledWith(
      1,
      `/canvas-documents/${document.id}/upload-url`,
      expect.objectContaining({
        contentType: "application/json",
        fileKind: "stroke-document",
      }),
      { schema: canvasSignedUploadPlaceholderSchema },
    );
    expect(mockApiPut).toHaveBeenCalledWith(
      `/canvas-documents/${document.id}`,
      expect.objectContaining({
        storageObjectPath: signedUpload.objectPath,
        studentId: "student-1",
      }),
      { schema: canvasBackendMetadataSchema },
    );
    expect(mockApiPost).toHaveBeenNthCalledWith(
      2,
      `/canvas-documents/${document.id}/export`,
      expect.objectContaining({
        format: "preview_png",
        sourceObjectPath: signedUpload.objectPath,
      }),
      { schema: canvasExportPlaceholderSchema },
    );
  });

  it("uses backend canvas sync by default for signed-in sessions", async () => {
    mockGetApiAccessToken.mockResolvedValue("access-token");
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: "user-1" } } }, error: null });
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "storyboard",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const signedUpload = {
      contentType: "application/json",
      expiresAt: "2026-06-09T09:15:00.000Z",
      method: "PUT",
      objectPath: `user-1/canvas/${document.id}/stroke-document/v1.json`,
      requiredHeaders: {
        "content-type": "application/json",
      },
      uploadUrl: "https://storage.example/upload",
    };
    const metadata = {
      attachedAt: null,
      canvasDocumentId: document.id,
      clientVersion: 1,
      previewImageUrl: null,
      serverVersion: 1,
      storageObjectPath: signedUpload.objectPath,
      syncedAt: "2026-06-09T09:01:00.000Z",
    };
    const exportPlaceholder = {
      canvasDocumentId: document.id,
      exportId: "export-1",
      format: "preview_png",
      generatedAt: "2026-06-09T09:02:00.000Z",
      previewImageUrl: null,
      status: "queued",
    };

    mockApiPost.mockResolvedValueOnce(signedUpload).mockResolvedValueOnce(exportPlaceholder);
    mockApiPut.mockResolvedValueOnce(metadata);

    const result = await canvasSyncService.saveLocalFirst({
      document,
      studentId: "student-1",
    });

    expect(result.backendStatus).toBe("synced");
    expect(mockApiPost).toHaveBeenCalledWith(
      `/canvas-documents/${document.id}/upload-url`,
      expect.objectContaining({ fileKind: "stroke-document" }),
      { schema: canvasSignedUploadPlaceholderSchema },
    );
    expect(mockApiPut).toHaveBeenCalledWith(
      `/canvas-documents/${document.id}`,
      expect.objectContaining({ studentId: "student-1" }),
      { schema: canvasBackendMetadataSchema },
    );
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
