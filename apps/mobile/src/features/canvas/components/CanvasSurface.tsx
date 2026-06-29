import { StyleSheet } from "react-native";

import type { GradeBand } from "@/design/tokens";

import { useCanvasToolStore } from "../stores/canvasToolStore";
import {
  CANVAS_PAGE_COUNTS,
  type CanvasDocument,
  type CanvasGradeAdaptation,
  type CanvasPoint,
} from "../types";
import { StrokeCanvasAdapter } from "./StrokeCanvasAdapter";

interface CanvasSurfaceProps {
  document: CanvasDocument;
  gradeAdaptation: CanvasGradeAdaptation;
  gradeBand: GradeBand;
  onBeginStroke: (point: CanvasPoint) => void;
  onEndStroke: () => void;
  onExtendStroke: (point: CanvasPoint) => void;
  /** Height of a single canvas "page" — the area available below the header. */
  viewportHeight: number;
}

/**
 * Calm, paper-like writing surface for the handwriting canvas. Reflects the
 * student's ruled-lines and page-count preference and delegates the stroke
 * engine to {@link StrokeCanvasAdapter}. Render inside a scroll view so added
 * fixed-height pages can stack downward without rescaling existing strokes.
 */
export function CanvasSurface({
  document,
  gradeAdaptation,
  gradeBand,
  onBeginStroke,
  onEndStroke,
  onExtendStroke,
  viewportHeight,
}: CanvasSurfaceProps) {
  const showLines = useCanvasToolStore((store) => store.showLines);
  const heightLevel = useCanvasToolStore((store) => store.heightLevel);
  const pageHeight = Math.round(Math.max(320, viewportHeight));
  const surfaceHeight = pageHeight * CANVAS_PAGE_COUNTS[heightLevel];

  return (
    <StrokeCanvasAdapter
      document={document}
      gradeAdaptation={gradeAdaptation}
      gradeBand={gradeBand}
      minimal
      onBeginStroke={onBeginStroke}
      onEndStroke={onEndStroke}
      onExtendStroke={onExtendStroke}
      showLines={showLines}
      style={styles.surface}
      pageHeight={pageHeight}
      surfaceHeight={surfaceHeight}
    />
  );
}

const styles = StyleSheet.create({
  surface: {
    width: "100%",
  },
});
