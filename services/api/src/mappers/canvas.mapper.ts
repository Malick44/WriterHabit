import type { CanvasDocumentRecord } from "../data/types";

export function mapCanvasDocumentApiResponse(record: CanvasDocumentRecord) {
  return {
    assignmentId: record.assignmentId,
    attachedAt: record.attachedAt,
    canvasDocumentId: record.id,
    clientVersion: record.clientVersion,
    createdAt: record.createdAt,
    exportStatus: record.exportStatus,
    previewImageUrl: record.previewImagePath,
    recognizedText: record.recognizedText,
    serverVersion: record.serverVersion,
    storageObjectPath: record.objectPath,
    strokeCount: record.strokeCount,
    strokes: record.strokes,
    syncStatus: record.syncStatus,
    template: record.template,
    title: record.title,
    updatedAt: record.updatedAt,
  };
}

export function mapCanvasSummaryApiResponse(record: CanvasDocumentRecord) {
  return {
    assignmentId: record.assignmentId,
    canvasDocumentId: record.id,
    clientVersion: record.clientVersion,
    isAttached: Boolean(record.assignmentId),
    previewImageUrl: record.previewImagePath,
    strokeCount: record.strokeCount,
    syncStatus: record.syncStatus,
    template: record.template,
    title: record.title,
    updatedAt: record.updatedAt,
  };
}

export function mapCanvasListApiResponse(records: readonly CanvasDocumentRecord[]) {
  return {
    items: records.map((record) => mapCanvasSummaryApiResponse(record)),
    nextCursor: null,
  };
}

export function mapCanvasAttachApiResponse(record: CanvasDocumentRecord) {
  return {
    assignmentId: record.assignmentId,
    attachedAt: record.attachedAt ?? record.updatedAt,
    canvasDocumentId: record.id,
    clientVersion: record.clientVersion,
    syncStatus: "saved" as const,
  };
}

export function mapCanvasUploadUrlApiResponse(input: {
  clientVersion: number;
  contentType: string;
  expiresAt: string;
  objectPath: string;
}) {
  return {
    contentType: input.contentType,
    expiresAt: input.expiresAt,
    method: "PUT" as const,
    objectPath: input.objectPath,
    requiredHeaders: {
      "content-type": input.contentType,
      "x-WriterHabit-canvas-client-version": String(input.clientVersion),
    },
    uploadUrl: `server-managed://${input.objectPath}`,
  };
}

export function mapCanvasExportApiResponse(input: {
  canvasDocumentId: string;
  clientVersion: number;
  format: "preview_png" | "pdf";
  generatedAt: string;
  previewImageUrl: string | null;
}) {
  return {
    canvasDocumentId: input.canvasDocumentId,
    exportId: `canvas-export-${input.canvasDocumentId}-${input.clientVersion}`,
    format: input.format,
    generatedAt: input.generatedAt,
    previewImageUrl: input.previewImageUrl,
    status: "queued" as const,
  };
}

export function mapCanvasListToMobileViewModel(input: {
  generatedAt: string;
  records: readonly CanvasDocumentRecord[];
  studentId: string;
}) {
  return {
    connectionStatus: "online" as const,
    documents: input.records.map((record) => ({
      assignmentId: record.assignmentId ?? undefined,
      id: record.id,
      isAttached: Boolean(record.assignmentId),
      strokeCount: record.strokeCount,
      syncStatus: record.syncStatus,
      template: record.template,
      title: record.title,
      updatedAt: record.updatedAt,
      updatedLabel: "Saved recently",
    })),
    generatedAt: input.generatedAt,
    studentId: input.studentId,
  };
}

export function mapCanvasDetailToMobileViewModel(input: {
  generatedAt: string;
  record: CanvasDocumentRecord | null;
  studentId: string;
}) {
  return {
    connectionStatus: "online" as const,
    document: input.record
      ? {
          assignmentId: input.record.assignmentId ?? undefined,
          attachedAt: input.record.attachedAt ?? undefined,
          clientVersion: input.record.clientVersion,
          createdAt: input.record.createdAt,
          exportStatus: input.record.exportStatus,
          id: input.record.id,
          previewImageUrl: input.record.previewImagePath ?? undefined,
          recognizedText: input.record.recognizedText ?? undefined,
          serverVersion: input.record.serverVersion,
          studentId: input.record.studentProfileId,
          storageObjectPath: input.record.objectPath ?? undefined,
          strokes: input.record.strokes,
          syncStatus: input.record.syncStatus,
          template: input.record.template,
          title: input.record.title,
          updatedAt: input.record.updatedAt,
        }
      : null,
    generatedAt: input.generatedAt,
    studentId: input.studentId,
  };
}
