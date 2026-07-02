import { z } from "zod";

/**
 * Writing-loop endpoints implemented by registerAssignmentRoutes and
 * registerSubmissionRoutes. When a Database is configured, these are removed
 * from the fail-closed placeholder registrations; without a Database they
 * stay placeholders and keep returning 501 feature.disabled.
 */
export const writingLoopImplementedEndpoints: ReadonlySet<string> = new Set([
  "GET /api/v1/students/:studentId/assignments",
  "GET /api/v1/students/:studentId/daily-assignment",
  "GET /api/v1/assignments/:assignmentId",
  "POST /api/v1/students/:studentId/assignments/:assignmentId/start",
  "GET /api/v1/student-assignments/:studentAssignmentId/draft",
  "PUT /api/v1/student-assignments/:studentAssignmentId/draft",
  "DELETE /api/v1/student-assignments/:studentAssignmentId/draft",
  "POST /api/v1/student-assignments/:studentAssignmentId/submissions",
  "POST /api/v1/ai/review/submissions/:submissionId",
  "GET /api/v1/ai/review/submissions/:submissionId/status",
  "GET /api/v1/submissions/:submissionId",
  "GET /api/v1/submissions/:submissionId/feedback",
  "POST /api/v1/submissions/:submissionId/revisions",
  "GET /api/v1/submissions/:submissionId/revisions",
]);

export const studentAssignmentStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "submitted",
  "reviewing",
  "feedback_ready",
  "revision_in_progress",
  "completed",
]);

export interface LocalizedCopy {
  fallback: string;
  key: string;
}

export interface TextStats {
  paragraphCount: number;
  preview: string;
  sentenceCount: number;
  wordCount: number;
}

const previewMaxLength = 500;
const excerptMaxLength = 1000;

export function computeTextStats(text: string): TextStats {
  const trimmed = text.trim();

  if (!trimmed) {
    return { paragraphCount: 0, preview: "", sentenceCount: 0, wordCount: 0 };
  }

  const wordCount = trimmed.split(/\s+/).length;
  const sentenceCount = trimmed.match(/[.!?]+(?=\s|$)/g)?.length ?? 1;
  const paragraphCount = trimmed
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim().length > 0).length;

  return {
    paragraphCount,
    preview: trimmed.slice(0, previewMaxLength),
    sentenceCount,
    wordCount,
  };
}

export function toExcerpt(text: string): string {
  return text.trim().slice(0, excerptMaxLength);
}

export function localizedCopy(key: string, fallback: string): LocalizedCopy {
  return { fallback, key };
}
