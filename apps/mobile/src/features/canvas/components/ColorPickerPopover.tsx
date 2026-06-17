import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadows, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useCanvasToolStore } from "../stores/canvasToolStore";

interface ColorPickerPopoverProps {
  gradeBand: GradeBand;
  onClose: () => void;
}

/** Ink colors offered to students. These are drawing-content colors (not app
 * chrome), so they stay close to the canvas design spec's named palette. */
const INK_COLORS: { hex: string; nameKey: TranslationKey }[] = [
  { hex: "#2563EB", nameKey: "canvas.handwriting.colorPicker.colors.indigo" },
  { hex: "#14B8A6", nameKey: "canvas.handwriting.colorPicker.colors.teal" },
  { hex: "#16A34A", nameKey: "canvas.handwriting.colorPicker.colors.green" },
  { hex: "#F59E0B", nameKey: "canvas.handwriting.colorPicker.colors.yellow" },
  { hex: "#DC2626", nameKey: "canvas.handwriting.colorPicker.colors.red" },
  { hex: "#0F172A", nameKey: "canvas.handwriting.colorPicker.colors.ink" },
  { hex: "#475569", nameKey: "canvas.handwriting.colorPicker.colors.gray" },
];

/**
 * Compact, elegant color picker shown next to the pen-size slider knob. The
 * selected color shows a ring; the screen handles dismiss-on-outside-tap.
 */
export function ColorPickerPopover({ gradeBand, onClose }: ColorPickerPopoverProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const hitSlop = getAccessibleHitSlop(settings);
  const type = typography.gradeBands[gradeBand];
  const color = useCanvasToolStore((store) => store.color);
  const setColor = useCanvasToolStore((store) => store.setColor);

  return (
    <View
      accessibilityLabel={t("canvas.handwriting.colorPicker.accessibility")}
      accessibilityViewIsModal
      style={styles.popover}
      testID="canvas-color-picker"
    >
      <View style={styles.headerRow}>
        <Text selectable={false} style={[getAccessibleTextStyle(type.caption, settings), styles.title]}>
          {t("canvas.handwriting.colorPicker.title")}
        </Text>
        <Pressable
          accessibilityLabel={t("canvas.handwriting.colorPicker.close")}
          accessibilityRole="button"
          hitSlop={hitSlop}
          onPress={onClose}
          style={({ pressed }) => [styles.close, pressed ? styles.pressed : null]}
        >
          <Ionicons color={colors.text.muted} name="close" size={16} />
        </Pressable>
      </View>

      <View style={styles.dots}>
        {INK_COLORS.map(({ hex, nameKey }) => {
          const selected = color.toLowerCase() === hex.toLowerCase();
          const colorName = t(nameKey);

          return (
            <Pressable
              accessibilityLabel={t("canvas.handwriting.colorPicker.selectAccessibility", { color: colorName })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              hitSlop={hitSlop}
              key={hex}
              onPress={() => setColor(hex)}
              style={[
                styles.dotRing,
                { borderColor: selected ? accessibleColors.focus : "transparent" },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: hex }]}>
                {selected ? <Ionicons color="#FFFFFF" name="checkmark" size={14} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  close: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  dot: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  dotRing: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 2,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  dots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
    maxWidth: 220,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  popover: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
    ...shadows.floating,
  },
  pressed: {
    opacity: 0.6,
  },
  title: {
    color: colors.text.secondary,
    fontWeight: "700",
  },
});
