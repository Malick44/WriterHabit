import { typography } from "@/design/tokens";
import { translate, type TranslationKey } from "@/i18n";

import {
  INITIAL_CANVAS_CLIENT_VERSION,
  MAX_CANVAS_POINTS_PER_STROKE,
  MAX_CANVAS_STROKES,
  MAX_CANVAS_UNDO_STEPS,
  canvasDocumentSchema,
  type CanvasDocument,
  type CanvasDocumentSummary,
  type CanvasGradeAdaptation,
  type CanvasPoint,
  type CanvasStroke,
  type CanvasTemplate,
  type CanvasTemplateDefinition,
  type CanvasTool,
} from "../types";

export const canvasTemplateDefinitions: CanvasTemplateDefinition[] = [
  {
    descriptionKey: "canvas.templates.blankPage.description",
    labelKey: "canvas.templates.blankPage.label",
    template: "blank_page",
  },
  {
    descriptionKey: "canvas.templates.linedPaper.description",
    labelKey: "canvas.templates.linedPaper.label",
    template: "lined_paper",
  },
  {
    descriptionKey: "canvas.templates.storyboard.description",
    labelKey: "canvas.templates.storyboard.label",
    template: "storyboard",
  },
  {
    descriptionKey: "canvas.templates.mindMap.description",
    labelKey: "canvas.templates.mindMap.label",
    template: "mind_map",
  },
  {
    descriptionKey: "canvas.templates.essayPlan.description",
    labelKey: "canvas.templates.essayPlan.label",
    template: "essay_plan",
  },
  {
    descriptionKey: "canvas.templates.vocabularyWeb.description",
    labelKey: "canvas.templates.vocabularyWeb.label",
    template: "vocabulary_web",
  },
  {
    descriptionKey: "canvas.templates.handwritingPractice.description",
    labelKey: "canvas.templates.handwritingPractice.label",
    template: "handwriting_practice",
  },
  {
    descriptionKey: "canvas.templates.annotatePassage.description",
    labelKey: "canvas.templates.annotatePassage.label",
    template: "annotate_passage",
  },
];

const canvasDefaultTitleKeys: Record<CanvasTemplate, TranslationKey> = {
  annotate_passage: "canvas.document.defaultTitles.annotatePassage",
  blank_page: "canvas.document.defaultTitles.blankPage",
  essay_plan: "canvas.document.defaultTitles.essayPlan",
  handwriting_practice: "canvas.document.defaultTitles.handwritingPractice",
  lined_paper: "canvas.document.defaultTitles.linedPaper",
  mind_map: "canvas.document.defaultTitles.mindMap",
  storyboard: "canvas.document.defaultTitles.storyboard",
  vocabulary_web: "canvas.document.defaultTitles.vocabularyWeb",
};

function createCanvasId() {
  return `canvas-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createStrokeId() {
  return `stroke-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function clampPoint(point: CanvasPoint): CanvasPoint {
  return {
    pressure: point.pressure,
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y)),
  };
}

function getNextClientVersion(document: CanvasDocument): number {
  return (document.clientVersion ?? INITIAL_CANVAS_CLIENT_VERSION) + 1;
}

export function getCanvasGradeAdaptation(gradeLevel = 7): CanvasGradeAdaptation {
  const band = typography.getGradeBandForGrade(gradeLevel);

  if (band === "elementary") {
    return {
      band,
      showDetailedTemplates: false,
      surfaceMinHeight: 360,
      visibleTemplateCount: 6,
    };
  }

  if (band === "middle") {
    return {
      band,
      showDetailedTemplates: true,
      surfaceMinHeight: 420,
      visibleTemplateCount: 8,
    };
  }

  return {
    band,
    showDetailedTemplates: true,
    surfaceMinHeight: 460,
    visibleTemplateCount: 8,
  };
}

export function normalizeCanvasDocument(document: CanvasDocument): CanvasDocument {
  const parsedDocument = canvasDocumentSchema.parse({
    ...document,
    strokes: document.strokes.slice(-MAX_CANVAS_STROKES).map((stroke) => ({
      ...stroke,
      points: stroke.points.slice(-MAX_CANVAS_POINTS_PER_STROKE).map(clampPoint),
    })),
  });

  return {
    ...parsedDocument,
    clientVersion: parsedDocument.clientVersion ?? INITIAL_CANVAS_CLIENT_VERSION,
    exportStatus: parsedDocument.exportStatus ?? "not_requested",
  };
}

export function createCanvasDocument(input: {
  assignmentId?: string;
  studentId: string;
  template: CanvasTemplate;
  title?: string;
  timestamp?: string;
}): CanvasDocument {
  const timestamp = input.timestamp ?? new Date().toISOString();

  return normalizeCanvasDocument({
    assignmentId: input.assignmentId,
    clientVersion: INITIAL_CANVAS_CLIENT_VERSION,
    createdAt: timestamp,
    exportStatus: "not_requested",
    id: createCanvasId(),
    studentId: input.studentId,
    strokes: [],
    syncStatus: "local_only",
    template: input.template,
    title: input.title ?? getDefaultCanvasTitle(input.template),
    updatedAt: timestamp,
  });
}

/**
 * Minimum normalized distance between sampled stroke points. Keeps slow drags
 * from burning the 16-point budget on near-duplicate samples.
 */
export const MIN_STROKE_POINT_DISTANCE = 0.005;

/**
 * Maximum normalized distance at which the eraser removes a stroke. Beyond
 * this, an erase gesture is a no-op instead of deleting far-away work.
 */
export const CANVAS_ERASE_DISTANCE = 0.08;

export type AppendStrokePointResult =
  | { document: CanvasDocument; status: "appended" }
  | { status: "skipped" }
  | { status: "stroke_full" };

export function createCanvasStroke(input: {
  color: string;
  point: CanvasPoint;
  tool: CanvasTool;
  width: number;
  timestamp?: string;
}): CanvasStroke {
  const timestamp = input.timestamp ?? new Date().toISOString();

  return {
    color: input.tool === "eraser" ? "#FFFFFF" : input.color,
    createdAt: timestamp,
    id: createStrokeId(),
    opacity: input.tool === "highlighter" ? 0.42 : 1,
    points: [clampPoint(input.point)],
    tool: input.tool,
    width: input.tool === "highlighter" ? Math.max(input.width, 10) : input.width,
  };
}

/**
 * Appends a sampled drag point to an in-progress stroke. Builds the next
 * document directly (without a full schema re-parse) because this runs on
 * every sampled gesture point; bounds are enforced explicitly here and the
 * document is still validated at the persistence boundary. Untouched stroke
 * objects keep their identity so memoized stroke views do not re-render.
 */
export function appendPointToCanvasStroke(
  document: CanvasDocument,
  strokeId: string,
  point: CanvasPoint,
  minDistance = MIN_STROKE_POINT_DISTANCE,
): AppendStrokePointResult {
  const stroke = document.strokes.find((candidate) => candidate.id === strokeId);

  if (!stroke) {
    return { status: "skipped" };
  }

  if (stroke.points.length >= MAX_CANVAS_POINTS_PER_STROKE) {
    return { status: "stroke_full" };
  }

  const nextPoint = clampPoint(point);
  const lastPoint = stroke.points.at(-1);

  if (lastPoint && Math.hypot(nextPoint.x - lastPoint.x, nextPoint.y - lastPoint.y) < minDistance) {
    return { status: "skipped" };
  }

  const nextStroke: CanvasStroke = { ...stroke, points: [...stroke.points, nextPoint] };

  return {
    document: {
      ...document,
      clientVersion: getNextClientVersion(document),
      strokes: document.strokes.map((candidate) => (candidate.id === strokeId ? nextStroke : candidate)),
      syncStatus: "local_only",
      updatedAt: new Date().toISOString(),
    },
    status: "appended",
  };
}

export function addCanvasStroke(document: CanvasDocument, stroke: CanvasStroke): CanvasDocument {
  return normalizeCanvasDocument({
    ...document,
    clientVersion: getNextClientVersion(document),
    strokes: [...document.strokes, stroke],
    syncStatus: "local_only",
    updatedAt: new Date().toISOString(),
  });
}

export function eraseNearestStroke(
  document: CanvasDocument,
  point: CanvasPoint,
  maxDistance = CANVAS_ERASE_DISTANCE,
): CanvasDocument {
  if (document.strokes.length === 0) {
    return document;
  }

  const target = clampPoint(point);
  let nearestIndex = -1;
  let nearestDistance = Number.POSITIVE_INFINITY;

  document.strokes.forEach((stroke, index) => {
    for (const strokePoint of stroke.points) {
      const distance = Math.hypot(strokePoint.x - target.x, strokePoint.y - target.y);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }
  });

  if (nearestIndex === -1 || nearestDistance > maxDistance) {
    return document;
  }

  return normalizeCanvasDocument({
    ...document,
    clientVersion: getNextClientVersion(document),
    strokes: document.strokes.filter((_, index) => index !== nearestIndex),
    syncStatus: "local_only",
    updatedAt: new Date().toISOString(),
  });
}

export function replaceCanvasStrokes(document: CanvasDocument, strokes: CanvasStroke[]): CanvasDocument {
  return normalizeCanvasDocument({
    ...document,
    clientVersion: getNextClientVersion(document),
    strokes,
    syncStatus: "local_only",
    updatedAt: new Date().toISOString(),
  });
}

export function attachCanvasToAssignment(document: CanvasDocument, assignmentId: string): CanvasDocument {
  const timestamp = new Date().toISOString();

  return normalizeCanvasDocument({
    ...document,
    assignmentId,
    attachedAt: timestamp,
    clientVersion: getNextClientVersion(document),
    syncStatus: "local_only",
    updatedAt: timestamp,
  });
}

export function getCanvasDocumentSummary(document: CanvasDocument): CanvasDocumentSummary {
  return {
    assignmentId: document.assignmentId,
    id: document.id,
    isAttached: Boolean(document.assignmentId),
    strokeCount: document.strokes.length,
    syncStatus: document.syncStatus,
    template: document.template,
    title: document.title,
    updatedAt: document.updatedAt,
    updatedLabel: getUpdatedLabel(document.updatedAt),
  };
}

export function getDefaultCanvasTitle(template: CanvasTemplate): string {
  return translate("en", canvasDefaultTitleKeys[template]);
}

export function getUpdatedLabel(updatedAt: string): string {
  const timestamp = Date.parse(updatedAt);

  if (Number.isNaN(timestamp)) {
    return translate("en", "canvas.document.savedRecently");
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));

  if (diffMinutes < 1) {
    return translate("en", "canvas.document.savedJustNow");
  }

  if (diffMinutes === 1) {
    return translate("en", "canvas.document.savedOneMinuteAgo");
  }

  if (diffMinutes < 60) {
    return translate("en", "canvas.document.savedMinutesAgo", { count: diffMinutes });
  }

  return translate("en", "canvas.document.savedEarlier");
}

export function pushUndoSnapshot(history: CanvasStroke[][], strokes: CanvasStroke[]): CanvasStroke[][] {
  return [...history, strokes].slice(-MAX_CANVAS_UNDO_STEPS);
}
