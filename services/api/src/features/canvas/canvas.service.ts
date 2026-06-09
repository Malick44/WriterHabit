import type {
  CanvasAttachRequest,
  CanvasAttachResponse,
  CanvasExportRequest,
  CanvasExportResponse,
  CanvasMetadataRequest,
  CanvasMetadataResponse,
  CanvasRecognitionRequest,
  CanvasRecognitionResponse,
  CanvasSignedUploadRequest,
  CanvasSignedUploadResponse,
} from "./canvas.contracts";

export const canvasEndpoints = [
  "GET /api/v1/students/:studentId/canvas-documents",
  "POST /api/v1/students/:studentId/canvas-documents",
  "GET /api/v1/canvas-documents/:canvasDocumentId",
  "PUT /api/v1/canvas-documents/:canvasDocumentId",
  "DELETE /api/v1/canvas-documents/:canvasDocumentId",
  "POST /api/v1/canvas-documents/:canvasDocumentId/attach",
  "POST /api/v1/canvas-documents/:canvasDocumentId/export",
  "POST /api/v1/canvas-documents/:canvasDocumentId/recognize-text",
  "POST /api/v1/canvas-documents/:canvasDocumentId/upload-url",
] as const;

export type CanvasEndpoint = (typeof canvasEndpoints)[number];

function getTimestamp(): string {
  return new Date().toISOString();
}

function getObjectPath(input: {
  canvasDocumentId: string;
  clientVersion: number;
  contentType: string;
  fileKind: string;
}): string {
  const extension = input.contentType === "image/png" ? "png" : input.contentType === "application/pdf" ? "pdf" : "json";

  return `canvas/${input.canvasDocumentId}/${input.fileKind}/v${input.clientVersion}.${extension}`;
}

// Framework-neutral placeholder for metadata, storage, export, and recognition.
// A runtime adapter should add auth, validation, persistence, object storage, and
// queue execution around these deterministic contract shapes.
export class CanvasService {
  createSignedUploadPlaceholder(input: {
    canvasDocumentId: string;
    request: CanvasSignedUploadRequest;
  }): CanvasSignedUploadResponse {
    const objectPath = getObjectPath({
      canvasDocumentId: input.canvasDocumentId,
      clientVersion: input.request.clientVersion,
      contentType: input.request.contentType,
      fileKind: input.request.fileKind,
    });

    return {
      contentType: input.request.contentType,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      method: "PUT",
      objectPath,
      requiredHeaders: {
        "content-type": input.request.contentType,
        "x-writewise-canvas-client-version": String(input.request.clientVersion),
      },
      uploadUrl: `placeholder://writewise-storage/${objectPath}`,
    };
  }

  upsertMetadata(input: {
    canvasDocumentId: string;
    request: CanvasMetadataRequest;
    serverVersion?: number;
  }): CanvasMetadataResponse {
    const serverVersion = Math.max(input.serverVersion ?? 0, input.request.clientVersion);

    return {
      attachedAt: null,
      canvasDocumentId: input.canvasDocumentId,
      clientVersion: input.request.clientVersion,
      previewImageUrl: input.request.previewImageUrl ?? null,
      serverVersion,
      storageObjectPath: input.request.storageObjectPath,
      syncStatus: "saved",
      syncedAt: getTimestamp(),
    };
  }

  attachToAssignment(input: {
    canvasDocumentId: string;
    request: CanvasAttachRequest;
  }): CanvasAttachResponse {
    return {
      assignmentId: input.request.assignmentId,
      attachedAt: getTimestamp(),
      canvasDocumentId: input.canvasDocumentId,
      clientVersion: input.request.clientVersion,
      syncStatus: "saved",
    };
  }

  queuePreviewExport(input: {
    canvasDocumentId: string;
    request: CanvasExportRequest;
  }): CanvasExportResponse {
    return {
      canvasDocumentId: input.canvasDocumentId,
      exportId: `canvas-export-${input.canvasDocumentId}-${input.request.clientVersion}`,
      format: input.request.format,
      generatedAt: getTimestamp(),
      previewImageUrl: null,
      status: "queued",
    };
  }

  queueRecognition(input: {
    canvasDocumentId: string;
    request: CanvasRecognitionRequest;
  }): CanvasRecognitionResponse {
    return {
      canvasDocumentId: input.canvasDocumentId,
      confidence: null,
      generatedAt: getTimestamp(),
      recognizedText: null,
      status: "queued",
    };
  }
}
