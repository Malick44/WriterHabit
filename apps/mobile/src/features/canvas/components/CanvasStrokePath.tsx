import { memo } from "react";
import { View } from "react-native";

import type { CanvasStroke } from "../types";

interface CanvasStrokePathProps {
  stroke: CanvasStroke;
  surfaceHeight: number;
  surfaceWidth: number;
}

/**
 * Renders one bounded stroke as connected line segments between its sampled
 * points. Rounded segment ends overlap at shared points, so joints stay
 * smooth without extra cap views. Memoized so completed strokes do not
 * re-render while the active stroke grows.
 */
export const CanvasStrokePath = memo(function CanvasStrokePath({
  stroke,
  surfaceHeight,
  surfaceWidth,
}: CanvasStrokePathProps) {
  const firstPoint = stroke.points[0];

  if (!firstPoint) {
    return null;
  }

  const opacity = stroke.opacity ?? 1;

  if (stroke.points.length === 1) {
    return (
      <View
        pointerEvents="none"
        style={{
          backgroundColor: stroke.color,
          borderRadius: stroke.width / 2,
          height: stroke.width,
          left: firstPoint.x * surfaceWidth - stroke.width / 2,
          opacity,
          position: "absolute",
          top: firstPoint.y * surfaceHeight - stroke.width / 2,
          width: stroke.width,
        }}
      />
    );
  }

  return (
    <>
      {stroke.points.slice(1).map((point, index) => {
        const previous = stroke.points[index];

        if (!previous) {
          return null;
        }

        const startX = previous.x * surfaceWidth;
        const startY = previous.y * surfaceHeight;
        const deltaX = point.x * surfaceWidth - startX;
        const deltaY = point.y * surfaceHeight - startY;
        const length = Math.hypot(deltaX, deltaY);
        const angle = Math.atan2(deltaY, deltaX);

        return (
          <View
            key={`${stroke.id}-${index}`}
            pointerEvents="none"
            style={{
              backgroundColor: stroke.color,
              borderRadius: stroke.width / 2,
              height: stroke.width,
              left: startX,
              opacity,
              position: "absolute",
              top: startY - stroke.width / 2,
              transform: [{ rotateZ: `${angle}rad` }],
              transformOrigin: "left",
              width: Math.max(length, stroke.width),
            }}
          />
        );
      })}
    </>
  );
});
