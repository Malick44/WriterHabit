import { StyleSheet, View } from "react-native";

import { colors, radius, shadows, type GradeBand } from "@/design/tokens";
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
        vertical ? { height: 1, width: 18 } : { height: 18, width: 1 },
      ]}
    />
  );
}

function EraserGlyph({ active }: { active: boolean }) {
  return (
    <View style={styles.eraserGlyph}>
      <View style={[styles.eraserBody, active ? styles.eraserBodyActive : null]}>
        <View style={[styles.eraserTip, active ? styles.eraserTipActive : null]} />
        <View style={[styles.eraserSleeve, active ? styles.eraserSleeveActive : null]} />
      </View>
      <View style={[styles.eraserDust, active ? styles.eraserDustActive : null]} />
    </View>
  );
}

/**
 * Minimal floating tool banner. Holds only the essentials — a pen/eraser
 * switch, the dual-purpose pen-size slider, line toggle, canvas-height control,
 * banner position control, and a hide affordance — and adapts its orientation
 * to the banner edge (horizontal on top/bottom, vertical on left/right).
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
  const eraserSelected = selectedTool === "eraser";
  const nextTool = eraserSelected ? "pen" : "eraser";

  return (
    <View
      accessibilityLabel={t("canvas.handwriting.banner.accessibility")}
      style={[styles.banner, vertical ? styles.bannerVertical : styles.bannerHorizontal]}
      testID="canvas-tool-banner"
    >
      <CanvasToolButton
        accessibilityLabel={
          eraserSelected
            ? t("canvas.handwriting.tools.switchToPenAccessibility")
            : t("canvas.handwriting.tools.switchToEraserAccessibility")
        }
        gradeBand={gradeBand}
        icon={eraserSelected ? "pencil" : "remove-outline"}
        onPress={() => setTool(nextTool)}
        testID="canvas-tool-toggle"
      >
        {eraserSelected ? null : <EraserGlyph active={false} />}
      </CanvasToolButton>

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
        icon="add-circle-outline"
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
    gap: 0,
    ...shadows.floating,
  },
  bannerHorizontal: {
    flexDirection: "row",
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  bannerVertical: {
    flexDirection: "column",
    paddingHorizontal: 3,
    paddingVertical: 5,
  },
  divider: {
    backgroundColor: colors.border.default,
  },
  eraserBody: {
    alignItems: "center",
    backgroundColor: "#F8A7B8",
    borderColor: colors.text.primary,
    borderRadius: 3,
    borderWidth: 1.3,
    flexDirection: "row",
    height: 11,
    overflow: "hidden",
    transform: [{ rotate: "-28deg" }],
    width: 19,
  },
  eraserBodyActive: {
    borderColor: colors.action.primary.foreground,
  },
  eraserDust: {
    backgroundColor: colors.text.primary,
    borderRadius: radius.full,
    height: 2,
    opacity: 0.55,
    position: "absolute",
    right: 1,
    top: 15,
    width: 7,
  },
  eraserDustActive: {
    backgroundColor: colors.action.primary.foreground,
  },
  eraserGlyph: {
    height: 19,
    justifyContent: "center",
    position: "relative",
    width: 21,
  },
  eraserSleeve: {
    backgroundColor: "#FDE7EC",
    borderLeftColor: colors.text.primary,
    borderLeftWidth: 1,
    height: "100%",
    width: 8,
  },
  eraserSleeveActive: {
    borderLeftColor: colors.action.primary.foreground,
  },
  eraserTip: {
    flex: 1,
  },
  eraserTipActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
