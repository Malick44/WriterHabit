import {
  addCanvasStroke,
  appendPointToCanvasStroke,
  attachCanvasToAssignment,
  createCanvasDocument,
  createCanvasStroke,
  eraseNearestStroke,
  getCanvasDocumentSummary,
  getCanvasGradeAdaptation,
  MIN_STROKE_POINT_DISTANCE,
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

  it("starts a stroke with a single clamped point", () => {
    const stroke = createCanvasStroke({
      color: "#0F172A",
      point: { x: 1.4, y: -0.2 },
      timestamp: "2026-06-09T09:00:00.000Z",
      tool: "pen",
      width: 4,
    });

    expect(stroke.points).toEqual([{ pressure: undefined, x: 1, y: 0 }]);
    expect(stroke.tool).toBe("pen");
  });

  it("preserves page-relative y positions beyond the first page", () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "blank_page",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const stroke = createCanvasStroke({
      color: "#0F172A",
      point: { x: 0.4, y: 1.25 },
      timestamp: "2026-06-09T09:00:00.000Z",
      tool: "pen",
      width: 4,
    });
    const withStroke = addCanvasStroke(document, stroke);
    const appended = appendPointToCanvasStroke(withStroke, stroke.id, { x: 0.5, y: 1.35 });

    expect(stroke.points[0]).toMatchObject({ x: 0.4, y: 1.25 });

    if (appended.status !== "appended") {
      throw new Error("expected appended result");
    }

    expect(appended.document.strokes[0]?.points.at(-1)).toMatchObject({ x: 0.5, y: 1.35 });
  });

  it("appends sampled drag points to the active stroke without touching other strokes", () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "blank_page",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const earlierStroke = createCanvasStroke({
      color: "#2563EB",
      point: { x: 0.9, y: 0.9 },
      tool: "pen",
      width: 4,
    });
    const activeStroke = createCanvasStroke({
      color: "#0F172A",
      point: { x: 0.1, y: 0.1 },
      tool: "pen",
      width: 4,
    });
    const withStrokes = addCanvasStroke(addCanvasStroke(document, earlierStroke), activeStroke);

    const appended = appendPointToCanvasStroke(withStrokes, activeStroke.id, { x: 0.2, y: 0.2 });

    expect(appended.status).toBe("appended");

    if (appended.status !== "appended") {
      throw new Error("expected appended result");
    }

    const updatedStroke = appended.document.strokes.find((stroke) => stroke.id === activeStroke.id);

    expect(updatedStroke?.points).toHaveLength(2);
    // Untouched strokes keep identity so memoized stroke views stay stable.
    expect(appended.document.strokes.find((stroke) => stroke.id === earlierStroke.id)).toBe(
      withStrokes.strokes.find((stroke) => stroke.id === earlierStroke.id),
    );
  });

  it("skips near-duplicate points and reports a full stroke", () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "blank_page",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const stroke = createCanvasStroke({ color: "#0F172A", point: { x: 0.1, y: 0.1 }, tool: "pen", width: 4 });
    const withStroke = addCanvasStroke(document, stroke);

    expect(
      appendPointToCanvasStroke(withStroke, stroke.id, {
        x: 0.1 + MIN_STROKE_POINT_DISTANCE / 2,
        y: 0.1,
      }),
    ).toEqual({ status: "skipped" });
    expect(appendPointToCanvasStroke(withStroke, "missing-stroke", { x: 0.5, y: 0.5 })).toEqual({
      status: "skipped",
    });

    let current = withStroke;

    for (let index = 0; index < MAX_CANVAS_POINTS_PER_STROKE; index += 1) {
      const result = appendPointToCanvasStroke(current, stroke.id, { x: 0.1 + (index + 1) * 0.02, y: 0.1 });

      if (result.status === "appended") {
        current = result.document;
      }
    }

    expect(current.strokes[0]?.points).toHaveLength(MAX_CANVAS_POINTS_PER_STROKE);
    expect(appendPointToCanvasStroke(current, stroke.id, { x: 0.9, y: 0.9 })).toEqual({
      status: "stroke_full",
    });
  });

  it("only erases strokes within the erase distance", () => {
    const document = createCanvasDocument({
      studentId: "student-1",
      template: "blank_page",
      timestamp: "2026-06-09T09:00:00.000Z",
    });
    const stroke = createCanvasStroke({ color: "#0F172A", point: { x: 0.2, y: 0.2 }, tool: "pen", width: 4 });
    const withStroke = addCanvasStroke(document, stroke);

    const farErase = eraseNearestStroke(withStroke, { x: 0.9, y: 0.9 });
    const nearErase = eraseNearestStroke(withStroke, { x: 0.22, y: 0.22 });

    expect(farErase).toBe(withStroke);
    expect(nearErase.strokes).toHaveLength(0);
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
