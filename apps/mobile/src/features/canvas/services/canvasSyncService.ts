import { z } from "zod";

import { apiClient } from "@/core/api/apiClient";

import {
  INITIAL_CANVAS_CLIENT_VERSION,
  canvasDocumentSchema,
  canvasScenarioSchema,
  type CanvasDetailResponse,
  type CanvasDocument,
  type CanvasListResponse,
  type CanvasScenario,
} from "../types";
import { attachCanvasToAssignment } from "./canvasDocumentService";
import { canvasPersistenceService } from "./canvasPersistenceService";

export const CANVAS_AUTOSAVE_DEBOUNCE_MS = 700;

const canvasConnectionStatusSchema = z.enum(["online", "offline_cached"]);
export const canvasSignedUploadPlaceholderSchema = z.object({
  contentType: z.string().min(1),
  expiresAt: z.string().datetime(),
  method: z.enum(["PUT"]),
  objectPath: z.string().min(1),
  requiredHeaders: z.record(z.string(), z.string()),
  uploadUrl: z.string().min(1),
});

export const canvasBackendMetadataSchema = z.object({
  attachedAt: z.string().datetime().nullable(),
  canvasDocumentId: z.string().min(1),
  clientVersion: z.number().int().nonnegative(),
  previewImageUrl: z.string().nullable(),
  serverVersion: z.number().int().nonnegative(),
  storageObjectPath: z.string().min(1),
  syncedAt: z.string().datetime(),
});

export const canvasExportPlaceholderSchema = z.object({
  canvasDocumentId: z.string().min(1),
  exportId: z.string().min(1),
  format: z.enum(["preview_png", "pdf"]),
  generatedAt: z.string().datetime(),
  previewImageUrl: z.string().nullable(),
  status: z.enum(["queued", "ready", "failed"]),
});

export type CanvasConnectionStatus = z.infer<typeof canvasConnectionStatusSchema>;
export type CanvasBackendSyncStatus = "backend_disabled" | "offline" | "synced" | "sync_failed";
export type CanvasSignedUploadPlaceholder = z.infer<typeof canvasSignedUploadPlaceholderSchema>;
export type CanvasBackendMetadata = z.infer<typeof canvasBackendMetadataSchema>;
export type CanvasExportPlaceholder = z.infer<typeof canvasExportPlaceholderSchema>;

export interface CanvasSyncSaveInput {
  document: CanvasDocument;
  gradeLevel?: number;
  studentId: string;
}

export interface CanvasAttachSyncInput {
  assignmentId: string;
  canvasId: string;
  gradeLevel?: number;
  studentId: string;
}

export interface CanvasSyncSaveResult {
  backendStatus: CanvasBackendSyncStatus;
  document: CanvasDocument;
  exportPlaceholder: CanvasExportPlaceholder | null;
  signedUpload: CanvasSignedUploadPlaceholder | null;
}

export interface CanvasAutosaveScheduler {
  cancel: () => CanvasDocument | null;
  flush: () => Promise<boolean>;
  schedule: (document: CanvasDocument) => void;
}

function isBackendSyncEnabled(): boolean {
  return process.env.EXPO_PUBLIC_WriterHabit_ENABLE_CANVAS_BACKEND_SYNC === "true";
}

export function readCanvasScenario(): CanvasScenario {
  const parsed = canvasScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WriterHabit_CANVAS_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

export function getCanvasConnectionStatus(scenario: CanvasScenario): CanvasConnectionStatus {
  return canvasConnectionStatusSchema.parse(scenario === "offline" ? "offline_cached" : "online");
}

function getClientVersion(document: CanvasDocument): number {
  return document.clientVersion ?? INITIAL_CANVAS_CLIENT_VERSION;
}

function getCanvasObjectPath(document: CanvasDocument): string {
  return `students/${document.studentId}/canvas/${document.id}/v${getClientVersion(document)}.json`;
}

function estimateStrokePayloadSize(document: CanvasDocument): number {
  const pointCount = document.strokes.reduce((total, stroke) => total + stroke.points.length, 0);

  return 512 + document.strokes.length * 160 + pointCount * 64;
}

function getSignedUploadPlaceholder(document: CanvasDocument): CanvasSignedUploadPlaceholder {
  return canvasSignedUploadPlaceholderSchema.parse({
    contentType: "application/json",
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    method: "PUT",
    objectPath: getCanvasObjectPath(document),
    requiredHeaders: {
      "content-type": "application/json",
      "x-WriterHabit-canvas-client-version": String(getClientVersion(document)),
    },
    uploadUrl: `placeholder://canvas-upload/${encodeURIComponent(document.id)}`,
  });
}

function getBackendMetadataPlaceholder(
  document: CanvasDocument,
  signedUpload: CanvasSignedUploadPlaceholder,
): CanvasBackendMetadata {
  const syncedAt = new Date().toISOString();

  return canvasBackendMetadataSchema.parse({
    attachedAt: document.attachedAt ?? null,
    canvasDocumentId: document.id,
    clientVersion: getClientVersion(document),
    previewImageUrl: document.previewImageUrl ?? null,
    serverVersion: Math.max(document.serverVersion ?? 0, getClientVersion(document)),
    storageObjectPath: signedUpload.objectPath,
    syncedAt,
  });
}

function getExportPlaceholder(document: CanvasDocument): CanvasExportPlaceholder {
  return canvasExportPlaceholderSchema.parse({
    canvasDocumentId: document.id,
    exportId: `canvas-export-${document.id}-${getClientVersion(document)}`,
    format: "preview_png",
    generatedAt: new Date().toISOString(),
    previewImageUrl: null,
    status: "queued",
  });
}

async function requestSignedUploadPlaceholder(document: CanvasDocument): Promise<CanvasSignedUploadPlaceholder> {
  const placeholder = getSignedUploadPlaceholder(document);

  if (!isBackendSyncEnabled()) {
    return placeholder;
  }

  const response = await apiClient.post<unknown>(`/canvas-documents/${document.id}/upload-url`, {
    clientVersion: getClientVersion(document),
    contentType: placeholder.contentType,
    fileKind: "stroke-document",
    sizeBytes: estimateStrokePayloadSize(document),
  });

  return canvasSignedUploadPlaceholderSchema.parse(response);
}

async function upsertBackendMetadata(
  document: CanvasDocument,
  signedUpload: CanvasSignedUploadPlaceholder,
): Promise<CanvasBackendMetadata> {
  const placeholder = getBackendMetadataPlaceholder(document, signedUpload);

  if (!isBackendSyncEnabled()) {
    return placeholder;
  }

  const response = await apiClient.put<unknown>(`/canvas-documents/${document.id}`, {
    assignmentId: document.assignmentId ?? null,
    clientVersion: getClientVersion(document),
    previewImageUrl: document.previewImageUrl ?? null,
    storageObjectPath: signedUpload.objectPath,
    strokeCount: document.strokes.length,
    studentId: document.studentId,
    template: document.template,
    title: document.title,
    updatedAt: document.updatedAt,
  });

  return canvasBackendMetadataSchema.parse(response);
}

async function attachBackendCanvas(document: CanvasDocument, assignmentId: string): Promise<void> {
  if (!isBackendSyncEnabled()) {
    return;
  }

  await apiClient.post<unknown>(`/canvas-documents/${document.id}/attach`, {
    assignmentId,
    clientVersion: getClientVersion(document),
    studentId: document.studentId,
  });
}

async function requestPreviewExportPlaceholder(document: CanvasDocument): Promise<CanvasExportPlaceholder> {
  const placeholder = getExportPlaceholder(document);

  if (!isBackendSyncEnabled()) {
    return placeholder;
  }

  const response = await apiClient.post<unknown>(`/canvas-documents/${document.id}/export`, {
    clientVersion: getClientVersion(document),
    format: "preview_png",
    sourceObjectPath: document.storageObjectPath ?? getCanvasObjectPath(document),
  });

  return canvasExportPlaceholderSchema.parse(response);
}

async function markSyncFailed(localDocument: CanvasDocument): Promise<CanvasDocument> {
  return canvasPersistenceService.saveDocument(
    {
      ...localDocument,
      syncStatus: "sync_failed",
    },
    { touchUpdatedAt: false },
  );
}

async function persistSyncedDocument(input: {
  document: CanvasDocument;
  exportPlaceholder: CanvasExportPlaceholder;
  metadata: CanvasBackendMetadata;
}): Promise<CanvasDocument> {
  return canvasPersistenceService.saveDocument(
    canvasDocumentSchema.parse({
      ...input.document,
      exportStatus: input.exportPlaceholder.status === "failed" ? "failed" : input.exportPlaceholder.status,
      lastSyncedAt: input.metadata.syncedAt,
      previewImageUrl: input.exportPlaceholder.previewImageUrl ?? input.document.previewImageUrl,
      serverVersion: input.metadata.serverVersion,
      storageObjectPath: input.metadata.storageObjectPath,
      syncStatus: "saved",
    }),
    { touchUpdatedAt: false },
  );
}

export function createCanvasAutosaveScheduler(input: {
  delayMs?: number;
  save: (document?: CanvasDocument) => Promise<boolean>;
}): CanvasAutosaveScheduler {
  let latestDocument: CanvasDocument | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    const pendingDocument = latestDocument;
    latestDocument = null;

    return pendingDocument;
  };

  const flush = async () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    const documentToSave = latestDocument;
    latestDocument = null;

    return documentToSave ? input.save(documentToSave) : true;
  };

  return {
    cancel,
    flush,
    schedule(document: CanvasDocument) {
      latestDocument = document;

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        const documentToSave = latestDocument;
        timeout = null;
        latestDocument = null;

        if (documentToSave) {
          void input.save(documentToSave);
        }
      }, input.delayMs ?? CANVAS_AUTOSAVE_DEBOUNCE_MS);
    },
  };
}

async function saveCanvasLocalFirst(input: CanvasSyncSaveInput): Promise<CanvasSyncSaveResult> {
  const scenario = readCanvasScenario();
  const localDocument = await canvasPersistenceService.saveDocument({
    ...input.document,
    studentId: input.studentId,
    syncStatus: "local_only",
  });

  if (scenario === "offline") {
    return {
      backendStatus: "offline",
      document: localDocument,
      exportPlaceholder: null,
      signedUpload: null,
    };
  }

  if (scenario === "sync_failed" || scenario === "error") {
    const failedDocument = await markSyncFailed(localDocument);

    return {
      backendStatus: "sync_failed",
      document: failedDocument,
      exportPlaceholder: null,
      signedUpload: null,
    };
  }

  try {
    const signedUpload = await requestSignedUploadPlaceholder(localDocument);
    const metadata = await upsertBackendMetadata(localDocument, signedUpload);

    if (localDocument.assignmentId) {
      await attachBackendCanvas(localDocument, localDocument.assignmentId);
    }

    const exportPlaceholder = await requestPreviewExportPlaceholder({
      ...localDocument,
      storageObjectPath: metadata.storageObjectPath,
    });
    const syncedDocument = await persistSyncedDocument({
      document: localDocument,
      exportPlaceholder,
      metadata,
    });

    return {
      backendStatus: isBackendSyncEnabled() ? "synced" : "backend_disabled",
      document: syncedDocument,
      exportPlaceholder,
      signedUpload,
    };
  } catch {
    const failedDocument = await markSyncFailed(localDocument);

    return {
      backendStatus: "sync_failed",
      document: failedDocument,
      exportPlaceholder: null,
      signedUpload: null,
    };
  }
}

export const canvasSyncService = {
  async attachCanvasToAssignment(input: CanvasAttachSyncInput): Promise<CanvasSyncSaveResult> {
    const document = await canvasPersistenceService.getDocument(input.studentId, input.canvasId);

    if (!document) {
      throw new Error("Canvas document not found");
    }

    const attachedDocument = attachCanvasToAssignment(document, input.assignmentId);

    return saveCanvasLocalFirst({
      document: attachedDocument,
      gradeLevel: input.gradeLevel,
      studentId: input.studentId,
    });
  },

  async saveLocalFirst(input: CanvasSyncSaveInput): Promise<CanvasSyncSaveResult> {
    return saveCanvasLocalFirst(input);
  },

  async getCanvas(input: { canvasId: string; gradeLevel?: number; studentId: string }): Promise<CanvasDetailResponse> {
    const scenario = readCanvasScenario();

    if (scenario === "error") {
      throw new Error("Canvas detail mock error");
    }

    const document = await canvasPersistenceService.getDocument(input.studentId, input.canvasId);

    return {
      connectionStatus: getCanvasConnectionStatus(scenario),
      document,
      generatedAt: new Date().toISOString(),
      studentId: input.studentId,
    };
  },

  async getCanvases(input: { gradeLevel?: number; studentId: string }): Promise<CanvasListResponse> {
    const scenario = readCanvasScenario();

    if (scenario === "error") {
      throw new Error("Canvas list mock error");
    }

    const documents = scenario === "empty" ? [] : await canvasPersistenceService.getDocuments(input.studentId);

    return {
      connectionStatus: getCanvasConnectionStatus(scenario),
      documents,
      generatedAt: new Date().toISOString(),
      studentId: input.studentId,
    };
  },
};
