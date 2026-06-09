import type { GradeBand } from "@/design/tokens";
import { z } from "zod";

export const MAX_CANVAS_STROKES = 240;
export const MAX_CANVAS_POINTS_PER_STROKE = 16;
export const MAX_CANVAS_DOCUMENTS = 24;
export const MAX_CANVAS_UNDO_STEPS = 12;

export const canvasToolSchema = z.enum(["pen", "eraser", "highlighter"]);
export type CanvasTool = z.infer<typeof canvasToolSchema>;

export const canvasTemplateSchema = z.enum([
  "blank_page",
  "lined_paper",
  "storyboard",
  "mind_map",
  "essay_plan",
  "vocabulary_web",
  "handwriting_practice",
  "annotate_passage",
]);
export type CanvasTemplate = z.infer<typeof canvasTemplateSchema>;

export const canvasSyncStatusSchema = z.enum(["local_only", "saving", "saved", "sync_failed"]);
export type CanvasSyncStatus = z.infer<typeof canvasSyncStatusSchema>;

export const canvasScenarioSchema = z.enum(["success", "empty", "error", "offline", "sync_failed"]);
export type CanvasScenario = z.infer<typeof canvasScenarioSchema>;

export const canvasPointSchema = z.object({
  pressure: z.number().min(0).max(1).optional(),
  x: z.number().finite(),
  y: z.number().finite(),
});
export type CanvasPoint = z.infer<typeof canvasPointSchema>;

export const canvasStrokeSchema = z.object({
  color: z.string().min(1),
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  opacity: z.number().min(0).max(1).optional(),
  points: z.array(canvasPointSchema).max(MAX_CANVAS_POINTS_PER_STROKE),
  tool: canvasToolSchema,
  width: z.number().positive().max(32),
});
export type CanvasStroke = z.infer<typeof canvasStrokeSchema>;

export const canvasDocumentSchema = z.object({
  assignmentId: z.string().min(1).optional(),
  attachedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  previewImageUrl: z.string().optional(),
  recognizedText: z.string().optional(),
  studentId: z.string().min(1),
  strokes: z.array(canvasStrokeSchema).max(MAX_CANVAS_STROKES),
  syncStatus: canvasSyncStatusSchema,
  template: canvasTemplateSchema,
  title: z.string().min(1),
  updatedAt: z.string().datetime(),
});
export type CanvasDocument = z.infer<typeof canvasDocumentSchema>;

export const canvasDocumentSummarySchema = z.object({
  assignmentId: z.string().min(1).optional(),
  id: z.string().min(1),
  isAttached: z.boolean(),
  strokeCount: z.number().int().nonnegative(),
  syncStatus: canvasSyncStatusSchema,
  template: canvasTemplateSchema,
  title: z.string().min(1),
  updatedAt: z.string().datetime(),
  updatedLabel: z.string().min(1),
});
export type CanvasDocumentSummary = z.infer<typeof canvasDocumentSummarySchema>;

export const canvasListResponseSchema = z.object({
  connectionStatus: z.enum(["online", "offline_cached"]),
  documents: z.array(canvasDocumentSummarySchema),
  generatedAt: z.string().datetime(),
  studentId: z.string().min(1),
});
export type CanvasListResponse = z.infer<typeof canvasListResponseSchema>;

export const canvasDetailResponseSchema = z.object({
  connectionStatus: z.enum(["online", "offline_cached"]),
  document: canvasDocumentSchema.nullable(),
  generatedAt: z.string().datetime(),
  studentId: z.string().min(1),
});
export type CanvasDetailResponse = z.infer<typeof canvasDetailResponseSchema>;

export interface CanvasTemplateDefinition {
  descriptionKey: CanvasTemplateDescriptionKey;
  labelKey: CanvasTemplateLabelKey;
  template: CanvasTemplate;
}

export type CanvasTemplateLabelKey =
  | "canvas.templates.blankPage.label"
  | "canvas.templates.linedPaper.label"
  | "canvas.templates.storyboard.label"
  | "canvas.templates.mindMap.label"
  | "canvas.templates.essayPlan.label"
  | "canvas.templates.vocabularyWeb.label"
  | "canvas.templates.handwritingPractice.label"
  | "canvas.templates.annotatePassage.label";

export type CanvasTemplateDescriptionKey =
  | "canvas.templates.blankPage.description"
  | "canvas.templates.linedPaper.description"
  | "canvas.templates.storyboard.description"
  | "canvas.templates.mindMap.description"
  | "canvas.templates.essayPlan.description"
  | "canvas.templates.vocabularyWeb.description"
  | "canvas.templates.handwritingPractice.description"
  | "canvas.templates.annotatePassage.description";

export interface CanvasGradeAdaptation {
  band: GradeBand;
  showDetailedTemplates: boolean;
  surfaceMinHeight: number;
  visibleTemplateCount: number;
}

export interface CanvasHomeViewModel {
  documents: CanvasDocumentSummary[];
  gradeAdaptation: CanvasGradeAdaptation;
  hasAttachedWork: boolean;
  isEmpty: boolean;
  isOffline: boolean;
}

export interface CanvasWorkspaceViewModel {
  canAttach: boolean;
  canRedo: boolean;
  canUndo: boolean;
  document: CanvasDocument | null;
  gradeAdaptation: CanvasGradeAdaptation;
  isEmpty: boolean;
  isMissing: boolean;
  isOffline: boolean;
  strokeCount: number;
  syncStatus: CanvasSyncStatus;
}
