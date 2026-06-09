import { Pressable, Text, View } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, layout, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useCanvasToolStore } from "../stores/canvasToolStore";
import type { CanvasTool } from "../types";
import { CanvasSyncStatusBadge } from "./CanvasSyncStatusBadge";

interface CanvasToolbarProps {
  canAttach: boolean;
  canRedo: boolean;
  canUndo: boolean;
  gradeBand: GradeBand;
  onAttach: () => void;
  onRedo: () => void;
  onSave: () => void;
  onUndo: () => void;
  syncStatus: "local_only" | "saving" | "saved" | "sync_failed";
}

const toolOptions: CanvasTool[] = ["pen", "highlighter", "eraser"];
const colorOptions = ["#0F172A", "#2563EB", "#0F766E", "#B45309", "#B91C1C"];
const widthOptions = [3, 5, 8, 12];

function getToolKey(tool: CanvasTool) {
  switch (tool) {
    case "pen":
      return "canvas.toolbar.pen";
    case "eraser":
      return "canvas.toolbar.eraser";
    case "highlighter":
      return "canvas.toolbar.highlighter";
  }
}

export function CanvasToolbar({
  canAttach,
  canRedo,
  canUndo,
  gradeBand,
  onAttach,
  onRedo,
  onSave,
  onUndo,
  syncStatus,
}: CanvasToolbarProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const selectedTool = useCanvasToolStore((store) => store.selectedTool);
  const selectedColor = useCanvasToolStore((store) => store.color);
  const selectedWidth = useCanvasToolStore((store) => store.width);
  const setTool = useCanvasToolStore((store) => store.setTool);
  const setColor = useCanvasToolStore((store) => store.setColor);
  const setWidth = useCanvasToolStore((store) => store.setWidth);
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const minTarget = Math.max(getMinimumTouchTarget(settings), gradeBand === "elementary" ? layout.touchTargetLarge : layout.touchTarget);

  return (
    <Card
      accessibilityLabel={t("canvas.toolbar.accessibility")}
      gradeBand={gradeBand}
      testID="canvas-toolbar"
      title={t("canvas.toolbar.title")}
    >
      <Stack gap="md">
        <Inline align="center" gap="sm" justify="space-between">
          <CanvasSyncStatusBadge gradeBand={gradeBand} status={syncStatus} />
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {t("canvas.toolbar.adapterNote")}
          </Text>
        </Inline>

        <Inline gap="sm">
          {toolOptions.map((tool) => {
            const selected = selectedTool === tool;
            return (
              <Button
                accessibilityLabel={t(getToolKey(tool))}
                gradeBand={gradeBand}
                key={tool}
                label={t(getToolKey(tool))}
                onPress={() => setTool(tool)}
                size="sm"
                variant={selected ? "primary" : "secondary"}
              />
            );
          })}
        </Inline>

        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.text }]}>
            {t("canvas.toolbar.color")}
          </Text>
          <Inline gap="sm">
            {colorOptions.map((color) => (
              <Pressable
                accessibilityLabel={t("canvas.toolbar.colorAccessibility", { color })}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedColor === color }}
                hitSlop={getAccessibleHitSlop(settings)}
                key={color}
                onPress={() => setColor(color)}
                style={{
                  alignItems: "center",
                  backgroundColor: color,
                  borderColor: selectedColor === color ? accessibleColors.focus : accessibleColors.border,
                  borderRadius: radius.full,
                  borderWidth: selectedColor === color ? 3 : 1,
                  height: minTarget,
                  justifyContent: "center",
                  width: minTarget,
                }}
              >
                <View
                  style={{
                    backgroundColor: selectedColor === color ? colors.background.surface : "transparent",
                    borderRadius: radius.full,
                    height: 10,
                    width: 10,
                  }}
                />
              </Pressable>
            ))}
          </Inline>
        </Stack>

        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.text }]}>
            {t("canvas.toolbar.strokeSize")}
          </Text>
          <Inline gap="sm">
            {widthOptions.map((width) => (
              <Button
                accessibilityLabel={t("canvas.toolbar.strokeSizeAccessibility", { size: width })}
                gradeBand={gradeBand}
                key={width}
                label={String(width)}
                onPress={() => setWidth(width)}
                size="sm"
                variant={selectedWidth === width ? "primary" : "secondary"}
              />
            ))}
          </Inline>
        </Stack>

        <Inline gap="sm">
          <Button
            accessibilityLabel={t("canvas.toolbar.undo")}
            disabled={!canUndo}
            gradeBand={gradeBand}
            label={t("canvas.toolbar.undo")}
            onPress={onUndo}
            size="sm"
            variant="secondary"
          />
          <Button
            accessibilityLabel={t("canvas.toolbar.redo")}
            disabled={!canRedo}
            gradeBand={gradeBand}
            label={t("canvas.toolbar.redo")}
            onPress={onRedo}
            size="sm"
            variant="secondary"
          />
          <Button
            accessibilityLabel={t("canvas.toolbar.save")}
            gradeBand={gradeBand}
            label={t("canvas.toolbar.save")}
            loading={syncStatus === "saving"}
            onPress={onSave}
            size="sm"
            variant="secondary"
          />
          <Button
            accessibilityHint={canAttach ? t("canvas.toolbar.attachHint") : t("canvas.toolbar.attachDisabledHint")}
            accessibilityLabel={t("canvas.toolbar.attach")}
            disabled={!canAttach}
            gradeBand={gradeBand}
            label={t("canvas.toolbar.attach")}
            onPress={onAttach}
            size="sm"
          />
        </Inline>
      </Stack>
    </Card>
  );
}
