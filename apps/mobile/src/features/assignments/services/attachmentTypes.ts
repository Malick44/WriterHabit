export type AssignmentAttachmentKind = "image" | "file";

export type ExtractionStatus = "pending" | "extracting" | "done" | "error";

export interface AttachmentExtraction {
  status: ExtractionStatus;
  /** Recognized text once extraction succeeds; empty otherwise. */
  text: string;
}

export interface AssignmentAttachment {
  id: string;
  kind: AssignmentAttachmentKind;
  uri: string;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  extraction: AttachmentExtraction;
}
