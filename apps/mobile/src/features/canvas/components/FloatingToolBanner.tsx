import { StyleSheet, View } from "react-native";

import { colors, radius, shadows, spacing, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";

import { useCanvasToolStore } from "../stores/canvasToolStore";
import type { CanvasBannerPosition } from "../types";
import { CanvasToolButton } from "./CanvasToolButton";
import { LineToggleButton } from "./LineToggleButton";
import { PenSizeSlider } from "./PenSizeSlider";

interface FloatingToolBannerProps {
  colorPickerOpen: boolean;
  gradeBand: GradeBand;
  heightOpen: boolean;
  onHide: () => void;
  onToggleColorPicker: () => void;
  onToggleHeight: () => void;
  onTogglePosition: () => void;
  position: CanvasBannerPosition;
  positionOpen: boolean;
}

function Divider({ vertical }: { vertical: boolean }) {
  return (
    <View
      style={[
        styles.divider,
        vertical ? { height: 1, marginVertical: 2, width: 24 } : { height: 24, marginHorizontal: 2, width: 1 },
      ]}
    />
  );
}

/**
 * Minimal floating tool banner. Holds only the essentials — pen, eraser, the
 * dual-purpose pen-size slider, line toggle, canvas-height control, banner
 * position control, and a hide affordance — and adapts its orientation to the
 * banner edge (horizontal on top/bottom, vertical on left/right).
 */
export function FloatingToolBanner({
  colorPickerOpen,
  gradeBand,
  heightOpen,
  onHide,
  onToggleColorPicker,
  onToggleHeight,
  onTogglePosition,
  position,
  positionOpen,
}: FloatingToolBannerProps) {
  const { t } = useI18n();
  const selectedTool = useCanvasToolStore((store) => store.selectedTool);
  const setTool = useCanvasToolStore((store) => store.setTool);
  const vertical = position === "left" || position === "right";

  return (
    <View
      accessibilityLabel={t("canvas.handwriting.banner.accessibility")}
      style={[styles.banner, vertical ? styles.bannerVertical : styles.bannerHorizontal]}
      testID="canvas-tool-banner"
    >
      <CanvasToolButton
        accessibilityLabel={t("canvas.handwriting.tools.penAccessibility")}
        active={selectedTool !== "eraser"}
        gradeBand={gradeBand}
        icon="pencil"
        onPress={() => setTool("pen")}
        testID="canvas-tool-pen"
      />
      <CanvasToolButton
        accessibilityLabel={t("canvas.handwriting.tools.eraserAccessibility")}
        active={selectedTool === "eraser"}
        gradeBand={gradeBand}
        icon="backspace-outline"
        onPress={() => setTool("eraser")}
        testID="canvas-tool-eraser"
      />

      <Divider vertical={vertical} />

      <PenSizeSlider
        colorPickerOpen={colorPickerOpen}
        gradeBand={gradeBand}
        onToggleColorPicker={onToggleColorPicker}
      />

      <Divider vertical={vertical} />

      <LineToggleButton gradeBand={gradeBand} />
      <CanvasToolButton
        accessibilityLabel={t("canvas.handwriting.height.label")}
        active={heightOpen}
        gradeBand={gradeBand}
        icon="resize-outline"
        onPress={onToggleHeight}
        testID="canvas-height-trigger"
      />
      <CanvasToolButton
        accessibilityLabel={t("canvas.handwriting.position.label")}
        active={positionOpen}
        gradeBand={gradeBand}
        icon="move-outline"
        onPress={onTogglePosition}
        testID="canvas-position-trigger"
      />

      <Divider vertical={vertical} />

      <CanvasToolButton
        accessibilityLabel={t("canvas.handwriting.banner.hideAccessibility")}
        gradeBand={gradeBand}
        icon="chevron-collapse-outline"
        onPress={onHide}
        testID="canvas-banner-hide"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: "center",
    backgroundColor: colors.dashboard.cardTranslucent,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs,
    ...shadows.floating,
  },
  bannerHorizontal: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bannerVertical: {
    flexDirection: "column",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  divider: {
    backgroundColor: colors.border.default,
  },
});
