import { View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, spacing } from "@/design/tokens";

import type { CanvasTemplate } from "../types";

interface CanvasTemplatePreviewProps {
  template: CanvasTemplate;
  accent: string;
  /** "thumbnail" renders a compact square for list rows; "tile" fills a card header. */
  variant?: "thumbnail" | "tile";
  style?: StyleProp<ViewStyle>;
}

const line = (color: string, width: ViewStyle["width"] = "100%") => ({
  backgroundColor: color,
  borderRadius: radius.full,
  height: 3,
  width,
});

/**
 * Faint line-art that hints at each template's layout. Rendered with plain
 * Views (no SVG dependency) so it stays cheap to draw inside lists and grids.
 */
function TemplateArt({ template, accent }: { template: CanvasTemplate; accent: string }) {
  const faint = colors.border.strong;
  const soft = colors.border.default;

  switch (template) {
    case "lined_paper":
    case "handwriting_practice":
      return (
        <View style={{ gap: spacing.sm, width: "100%" }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View key={index} style={line(index % 2 === 0 ? faint : soft)} />
          ))}
        </View>
      );
    case "storyboard":
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, width: "100%" }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              style={{
                aspectRatio: 1.4,
                borderColor: soft,
                borderRadius: radius.xs,
                borderWidth: 1.5,
                width: "46%",
              }}
            />
          ))}
        </View>
      );
    case "mind_map":
      return (
        <View style={{ alignItems: "center", gap: spacing.xs, width: "100%" }}>
          <View style={{ backgroundColor: accent, borderRadius: radius.full, height: 18, width: 18 }} />
          <View style={{ flexDirection: "row", gap: spacing.lg }}>
            <View style={{ backgroundColor: soft, borderRadius: radius.full, height: 10, width: 10 }} />
            <View style={{ backgroundColor: soft, borderRadius: radius.full, height: 10, width: 10 }} />
            <View style={{ backgroundColor: soft, borderRadius: radius.full, height: 10, width: 10 }} />
          </View>
        </View>
      );
    case "essay_plan":
      return (
        <View style={{ gap: spacing.xs, width: "100%" }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <View
              key={index}
              style={{
                borderColor: soft,
                borderLeftColor: accent,
                borderLeftWidth: 3,
                borderRadius: radius.xs,
                borderWidth: 1.5,
                height: 12,
              }}
            />
          ))}
        </View>
      );
    case "vocabulary_web":
      return (
        <View style={{ alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, justifyContent: "center", width: "100%" }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              style={{
                borderColor: index === 0 ? accent : soft,
                borderRadius: radius.full,
                borderWidth: 1.5,
                height: 16,
                width: 26,
              }}
            />
          ))}
        </View>
      );
    case "annotate_passage":
      return (
        <View style={{ gap: spacing.xs, width: "100%" }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              style={line(index === 1 ? accent : soft, index === 3 ? "60%" : "100%")}
            />
          ))}
        </View>
      );
    case "blank_page":
      return (
        <View
          style={{
            borderColor: soft,
            borderRadius: radius.sm,
            borderStyle: "dashed",
            borderWidth: 1.5,
            flex: 1,
            width: "100%",
          }}
        />
      );
  }
}

export function CanvasTemplatePreview({ template, accent, variant = "thumbnail", style }: CanvasTemplatePreviewProps) {
  const isTile = variant === "tile";

  return (
    <View
      pointerEvents="none"
      style={[
        {
          alignItems: "center",
          backgroundColor: colors.background.canvas,
          borderColor: colors.border.default,
          borderRadius: isTile ? radius.lg : radius.md,
          borderWidth: 1,
          justifyContent: "center",
          overflow: "hidden",
          padding: isTile ? spacing.md : spacing.sm,
        },
        isTile ? { height: 92, width: "100%" } : { height: 56, width: 56 },
        style,
      ]}
    >
      <TemplateArt accent={accent} template={template} />
    </View>
  );
}
