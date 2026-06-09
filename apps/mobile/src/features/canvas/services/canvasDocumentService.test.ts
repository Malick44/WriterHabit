import {
  addCanvasStroke,
  attachCanvasToAssignment,
  createCanvasDocument,
  createCanvasStroke,
  eraseNearestStroke,
  getCanvasDocumentSummary,
  getCanvasGradeAdaptation,
  normalizeCanvasDocument,
} from "./canvasDocumentService";
import { MAX_CANVAS_POINTS_PER_STROKE, MAX_CANVAS_STROKES, type CanvasStroke } from "../types";

describe("canvasDocumentService", () => {
  it("creates and summarizes a canvas document", () => {
    const document = createCanvasDocument({
      assignmentId: "assignment-1",
      studentId: "student-1",
      template: "essay_plan",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const summary = getCanvasDocumentSummary(document);

    expect(document).toMatchObject({
      assignmentId: "assignment-1",
      studentId: "student-1",
      strokes: [],
      syncStatus: "local_only",
      template: "essay_plan",
    });
    expect(summary).toMatchObject({
      isAttached: true,
      strokeCount: 0,
      title: "Essay plan",
    });
  });

  it("caps stored strokes and points", () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "blank_page",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const oversizedStroke: CanvasStroke = {
      color: "#0F172A",
      createdAt: "2026-06-09T09:00:00.000Z",
      id: "stroke-many-points",
      points: Array.from({ length: MAX_CANVAS_POINTS_PER_STROKE + 4 }, (_, index) => ({
        x: index,
        y: -index,
      })),
      tool: "pen",
      width: 4,
    };
    const normalized = normalizeCanvasDocument({
      ...document,
      strokes: Array.from({ length: MAX_CANVAS_STROKES + 3 }, (_, index) => ({
        ...oversizedStroke,
        id: `stroke-${index}`,
      })),
    });

    expect(normalized.strokes).toHaveLength(MAX_CANVAS_STROKES);
    expect(normalized.strokes[0]?.points).toHaveLength(MAX_CANVAS_POINTS_PER_STROKE);
    expect(normalized.strokes[0]?.points[0]).toMatchObject({ x: 1, y: 0 });
  });

  it("adds, erases, and attaches strokes without replacing student work", () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "mind_map",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const firstStroke = createCanvasStroke({
      color: "#0F172A",
      point: { x: 0.2, y: 0.2 },
      timestamp: "2026-06-09T09:00:00.000Z",
      tool: "pen",
      width: 4,
    });
    const secondStroke = createCanvasStroke({
      color: "#2563EB",
      point: { x: 0.8, y: 0.8 },
      timestamp: "2026-06-09T09:01:00.000Z",
      tool: "highlighter",
      width: 4,
    });
    const withStrokes = addCanvasStroke(addCanvasStroke(document, firstStroke), secondStroke);
    const erased = eraseNearestStroke(withStrokes, { x: 0.8, y: 0.8 });
    const attached = attachCanvasToAssignment(erased, "assignment-2");

    expect(withStrokes.strokes).toHaveLength(2);
    expect(erased.strokes).toHaveLength(1);
    expect(attached).toMatchObject({
      assignmentId: "assignment-2",
      strokes: [expect.objectContaining({ id: firstStroke.id })],
    });
  });

  it("adapts canvas UI by grade band", () => {
    expect(getCanvasGradeAdaptation(3)).toMatchObject({
      band: "elementary",
      showDetailedTemplates: false,
      visibleTemplateCount: 6,
    });
    expect(getCanvasGradeAdaptation(10)).toMatchObject({
      band: "high",
      showDetailedTemplates: true,
      visibleTemplateCount: 8,
    });
  });
});
