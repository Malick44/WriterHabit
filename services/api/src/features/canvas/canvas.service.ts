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

// Framework-neutral placeholder for metadata, storage, export, and recognition.
export class CanvasService {}
