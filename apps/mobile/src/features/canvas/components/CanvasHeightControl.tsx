import { Ionicons } from "@expo/vector-icons";
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
}

/**
 * Compact page control. Adds fixed-height pages below the current page so
 * existing handwriting keeps its shape and position.
 */
export function CanvasHeightControl({ gradeBand }: CanvasHeightControlProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const hitSlop = getAccessibleHitSlop(settings);
  const type = typography.gradeBands[gradeBand];
  const heightLevel = useCanvasToolStore((store) => store.heightLevel);
  const increaseHeight = useCanvasToolStore((store) => store.increaseHeight);

  const levelIndex = CANVAS_HEIGHT_LEVELS.indexOf(heightLevel);
  const canIncrease = levelIndex < CANVAS_HEIGHT_LEVELS.length - 1;
  const pageCount = levelIndex + 1;

  const handleIncrease = () => {
    increaseHeight();
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
        <View style={styles.levelLabel}>
          <Text selectable={false} style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.text }]}>
            {t("canvas.handwriting.height.pageCount", { count: pageCount })}
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
    </View>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.35,
  },
  levelLabel: {
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
    minWidth: 180,
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
});
