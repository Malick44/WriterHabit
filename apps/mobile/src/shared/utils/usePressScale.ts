import { useCallback } from "react";
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { motion } from "@/design/tokens";
import { useAccessibilityContext } from "@/shared/utils/accessibility";

const PRESSED_SCALE = 0.97;

/**
 * Shared press-scale microinteraction: springs the control to a slightly
 * smaller scale on press-in and back to rest on press-out. Honors reduced
 * motion (mirroring how `getMotionDuration` gates motion) by skipping the
 * scale animation entirely.
 */
export function usePressScale(enabled = true) {
  const { settings } = useAccessibilityContext();
  const shouldAnimate = enabled && !settings.reducedMotion;
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (!shouldAnimate) {
      return;
    }

    scale.value = withSpring(PRESSED_SCALE, motion.spring.cardPress);
  }, [scale, shouldAnimate]);

  const handlePressOut = useCallback(() => {
    if (!shouldAnimate) {
      return;
    }

    scale.value = withSpring(1, motion.spring.cardPress);
  }, [scale, shouldAnimate]);

  const pressScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { handlePressIn, handlePressOut, pressScaleStyle };
}
