import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, View } from "react-native";

import { colors, layout, radius, spacing, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getMinimumTouchTarget,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useCanvasToolStore } from "../stores/canvasToolStore";
import type { CanvasTool } from "../types";
import { toolIcon } from "./canvasVisuals";

interface CanvasToolbarProps {
  canRedo: boolean;
  canUndo: boolean;
  gradeBand: GradeBand;
  onRedo: () => void;
  onUndo: () => void;
}

const toolOptions: CanvasTool[] = ["pen", "highlighter", "eraser"];
const colorOptions = ["#0F172A", "#2563EB", "#0F766E", "#B45309", "#B91C1C"] as const;
const colorNameKeys = {
  "#0F172A": "canvas.toolbar.colors.ink",
  "#2563EB": "canvas.toolbar.colors.blue",
  "#0F766E": "canvas.toolbar.colors.teal",
  "#B45309": "canvas.toolbar.colors.amber",
  "#B91C1C": "canvas.toolbar.colors.red",
} as const;
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

function Divider() {
  return <View style={{ alignSelf: "center", backgroundColor: colors.border.default, height: 24, width: 1 }} />;
}

export function CanvasToolbar({ canRedo, canUndo, gradeBand, onRedo, onUndo }: CanvasToolbarProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const selectedTool = useCanvasToolStore((store) => store.selectedTool);
  const selectedColor = useCanvasToolStore((store) => store.color);
  const selectedWidth = useCanvasToolStore((store) => store.width);
  const setTool = useCanvasToolStore((store) => store.setTool);
  const setColor = useCanvasToolStore((store) => store.setColor);
  const setWidth = useCanvasToolStore((store) => store.setWidth);
  const hitSlop = getAccessibleHitSlop(settings);
  const target = Math.max(getMinimumTouchTarget(settings), gradeBand === "elementary" ? layout.touchTargetLarge : layout.touchTarget);
  const swatch = Math.min(target, 36);

  return (
    <View
      accessibilityLabel={t("canvas.toolbar.accessibility")}
      style={{
        backgroundColor: colors.background.surface,
        borderBottomColor: colors.border.default,
        borderBottomWidth: 1,
        borderTopColor: colors.border.default,
        borderTopWidth: 1,
      }}
    >
      <ScrollView
        horizontal
        contentContainerStyle={{
          alignItems: "center",
          gap: spacing.sm,
          minWidth: "100%",
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        }}
        showsHorizontalScrollIndicator={false}
      >
        <Pressable
          accessibilityLabel={t("canvas.toolbar.undo")}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canUndo }}
          disabled={!canUndo}
          hitSlop={hitSlop}
          onPress={onUndo}
          style={({ pressed }) => [
            {
              alignItems: "center",
              backgroundColor: pressed ? colors.background.subtle : "transparent",
              borderRadius: radius.full,
              height: target,
              justifyContent: "center",
              opacity: canUndo ? 1 : 0.35,
              width: target,
            },
          ]}
        >
          <Ionicons color={colors.text.secondary} name="arrow-undo-outline" size={22} />
        </Pressable>
        <Pressable
          accessibilityLabel={t("canvas.toolbar.redo")}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canRedo }}
          disabled={!canRedo}
          hitSlop={hitSlop}
          onPress={onRedo}
          style={({ pressed }) => [
            {
              alignItems: "center",
              backgroundColor: pressed ? colors.background.subtle : "transparent",
              borderRadius: radius.full,
              height: target,
              justifyContent: "center",
              opacity: canRedo ? 1 : 0.35,
              width: target,
            },
          ]}
        >
          <Ionicons color={colors.text.secondary} name="arrow-redo-outline" size={22} />
        </Pressable>

        <Divider />

        {toolOptions.map((tool) => {
          const selected = selectedTool === tool;
          return (
            <Pressable
              accessibilityLabel={t(getToolKey(tool))}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              hitSlop={hitSlop}
              key={tool}
              onPress={() => setTool(tool)}
              style={({ pressed }) => [
                {
                  alignItems: "center",
                  backgroundColor: selected
                    ? colors.action.primary.background
                    : pressed
                      ? colors.background.subtle
                      : "transparent",
                  borderRadius: radius.full,
                  height: target,
                  justifyContent: "center",
                  width: target,
                },
              ]}
            >
              <Ionicons
                color={selected ? colors.action.primary.foreground : colors.text.secondary}
                name={toolIcon[tool]}
                size={20}
              />
            </Pressable>
          );
        })}

        <Divider />

        {colorOptions.map((color) => {
          const selected = selectedColor === color;
          return (
            <Pressable
              accessibilityLabel={t("canvas.toolbar.colorAccessibility", { color: t(colorNameKeys[color]) })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              hitSlop={hitSlop}
              key={color}
              onPress={() => setColor(color)}
              style={({ pressed }) => [
                {
                  alignItems: "center",
                  backgroundColor: pressed ? colors.background.subtle : "transparent",
                  borderColor: selected ? accessibleColors.focus : "transparent",
                  borderRadius: radius.full,
                  borderWidth: 2,
                  height: swatch + 8,
                  justifyContent: "center",
                  width: swatch + 8,
                },
              ]}
            >
              <View style={{ backgroundColor: color, borderRadius: radius.full, height: swatch, width: swatch }} />
            </Pressable>
          );
        })}

        <Divider />

        {widthOptions.map((width) => {
          const selected = selectedWidth === width;
          return (
            <Pressable
              accessibilityLabel={t("canvas.toolbar.strokeSizeAccessibility", { size: width })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              hitSlop={hitSlop}
              key={width}
              onPress={() => setWidth(width)}
              style={({ pressed }) => [
                {
                  alignItems: "center",
                  backgroundColor: selected || pressed ? colors.background.subtle : "transparent",
                  borderColor: selected ? accessibleColors.focus : colors.border.default,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  height: target,
                  justifyContent: "center",
                  width: target,
                },
              ]}
            >
              <View
                style={{
                  backgroundColor: colors.text.primary,
                  borderRadius: radius.full,
                  height: Math.min(width + 4, 16),
                  width: Math.min(width + 4, 16),
                }}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
