export type CanvasTemplate =
  | "blank_page"
  | "lined_paper"
  | "storyboard"
  | "mind_map"
  | "essay_plan"
  | "vocabulary_web"
  | "handwriting_practice"
  | "annotate_passage";

export type CanvasSyncStatus = "local_only" | "saving" | "saved" | "sync_failed";

export type CanvasFileKind = "stroke-document" | "preview-image" | "export";

export type CanvasExportFormat = "preview_png" | "pdf";

export type CanvasExportStatus = "queued" | "ready" | "failed";

export interface CanvasMetadataRequest {
  assignmentId?: string | null;
  clientVersion: number;
  previewImageUrl?: string | null;
  storageObjectPath: string;
  strokeCount: number;
  studentId: string;
  template: CanvasTemplate;
  title: string;
  updatedAt: string;
}

export interface CanvasMetadataResponse {
  attachedAt: string | null;
  canvasDocumentId: string;
  clientVersion: number;
  previewImageUrl: string | null;
  serverVersion: number;
  storageObjectPath: string;
  syncStatus: "saved";
  syncedAt: string;
}

export interface CanvasSignedUploadRequest {
  clientVersion: number;
  contentType: "application/json" | "image/png" | "application/pdf";
  fileKind: CanvasFileKind;
  sizeBytes?: number;
}

export interface CanvasSignedUploadResponse {
  contentType: string;
  expiresAt: string;
  method: "PUT";
  objectPath: string;
  requiredHeaders: Record<string, string>;
  uploadUrl: string;
}

export interface CanvasAttachRequest {
  assignmentId: string;
  clientVersion: number;
  studentId: string;
}

export interface CanvasAttachResponse {
  assignmentId: string;
  attachedAt: string;
  canvasDocumentId: string;
  clientVersion: number;
  syncStatus: "saved";
}

export interface CanvasExportRequest {
  clientVersion: number;
  format: CanvasExportFormat;
  sourceObjectPath: string;
}

export interface CanvasExportResponse {
  canvasDocumentId: string;
  exportId: string;
  format: CanvasExportFormat;
  generatedAt: string;
  previewImageUrl: string | null;
  status: CanvasExportStatus;
}

export interface CanvasRecognitionRequest {
  clientVersion: number;
  sourceObjectPath: string;
}

export interface CanvasRecognitionResponse {
  canvasDocumentId: string;
  confidence: number | null;
  generatedAt: string;
  recognizedText: string | null;
  status: "queued" | "completed" | "failed";
}
