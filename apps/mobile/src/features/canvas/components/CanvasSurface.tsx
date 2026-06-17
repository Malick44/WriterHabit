import { StyleSheet } from "react-native";

import type { GradeBand } from "@/design/tokens";

import { useCanvasToolStore } from "../stores/canvasToolStore";
import {
  CANVAS_HEIGHT_MULTIPLIERS,
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
 * student's ruled-lines and canvas-height preferences and delegates the stroke
 * engine to {@link StrokeCanvasAdapter}. Render inside a scroll view so taller
 * height presets can expand the surface downward.
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
  const surfaceHeight = Math.round(Math.max(320, viewportHeight) * CANVAS_HEIGHT_MULTIPLIERS[heightLevel]);

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
      surfaceHeight={surfaceHeight}
    />
  );
}

const styles = StyleSheet.create({
  surface: {
    width: "100%",
  },
});
