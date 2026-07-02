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
export type CanvasExportStatus = "not_requested" | "queued" | "ready" | "failed";

export interface CanvasDocumentRecord {
  assignmentId: string | null;
  attachedAt: string | null;
  clientVersion: number;
  createdAt: string;
  exportStatus: CanvasExportStatus;
  id: string;
  objectPath: string | null;
  previewImagePath: string | null;
  recognizedText: string | null;
  recognitionStatus: string;
  serverVersion: number;
  studentAssignmentId: string | null;
  studentProfileId: string;
  strokeCount: number;
  strokes: unknown[];
  syncStatus: CanvasSyncStatus;
  template: CanvasTemplate;
  title: string;
  updatedAt: string;
}

export interface UpsertCanvasDocumentInput {
  assignmentId?: string | null;
  clientVersion: number;
  id: string;
  objectPath?: string | null;
  previewImagePath?: string | null;
  studentAssignmentId?: string | null;
  studentProfileId: string;
  strokes: unknown[];
  syncStatus?: CanvasSyncStatus;
  template: CanvasTemplate;
  title: string;
}
