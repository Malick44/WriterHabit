import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { motion, palette } from "@/design/tokens";
import {
  getAccessibleTextStyle,
  getMotionDuration,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 168;
const BASELINE_Y = 140;
const SEGMENT_COUNT = 28;

type Point = { x: number; y: number };

// Curve geometry lifted from the handoff design's SVG paths: a flat "on your
// own" line and an accelerating "with WriterHabit" line over 12 weeks.
const SOLO_CURVE: [Point, Point, Point, Point] = [
  { x: 16, y: 134 },
  { x: 120, y: 130 },
  { x: 210, y: 124 },
  { x: 304, y: 104 },
];
const APP_CURVE: [Point, Point, Point, Point] = [
  { x: 16, y: 134 },
  { x: 108, y: 122 },
  { x: 150, y: 74 },
  { x: 304, y: 30 },
];
const GRIDLINE_YS = [52, 96, BASELINE_Y];

function sampleCubic([p0, c1, c2, p3]: [Point, Point, Point, Point]): Point[] {
  return Array.from({ length: SEGMENT_COUNT + 1 }, (_, i) => {
    const t = i / SEGMENT_COUNT;
    const mt = 1 - t;
    return {
      x: mt * mt * mt * p0.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * p3.x,
      y: mt * mt * mt * p0.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * p3.y,
    };
  });
}

const SOLO_POINTS = sampleCubic(SOLO_CURVE);
const APP_POINTS = sampleCubic(APP_CURVE);

function Polyline({ points, color, stroke, scale }: { points: Point[]; color: string; stroke: number; scale: number }) {
  return (
    <>
      {points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        const x1 = point.x * scale;
        const y1 = point.y * scale;
        const x2 = next.x * scale;
        const y2 = next.y * scale;
        const length = Math.hypot(x2 - x1, y2 - y1) + stroke * 0.6;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        return (
          <View
            key={`${point.x}-${point.y}`}
            style={{
              backgroundColor: color,
              borderRadius: stroke / 2,
              height: stroke,
              left: (x1 + x2) / 2 - length / 2,
              position: "absolute",
              top: (y1 + y2) / 2 - stroke / 2,
              transform: [{ rotate: `${angle}rad` }],
              width: length,
            }}
          />
        );
      })}
    </>
  );
}

type SkillGrowthChartProps = {
  axisEndLabel: string;
  axisMidLabel: string;
  axisStartLabel: string;
  milestoneLabel: string;
};

/**
 * Animated "skill growth over 12 weeks" comparison chart from the handoff
 * design, drawn with plain Views so it works without react-native-svg. The
 * curves reveal left-to-right, then the endpoint dots and milestone badge
 * fade in.
 */
export function SkillGrowthChart({
  axisEndLabel,
  axisMidLabel,
  axisStartLabel,
  milestoneLabel,
}: SkillGrowthChartProps) {
  const { settings } = useAccessibilityContext();
  const [plotWidth, setPlotWidth] = useState(0);
  const reveal = useSharedValue(0);
  const accents = useSharedValue(0);

  useEffect(() => {
    reveal.value = withDelay(
      getMotionDuration(settings, 250),
      withTiming(1, {
        duration: getMotionDuration(settings, 1100),
        easing: Easing.bezier(...motion.easing.standard),
      }),
    );
    accents.value = withDelay(
      getMotionDuration(settings, 1300),
      withTiming(1, {
        duration: getMotionDuration(settings, motion.duration.lg),
        easing: Easing.bezier(...motion.easing.decelerate),
      }),
    );
  }, [accents, reveal, settings]);

  const revealStyle = useAnimatedStyle(() => ({
    width: reveal.value * plotWidth,
  }));
  const accentsStyle = useAnimatedStyle(() => ({
    opacity: accents.value,
    transform: [{ translateY: 8 * (1 - accents.value) }],
  }));

  const scale = plotWidth / VIEWBOX_WIDTH;
  const plotHeight = VIEWBOX_HEIGHT * scale;
  const soloEnd = SOLO_POINTS[SOLO_POINTS.length - 1];
  const appEnd = APP_POINTS[APP_POINTS.length - 1];

  return (
    <View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onLayout={(event) => {
          setPlotWidth(event.nativeEvent.layout.width);
        }}
        style={[styles.plot, { height: plotHeight || undefined }]}
      >
        {plotWidth > 0 ? (
          <>
            {GRIDLINE_YS.map((y) => (
              <View
                key={y}
                style={[
                  styles.gridline,
                  {
                    backgroundColor: y === BASELINE_Y ? palette.slate[200] : palette.slate[100],
                    top: y * scale,
                  },
                ]}
              />
            ))}

            <Animated.View style={[styles.revealMask, { height: plotHeight }, revealStyle]}>
              <View style={{ height: plotHeight, width: plotWidth }}>
                <Polyline color={palette.slate[300]} points={SOLO_POINTS} scale={scale} stroke={3} />
                <Polyline color={palette.teal[500]} points={APP_POINTS} scale={scale} stroke={4} />
              </View>
            </Animated.View>

            <Animated.View style={accentsStyle}>
              <View
                style={[
                  styles.endDotSolo,
                  { left: soloEnd.x * scale - 4, top: soloEnd.y * scale - 4 },
                ]}
              />
              <View
                style={[
                  styles.endDotApp,
                  { left: appEnd.x * scale - 7, top: appEnd.y * scale - 7 },
                ]}
              />
              <View style={styles.milestoneBadge}>
                <Ionicons name="trending-up" size={12} color={palette.green[700]} />
                <Text selectable={false} style={styles.milestoneText}>
                  {milestoneLabel}
                </Text>
              </View>
            </Animated.View>
          </>
        ) : null}
      </View>

      <View style={styles.axisRow}>
        <Text selectable style={getAccessibleTextStyle(styles.axisLabel, settings)}>
          {axisStartLabel}
        </Text>
        <Text selectable style={getAccessibleTextStyle(styles.axisLabel, settings)}>
          {axisMidLabel}
        </Text>
        <Text selectable style={getAccessibleTextStyle(styles.axisLabel, settings)}>
          {axisEndLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axisLabel: {
    color: palette.slate[400],
    fontSize: 12,
    fontWeight: "700",
  },
  axisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  endDotApp: {
    backgroundColor: palette.teal[500],
    borderColor: palette.white,
    borderRadius: 7,
    borderWidth: 2,
    height: 14,
    position: "absolute",
    width: 14,
  },
  endDotSolo: {
    backgroundColor: palette.slate[400],
    borderRadius: 4,
    height: 8,
    position: "absolute",
    width: 8,
  },
  gridline: {
    height: 1,
    left: 0,
    position: "absolute",
    right: 0,
  },
  milestoneBadge: {
    alignItems: "center",
    backgroundColor: palette.green[100],
    borderColor: palette.green[100],
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    position: "absolute",
    right: 6,
    top: 6,
  },
  milestoneText: {
    color: palette.green[700],
    fontSize: 11,
    fontWeight: "800",
  },
  plot: {
    marginTop: 12,
    width: "100%",
  },
  revealMask: {
    left: 0,
    overflow: "hidden",
    position: "absolute",
    top: 0,
  },
});
