import { StyleSheet, Text, View } from "react-native";

import { typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import { useCanvasToolStore } from "../stores/canvasToolStore";
import { CanvasToolButton } from "./CanvasToolButton";

interface LineToggleButtonProps {
  gradeBand: GradeBand;
  showLabel?: boolean;
}

/** Toggles the ruled guide lines on the canvas surface. */
export function LineToggleButton({ gradeBand, showLabel = false }: LineToggleButtonProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const showLines = useCanvasToolStore((store) => store.showLines);
  const toggleLines = useCanvasToolStore((store) => store.toggleLines);

  return (
    <View style={styles.wrapper}>
      <CanvasToolButton
        accessibilityLabel={
          showLines ? t("canvas.handwriting.lines.hideAccessibility") : t("canvas.handwriting.lines.showAccessibility")
        }
        active={showLines}
        gradeBand={gradeBand}
        icon="reorder-four-outline"
        onPress={toggleLines}
        testID="canvas-line-toggle"
      />
      {showLabel ? (
        <Text
          selectable={false}
          style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}
        >
          {t("canvas.handwriting.lines.label")}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 2,
  },
});
