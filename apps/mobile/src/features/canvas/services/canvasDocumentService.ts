import { typography } from "@/design/tokens";

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

export function createCanvasStroke(input: {
  color: string;
  point: CanvasPoint;
  tool: CanvasTool;
  width: number;
  timestamp?: string;
}): CanvasStroke {
  const point = clampPoint(input.point);
  const timestamp = input.timestamp ?? new Date().toISOString();
  const offset = Math.min(0.018, input.width / 400);

  return {
    color: input.tool === "eraser" ? "#FFFFFF" : input.color,
    createdAt: timestamp,
    id: createStrokeId(),
    opacity: input.tool === "highlighter" ? 0.42 : 1,
    points: [
      { x: Math.max(0, point.x - offset), y: point.y, pressure: point.pressure },
      point,
      { x: Math.min(1, point.x + offset), y: Math.min(1, point.y + offset), pressure: point.pressure },
    ],
    tool: input.tool,
    width: input.tool === "highlighter" ? Math.max(input.width, 10) : input.width,
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

export function eraseNearestStroke(document: CanvasDocument, point: CanvasPoint): CanvasDocument {
  if (document.strokes.length === 0) {
    return document;
  }

  const target = clampPoint(point);
  let nearestIndex = document.strokes.length - 1;
  let nearestDistance = Number.POSITIVE_INFINITY;

  document.strokes.forEach((stroke, index) => {
    const firstPoint = stroke.points[0];

    if (!firstPoint) {
      return;
    }

    const distance = Math.hypot(firstPoint.x - target.x, firstPoint.y - target.y);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

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
  switch (template) {
    case "blank_page":
      return "Blank page";
    case "lined_paper":
      return "Lined paper";
    case "storyboard":
      return "Storyboard";
    case "mind_map":
      return "Mind map";
    case "essay_plan":
      return "Essay plan";
    case "vocabulary_web":
      return "Vocabulary web";
    case "handwriting_practice":
      return "Handwriting practice";
    case "annotate_passage":
      return "Annotate passage";
  }
}

export function getUpdatedLabel(updatedAt: string): string {
  const timestamp = Date.parse(updatedAt);

  if (Number.isNaN(timestamp)) {
    return "Saved recently";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));

  if (diffMinutes < 1) {
    return "Saved just now";
  }

  if (diffMinutes === 1) {
    return "Saved 1 minute ago";
  }

  if (diffMinutes < 60) {
    return `Saved ${diffMinutes} minutes ago`;
  }

  return "Saved earlier";
}

export function pushUndoSnapshot(history: CanvasStroke[][], strokes: CanvasStroke[]): CanvasStroke[][] {
  return [...history, strokes].slice(-MAX_CANVAS_UNDO_STEPS);
}
