import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadows, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useCanvasToolStore } from "../stores/canvasToolStore";
import { CANVAS_HEIGHT_LEVELS } from "../types";

interface CanvasHeightControlProps {
  gradeBand: GradeBand;
  /** True when strokes sit near the bottom of the current page, so shrinking
   * should ask for confirmation first. */
  hasBottomContent: boolean;
}

/**
 * Compact height stepper: minus / current level / plus. Increasing grows the
 * writing surface downward. Shrinking with writing near the bottom shows a
 * calm warning and requires a confirming second tap before it shrinks.
 */
export function CanvasHeightControl({ gradeBand, hasBottomContent }: CanvasHeightControlProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const hitSlop = getAccessibleHitSlop(settings);
  const type = typography.gradeBands[gradeBand];
  const heightLevel = useCanvasToolStore((store) => store.heightLevel);
  const increaseHeight = useCanvasToolStore((store) => store.increaseHeight);
  const decreaseHeight = useCanvasToolStore((store) => store.decreaseHeight);
  const [warningVisible, setWarningVisible] = useState(false);

  const levelIndex = CANVAS_HEIGHT_LEVELS.indexOf(heightLevel);
  const canDecrease = levelIndex > 0;
  const canIncrease = levelIndex < CANVAS_HEIGHT_LEVELS.length - 1;

  const handleIncrease = () => {
    setWarningVisible(false);
    increaseHeight();
  };

  const handleDecrease = () => {
    if (!canDecrease) {
      return;
    }

    if (hasBottomContent && !warningVisible) {
      // First tap surfaces the calm warning; a confirming tap then shrinks.
      setWarningVisible(true);
      return;
    }

    setWarningVisible(false);
    decreaseHeight();
  };

  return (
    <View
      accessibilityLabel={t("canvas.handwriting.height.accessibility")}
      style={styles.popover}
      testID="canvas-height-control"
    >
      <Text selectable={false} style={[getAccessibleTextStyle(type.caption, settings), styles.title]}>
        {t("canvas.handwriting.height.title")}
      </Text>

      <View style={styles.stepper}>
        <Pressable
          accessibilityLabel={t("canvas.handwriting.height.decrease")}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canDecrease }}
          disabled={!canDecrease}
          hitSlop={hitSlop}
          onPress={handleDecrease}
          style={({ pressed }) => [styles.stepButton, !canDecrease ? styles.disabled : null, pressed ? styles.pressed : null]}
          testID="canvas-height-decrease"
        >
          <Ionicons color={accessibleColors.text} name="remove" size={20} />
        </Pressable>

        <View style={styles.levelLabel}>
          <Text selectable={false} style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.text }]}>
            {t(`canvas.handwriting.height.levels.${heightLevel}`)}
          </Text>
        </View>

        <Pressable
          accessibilityLabel={t("canvas.handwriting.height.increase")}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canIncrease }}
          disabled={!canIncrease}
          hitSlop={hitSlop}
          onPress={handleIncrease}
          style={({ pressed }) => [styles.stepButton, !canIncrease ? styles.disabled : null, pressed ? styles.pressed : null]}
          testID="canvas-height-increase"
        >
          <Ionicons color={accessibleColors.text} name="add" size={20} />
        </Pressable>
      </View>

      {warningVisible ? (
        <View style={styles.warning}>
          <Ionicons color={colors.feedback.warning.icon} name="information-circle-outline" size={15} />
          <Text selectable={false} style={[getAccessibleTextStyle(type.caption, settings), styles.warningText]}>
            {t("canvas.handwriting.height.shrinkWarning")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.35,
  },
  levelLabel: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  popover: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    minWidth: 200,
    padding: spacing.md,
    ...shadows.floating,
  },
  pressed: {
    opacity: 0.6,
  },
  stepButton: {
    alignItems: "center",
    backgroundColor: colors.background.subtle,
    borderRadius: radius.lg,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  stepper: {
    alignItems: "center",
    flexDirection: "row",
  },
  title: {
    color: colors.text.secondary,
    fontWeight: "700",
  },
  warning: {
    alignItems: "flex-start",
    backgroundColor: colors.feedback.warning.background,
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.sm,
  },
  warningText: {
    color: colors.feedback.warning.text,
    flex: 1,
  },
});
