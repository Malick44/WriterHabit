import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";

import { colors, radius, shadows, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasBannerPosition } from "../types";

interface EdgeRevealHandleProps {
  gradeBand: GradeBand;
  insets: EdgeInsets;
  onPress: () => void;
  position: CanvasBannerPosition;
}

/** Subtle floating handle shown when the tool banner is hidden. Tapping it (or
 * any screen edge) brings the banner back. Anchors to the banner's last edge. */
export function EdgeRevealHandle({ gradeBand, insets, onPress, position }: EdgeRevealHandleProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const hitSlop = getAccessibleHitSlop(settings);
  const type = typography.gradeBands[gradeBand];
  const vertical = position === "left" || position === "right";

  const anchor: ViewStyle = (() => {
    switch (position) {
      case "top":
        return { alignItems: "center", left: 0, right: 0, top: insets.top + spacing.xs };
      case "bottom":
        return { alignItems: "center", bottom: insets.bottom + spacing.xs, left: 0, right: 0 };
      case "left":
        return { bottom: 0, justifyContent: "center", left: insets.left + spacing.xs, top: 0 };
      case "right":
        return { bottom: 0, justifyContent: "center", right: insets.right + spacing.xs, top: 0 };
    }
  })();

  return (
    <View pointerEvents="box-none" style={[styles.layer, anchor]}>
      <Pressable
        accessibilityLabel={t("canvas.handwriting.edgeHandle.accessibility")}
        accessibilityRole="button"
        hitSlop={hitSlop}
        onPress={onPress}
        style={({ pressed }) => [styles.handle, pressed ? styles.pressed : null]}
        testID="canvas-edge-reveal-handle"
      >
        <Ionicons color={colors.action.primary.foreground} name="construct-outline" size={15} />
        {!vertical ? (
          <Text selectable={false} style={[getAccessibleTextStyle(type.caption, settings), styles.label]}>
            {t("canvas.handwriting.edgeHandle.label")}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    alignItems: "center",
    backgroundColor: colors.action.primary.background,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.floating,
  },
  label: {
    color: colors.action.primary.foreground,
    fontWeight: "700",
  },
  layer: {
    position: "absolute",
  },
  pressed: {
    opacity: 0.8,
  },
});
