import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
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
import type { CanvasBannerPosition } from "../types";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface BannerPositionPickerProps {
  gradeBand: GradeBand;
  onClose: () => void;
}

const OPTIONS: { position: CanvasBannerPosition; icon: IoniconName; labelKey: TranslationKey }[] = [
  { position: "top", icon: "arrow-up", labelKey: "canvas.handwriting.position.top" },
  { position: "bottom", icon: "arrow-down", labelKey: "canvas.handwriting.position.bottom" },
  { position: "left", icon: "arrow-back", labelKey: "canvas.handwriting.position.left" },
  { position: "right", icon: "arrow-forward", labelKey: "canvas.handwriting.position.right" },
];

/** Mini picker letting the student move the tool banner to any screen edge. */
export function BannerPositionPicker({ gradeBand, onClose }: BannerPositionPickerProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const hitSlop = getAccessibleHitSlop(settings);
  const type = typography.gradeBands[gradeBand];
  const bannerPosition = useCanvasToolStore((store) => store.bannerPosition);
  const setBannerPosition = useCanvasToolStore((store) => store.setBannerPosition);

  return (
    <View
      accessibilityLabel={t("canvas.handwriting.position.accessibility")}
      style={styles.popover}
      testID="canvas-banner-position-picker"
    >
      <Text selectable={false} style={[getAccessibleTextStyle(type.caption, settings), styles.title]}>
        {t("canvas.handwriting.position.title")}
      </Text>

      <View style={styles.grid}>
        {OPTIONS.map(({ position, icon, labelKey }) => {
          const selected = bannerPosition === position;
          const label = t(labelKey);

          return (
            <Pressable
              accessibilityLabel={t("canvas.handwriting.position.selectAccessibility", { position: label })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              hitSlop={hitSlop}
              key={position}
              onPress={() => {
                setBannerPosition(position);
                onClose();
              }}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionSelected : null,
                pressed && !selected ? styles.pressed : null,
              ]}
            >
              <Ionicons
                color={selected ? colors.action.primary.foreground : accessibleColors.text}
                name={icon}
                size={18}
              />
              <Text
                selectable={false}
                style={[
                  getAccessibleTextStyle(type.caption, settings),
                  { color: selected ? colors.action.primary.foreground : accessibleColors.mutedText },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    maxWidth: 196,
  },
  option: {
    alignItems: "center",
    backgroundColor: colors.background.subtle,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 90,
  },
  optionSelected: {
    backgroundColor: colors.action.primary.background,
  },
  popover: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
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
