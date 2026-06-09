import { useState } from "react";
import { Pressable, Text, View, type GestureResponderEvent } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasDocument, CanvasGradeAdaptation, CanvasPoint, CanvasTemplate } from "../types";

interface StrokeCanvasAdapterProps {
  document: CanvasDocument;
  gradeAdaptation: CanvasGradeAdaptation;
  gradeBand: GradeBand;
  onAddPoint: (point: CanvasPoint) => void;
}

function TemplateGuides({ template }: { template: CanvasTemplate }) {
  const { t } = useI18n();

  switch (template) {
    case "lined_paper":
    case "handwriting_practice":
      return (
        <View style={{ gap: spacing.lg, paddingTop: spacing.xl }}>
          {Array.from({ length: template === "handwriting_practice" ? 7 : 9 }).map((_, index) => (
            <View
              key={index}
              style={{
                borderBottomColor: index % 2 === 0 ? colors.border.strong : colors.border.default,
                borderBottomWidth: 1,
                height: template === "handwriting_practice" ? 28 : 22,
              }}
            />
          ))}
        </View>
      );
    case "storyboard":
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              style={{
                borderColor: colors.border.default,
                borderRadius: radius.md,
                borderWidth: 1,
                height: 128,
                width: "47%",
              }}
            />
          ))}
        </View>
      );
    case "mind_map":
      return (
        <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          <View
            style={{
              borderColor: colors.border.strong,
              borderRadius: radius.full,
              borderWidth: 1,
              height: 112,
              width: 112,
            }}
          />
          <View style={{ flexDirection: "row", gap: spacing.xxl, marginTop: spacing.xl }}>
            <View style={{ borderBottomColor: colors.border.default, borderBottomWidth: 1, width: 96 }} />
            <View style={{ borderBottomColor: colors.border.default, borderBottomWidth: 1, width: 96 }} />
          </View>
        </View>
      );
    case "essay_plan":
      return (
        <View style={{ gap: spacing.md }}>
          {[
            t("canvas.templates.essayPlanGuides.claim"),
            t("canvas.templates.essayPlanGuides.evidence"),
            t("canvas.templates.essayPlanGuides.explain"),
            t("canvas.templates.essayPlanGuides.revise"),
          ].map((label) => (
            <View
              key={label}
              style={{
                borderColor: colors.border.default,
                borderRadius: radius.md,
                borderWidth: 1,
                minHeight: 72,
                padding: spacing.md,
              }}
            >
              <Text selectable style={[typography.roles.caption, { color: colors.text.muted }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      );
    case "vocabulary_web":
      return (
        <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, justifyContent: "center" }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                style={{
                  borderColor: colors.border.default,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  height: 78,
                  width: 118,
                }}
              />
            ))}
          </View>
        </View>
      );
    case "annotate_passage":
      return (
        <View style={{ gap: spacing.md }}>
          {Array.from({ length: 7 }).map((_, index) => (
            <View
              key={index}
              style={{
                backgroundColor: index % 2 === 0 ? colors.background.surface : colors.background.subtle,
                borderRadius: radius.sm,
                height: 18,
              }}
            />
          ))}
        </View>
      );
    case "blank_page":
      return null;
  }
}

export function StrokeCanvasAdapter({
  document,
  gradeAdaptation,
  gradeBand,
  onAddPoint,
}: StrokeCanvasAdapterProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const [layout, setLayout] = useState({ height: gradeAdaptation.surfaceMinHeight, width: 1 });

  const handlePress = (event: GestureResponderEvent) => {
    onAddPoint({
      x: event.nativeEvent.locationX / Math.max(1, layout.width),
      y: event.nativeEvent.locationY / Math.max(1, layout.height),
    });
  };

  return (
    <View
      accessibilityLabel={t("canvas.surface.accessibility")}
      testID="canvas-surface"
      style={{
        backgroundColor: colors.background.canvas,
        borderColor: accessibleColors.border,
        borderRadius: radius.md,
        borderWidth: 1,
        minHeight: gradeAdaptation.surfaceMinHeight,
        overflow: "hidden",
      }}
    >
      <Pressable
        accessibilityHint={t("canvas.surface.hint")}
        accessibilityRole="button"
        onLayout={(event) => {
          setLayout({
            height: event.nativeEvent.layout.height,
            width: event.nativeEvent.layout.width,
          });
        }}
        onPress={handlePress}
        style={{
          minHeight: gradeAdaptation.surfaceMinHeight,
          padding: spacing.lg,
        }}
      >
        <TemplateGuides template={document.template} />

        {document.strokes.length === 0 ? (
          <View
            pointerEvents="none"
            style={{
              alignItems: "center",
              bottom: spacing.xl,
              left: spacing.lg,
              position: "absolute",
              right: spacing.lg,
            }}
          >
            <Text
              selectable
              style={[getAccessibleTextStyle(type.bodySmall, settings), { color: colors.text.muted, textAlign: "center" }]}
            >
              {t("canvas.surface.emptyHint")}
            </Text>
          </View>
        ) : null}

        {document.strokes.map((stroke) =>
          stroke.points.map((point, index) => (
            <View
              key={`${stroke.id}-${index}`}
              pointerEvents="none"
              style={{
                backgroundColor: stroke.color,
                borderRadius: radius.full,
                height: stroke.width,
                left: `${point.x * 100}%`,
                opacity: stroke.opacity ?? 1,
                position: "absolute",
                top: `${point.y * 100}%`,
                width: stroke.width,
              }}
            />
          )),
        )}
      </Pressable>
    </View>
  );
}
