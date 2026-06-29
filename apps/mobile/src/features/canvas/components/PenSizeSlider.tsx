import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { colors, radius, shadows, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useCanvasToolStore } from "../stores/canvasToolStore";
import { MAX_PEN_WIDTH, MIN_PEN_WIDTH } from "../types";

const TRACK_WIDTH = 58;
const KNOB_SIZE = 18;
const LONG_PRESS_MS = 160;

interface PenSizeSliderProps {
  colorPickerOpen: boolean;
  gradeBand: GradeBand;
  onToggleColorPicker: () => void;
}

function widthToFraction(width: number): number {
  return (width - MIN_PEN_WIDTH) / (MAX_PEN_WIDTH - MIN_PEN_WIDTH);
}

/**
 * Premium compact pen control with two interaction modes:
 *  - press + hold + slide adjusts the pen size with a live preview, and
 *  - a tap toggles the color picker.
 * The knob reflects the current ink color so it doubles as a color indicator.
 */
export function PenSizeSlider({ colorPickerOpen, gradeBand, onToggleColorPicker }: PenSizeSliderProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const showVisibleHint = settings.textSize !== "default" || settings.simplifiedUi;
  const width = useCanvasToolStore((store) => store.width);
  const color = useCanvasToolStore((store) => store.color);
  const setWidth = useCanvasToolStore((store) => store.setWidth);
  const [previewVisible, setPreviewVisible] = useState(false);

  const fraction = Math.min(1, Math.max(0, widthToFraction(width)));
  const knobOffset = fraction * (TRACK_WIDTH - KNOB_SIZE);

  const sizeWord = useMemo(() => {
    if (width <= 3) {
      return t("canvas.handwriting.penSize.thin");
    }
    if (width <= 7) {
      return t("canvas.handwriting.penSize.medium");
    }
    return t("canvas.handwriting.penSize.bold");
  }, [t, width]);

  const applyWidthFromX = useCallback(
    (x: number) => {
      const usable = Math.max(1, TRACK_WIDTH - KNOB_SIZE);
      const nextFraction = Math.min(1, Math.max(0, (x - KNOB_SIZE / 2) / usable));
      setWidth(MIN_PEN_WIDTH + nextFraction * (MAX_PEN_WIDTH - MIN_PEN_WIDTH));
    },
    [setWidth],
  );

  const slide = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(LONG_PRESS_MS)
        .minDistance(0)
        .runOnJS(true)
        .onStart(() => setPreviewVisible(true))
        .onChange((event) => applyWidthFromX(event.x))
        .onFinalize(() => setPreviewVisible(false)),
    [applyWidthFromX],
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(LONG_PRESS_MS + 80)
        .runOnJS(true)
        .onEnd((_event, success) => {
          if (success) {
            onToggleColorPicker();
          }
        }),
    [onToggleColorPicker],
  );

  const composed = useMemo(() => Gesture.Exclusive(slide, tap), [slide, tap]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <View
          accessibilityHint={t("canvas.handwriting.penSize.hint")}
          accessibilityLabel={t("canvas.handwriting.penSize.adjustAccessibility", { size: width })}
          accessibilityRole="adjustable"
          accessibilityValue={{ max: MAX_PEN_WIDTH, min: MIN_PEN_WIDTH, now: width }}
          accessible
          onAccessibilityAction={onToggleColorPicker}
          style={styles.touchArea}
          testID="canvas-pen-size-slider"
        >
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: KNOB_SIZE / 2 + knobOffset }]} />
          </View>

          <View
            style={[
              styles.knob,
              {
                borderColor: colorPickerOpen ? accessibleColors.focus : colors.border.strong,
                left: knobOffset,
              },
            ]}
          >
            <View style={[styles.knobInk, { backgroundColor: color, height: Math.max(8, width), width: Math.max(8, width) }]} />
          </View>

          {previewVisible ? (
            <View style={[styles.preview, { left: knobOffset - 12 }]} pointerEvents="none">
              <Text selectable={false} style={[getAccessibleTextStyle(type.caption, settings), styles.previewText]}>
                {sizeWord}
              </Text>
              <Text selectable={false} style={[getAccessibleTextStyle(type.caption, settings), styles.previewSub]}>
                {t("canvas.handwriting.penSize.preview", { size: width })}
              </Text>
            </View>
          ) : null}
        </View>
      </GestureDetector>

      {showVisibleHint ? (
        <Text selectable={false} style={[getAccessibleTextStyle(type.caption, settings), styles.hint]} numberOfLines={1}>
          {t("canvas.handwriting.penSize.hint")}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 2,
  },
  hint: {
    color: colors.text.muted,
    fontSize: 10,
    lineHeight: 13,
  },
  knob: {
    alignItems: "center",
    backgroundColor: colors.background.surface,
    borderRadius: radius.full,
    borderWidth: 1.25,
    height: KNOB_SIZE,
    justifyContent: "center",
    position: "absolute",
    top: 6,
    width: KNOB_SIZE,
    ...shadows.raised,
  },
  knobInk: {
    borderRadius: radius.full,
  },
  preview: {
    alignItems: "center",
    backgroundColor: colors.background.inverse,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: "absolute",
    top: -18,
  },
  previewSub: {
    color: colors.text.inverse,
    fontSize: 10,
    lineHeight: 13,
    opacity: 0.8,
  },
  previewText: {
    color: colors.text.inverse,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  touchArea: {
    height: KNOB_SIZE + 10,
    position: "relative",
    width: TRACK_WIDTH,
  },
  track: {
    backgroundColor: colors.background.subtle,
    borderRadius: radius.full,
    height: 3,
    left: 0,
    position: "absolute",
    right: 0,
    top: 13,
  },
  trackFill: {
    backgroundColor: colors.action.primary.background,
    borderRadius: radius.full,
    height: "100%",
  },
});
