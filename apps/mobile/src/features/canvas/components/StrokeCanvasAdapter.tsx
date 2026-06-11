import { useCallback, useMemo, useRef, useState } from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { colors, radius, shadows, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasDocument, CanvasGradeAdaptation, CanvasPoint, CanvasTemplate } from "../types";
import { CanvasStrokePath } from "./CanvasStrokePath";

/** Minimum drag distance in pixels before another point is sampled. */
const MIN_SAMPLE_DISTANCE_PX = 3;

interface StrokeCanvasAdapterProps {
  document: CanvasDocument;
  gradeAdaptation: CanvasGradeAdaptation;
  gradeBand: GradeBand;
  onBeginStroke: (point: CanvasPoint) => void;
  onEndStroke: () => void;
  onExtendStroke: (point: CanvasPoint) => void;
  style?: StyleProp<ViewStyle>;
}

function TemplateGuides({ template }: { template: CanvasTemplate }) {
  const { t } = useI18n();

  switch (template) {
    case "lined_paper":
    case "handwriting_practice":
      return (
        <View
          pointerEvents="none"
          style={{
            bottom: spacing.lg,
            left: spacing.xl,
            position: "absolute",
            right: spacing.xl,
            top: spacing.xl,
          }}
        >
          {Array.from({ length: template === "handwriting_practice" ? 11 : 14 }).map((_, index) => (
            <View
              key={index}
              style={{
                borderBottomColor: index % 4 === 2 ? colors.border.strong : "#E5EEFF",
                borderBottomWidth: 1,
                height: template === "handwriting_practice" ? 34 : 32,
              }}
            />
          ))}
        </View>
      );
    case "storyboard":
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              style={{
                borderColor: colors.border.default,
                borderRadius: radius.md,
                borderWidth: 1,
                height: 128,
                width: "47%",
              }}
            />
          ))}
        </View>
      );
    case "mind_map":
      return (
        <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          <View
            style={{
              borderColor: colors.border.strong,
              borderRadius: radius.full,
              borderWidth: 1,
              height: 112,
              width: 112,
            }}
          />
          <View style={{ flexDirection: "row", gap: spacing.xxl, marginTop: spacing.xl }}>
            <View style={{ borderBottomColor: colors.border.default, borderBottomWidth: 1, width: 96 }} />
            <View style={{ borderBottomColor: colors.border.default, borderBottomWidth: 1, width: 96 }} />
          </View>
        </View>
      );
    case "essay_plan":
      return (
        <View style={{ gap: spacing.md }}>
          {[
            t("canvas.templates.essayPlanGuides.claim"),
            t("canvas.templates.essayPlanGuides.evidence"),
            t("canvas.templates.essayPlanGuides.explain"),
            t("canvas.templates.essayPlanGuides.revise"),
          ].map((label) => (
            <View
              key={label}
              style={{
                borderColor: colors.border.default,
                borderRadius: radius.md,
                borderWidth: 1,
                minHeight: 72,
                padding: spacing.md,
              }}
            >
              <Text selectable style={[typography.roles.caption, { color: colors.text.muted }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      );
    case "vocabulary_web":
      return (
        <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, justifyContent: "center" }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                style={{
                  borderColor: colors.border.default,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  height: 78,
                  width: 118,
                }}
              />
            ))}
          </View>
        </View>
      );
    case "annotate_passage":
      return (
        <View style={{ gap: spacing.md }}>
          {Array.from({ length: 7 }).map((_, index) => (
            <View
              key={index}
              style={{
                backgroundColor: index % 2 === 0 ? colors.background.surface : colors.background.subtle,
                borderRadius: radius.sm,
                height: 18,
              }}
            />
          ))}
        </View>
      );
    case "blank_page":
      return null;
  }
}

export function StrokeCanvasAdapter({
  document,
  gradeAdaptation,
  gradeBand,
  onBeginStroke,
  onEndStroke,
  onExtendStroke,
  style,
}: StrokeCanvasAdapterProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const [layout, setLayout] = useState({ height: gradeAdaptation.surfaceMinHeight, width: 0 });
  const layoutRef = useRef(layout);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isStrokeActiveRef = useRef(false);
  const lastSampleRef = useRef<{ x: number; y: number } | null>(null);

  const handleSurfaceLayout = useCallback((nextLayout: { height: number; width: number }) => {
    layoutRef.current = nextLayout;
    setLayout(nextLayout);
  }, []);

  const toNormalizedPoint = useCallback((x: number, y: number): CanvasPoint => {
    const { height, width } = layoutRef.current;

    return {
      x: x / Math.max(1, width),
      y: y / Math.max(1, height),
    };
  }, []);

  const handleDrawBegin = useCallback(
    (x: number, y: number) => {
      dragStartRef.current = { x, y };
      isStrokeActiveRef.current = false;
      lastSampleRef.current = { x, y };
    },
    [],
  );

  const handleDrawUpdate = useCallback(
    (x: number, y: number) => {
      const dragStart = dragStartRef.current ?? { x, y };
      const lastSample = lastSampleRef.current;

      if (!isStrokeActiveRef.current) {
        if (Math.hypot(x - dragStart.x, y - dragStart.y) < MIN_SAMPLE_DISTANCE_PX) {
          return;
        }

        isStrokeActiveRef.current = true;
        lastSampleRef.current = { x, y };
        onBeginStroke(toNormalizedPoint(dragStart.x, dragStart.y));
        onExtendStroke(toNormalizedPoint(x, y));
        return;
      }

      if (lastSample && Math.hypot(x - lastSample.x, y - lastSample.y) < MIN_SAMPLE_DISTANCE_PX) {
        return;
      }

      lastSampleRef.current = { x, y };
      onExtendStroke(toNormalizedPoint(x, y));
    },
    [onBeginStroke, onExtendStroke, toNormalizedPoint],
  );

  const handleDrawEnd = useCallback(() => {
    if (isStrokeActiveRef.current) {
      onEndStroke();
    } else if (dragStartRef.current) {
      // A press that never travelled past the sample threshold is a tap:
      // record it as a single-point stroke so it renders as a dot.
      onBeginStroke(toNormalizedPoint(dragStartRef.current.x, dragStartRef.current.y));
      onEndStroke();
    }

    dragStartRef.current = null;
    isStrokeActiveRef.current = false;
    lastSampleRef.current = null;
  }, [onBeginStroke, onEndStroke, toNormalizedPoint]);

  /* eslint-disable react-hooks/refs -- the gesture builder only registers
     these callbacks for touch events; they are never invoked during render */
  const drawGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .maxPointers(1)
        .runOnJS(true)
        .onBegin((event) => handleDrawBegin(event.x, event.y))
        .onUpdate((event) => handleDrawUpdate(event.x, event.y))
        .onFinalize(handleDrawEnd),
    [handleDrawBegin, handleDrawEnd, handleDrawUpdate],
  );
  /* eslint-enable react-hooks/refs */

  return (
    <View
      accessibilityLabel={t("canvas.surface.accessibility")}
      testID="canvas-surface"
      style={[
        {
          backgroundColor: colors.background.surface,
          borderColor: accessibleColors.border,
          borderCurve: "continuous",
          borderRadius: radius.xl,
          borderWidth: 1,
          minHeight: gradeAdaptation.surfaceMinHeight,
          overflow: "hidden",
          ...shadows.card,
        },
        style,
      ]}
    >
      <GestureDetector gesture={drawGesture}>
        <View
          accessibilityHint={t("canvas.surface.hint")}
          accessibilityLabel={t("canvas.surface.accessibility")}
          accessibilityRole="image"
          accessible
          onLayout={(event) => {
            handleSurfaceLayout({
              height: event.nativeEvent.layout.height,
              width: event.nativeEvent.layout.width,
            });
          }}
          style={{
            flex: 1,
            minHeight: gradeAdaptation.surfaceMinHeight,
            padding: spacing.lg,
            position: "relative",
          }}
        >
          <TemplateGuides template={document.template} />

          {document.strokes.length === 0 &&
          document.template !== "lined_paper" &&
          document.template !== "handwriting_practice" ? (
            <View
              pointerEvents="none"
              style={{
                alignItems: "center",
                bottom: spacing.huge,
                justifyContent: "center",
                left: spacing.lg,
                position: "absolute",
                right: spacing.lg,
                top: spacing.lg,
              }}
            >
              <Text
                selectable
                style={[
                  getAccessibleTextStyle(type.bodySmall, settings),
                  { color: colors.text.muted, textAlign: "center" },
                ]}
              >
                {t("canvas.surface.emptyHint")}
              </Text>
            </View>
          ) : null}

          {layout.width > 0
            ? document.strokes.map((stroke) => (
                <CanvasStrokePath
                  key={stroke.id}
                  stroke={stroke}
                  surfaceHeight={layout.height}
                  surfaceWidth={layout.width}
                />
              ))
            : null}

          <View
            pointerEvents="none"
            style={{ alignItems: "center", bottom: spacing.md, left: spacing.lg, position: "absolute", right: spacing.lg }}
          >
            <View
              style={{
                backgroundColor: colors.background.subtle,
                borderRadius: radius.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              }}
            >
              <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
                {t("canvas.surface.drawPrompt")}
              </Text>
            </View>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}
