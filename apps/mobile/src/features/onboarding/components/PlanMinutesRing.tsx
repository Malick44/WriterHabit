import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
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

const RING_SIZE = 80;
const RING_STROKE = 8;

type PlanMinutesRingProps = {
  minutes: number;
  unitLabel: string;
};

/**
 * Three-quarter progress ring built from border arcs so it works without
 * react-native-svg. The gap sits at the top-left, matching the handoff design.
 */
export function PlanMinutesRing({ minutes, unitLabel }: PlanMinutesRingProps) {
  const { settings } = useAccessibilityContext();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      getMotionDuration(settings, 150),
      withTiming(1, {
        duration: getMotionDuration(settings, motion.duration.xl),
        easing: Easing.bezier(...motion.easing.standard),
      }),
    );
  }, [progress, settings]);

  const arcStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ rotate: `${45 - 120 * (1 - progress.value)}deg` }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track} />
      <Animated.View style={[styles.arc, arcStyle]} />
      <View style={styles.center}>
        <Text selectable style={getAccessibleTextStyle(styles.minutes, settings)}>
          {minutes}
        </Text>
        <Text selectable style={getAccessibleTextStyle(styles.unit, settings)}>
          {unitLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  arc: {
    borderBottomColor: palette.teal[500],
    borderColor: palette.teal[500],
    borderLeftColor: "transparent",
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
    height: RING_SIZE,
    position: "absolute",
    width: RING_SIZE,
  },
  center: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  container: {
    alignItems: "center",
    height: RING_SIZE,
    justifyContent: "center",
    width: RING_SIZE,
  },
  minutes: {
    color: palette.teal[700],
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28,
  },
  track: {
    borderColor: palette.teal[100],
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
    height: RING_SIZE,
    position: "absolute",
    width: RING_SIZE,
  },
  unit: {
    color: palette.teal[500],
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
