import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors, layout, radius, shadows, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasDocumentSummary } from "../types";
import { CanvasSyncStatusBadge } from "./CanvasSyncStatusBadge";
import { CanvasTemplatePill } from "./CanvasTemplatePill";
import { CanvasTemplatePreview } from "./CanvasTemplatePreview";

interface CanvasDocumentCardProps {
  document: CanvasDocumentSummary;
  gradeBand: GradeBand;
  onOpen: () => void;
}

export function CanvasDocumentCard({ document, gradeBand, onOpen }: CanvasDocumentCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const accent = colors.gradeBand[gradeBand].accent;

  return (
    <Pressable
      accessibilityHint={t("canvas.home.cardHint")}
      accessibilityLabel={buildAccessibilityLabel([
        t("canvas.home.cardAccessibility"),
        document.title,
        t(`canvas.sync.${document.syncStatus}`),
      ])}
      accessibilityRole="button"
      hitSlop={layout.hitSlop}
      onPress={onOpen}
      testID={`canvas-document-${document.id}`}
      style={({ pressed }) => [
        {
          alignItems: "center",
          backgroundColor: pressed ? colors.background.subtle : colors.background.surface,
          borderColor: colors.border.default,
          borderCurve: "continuous",
          borderRadius: radius.xl,
          borderWidth: 1,
          flexDirection: "row",
          gap: spacing.md,
          padding: spacing.md,
          ...shadows.card,
        },
      ]}
    >
      <CanvasTemplatePreview accent={accent} template={document.template} />

      <View style={{ flex: 1, gap: spacing.xs }}>
        <View style={{ alignItems: "center", flexDirection: "row", gap: spacing.sm }}>
          <Text
            numberOfLines={1}
            selectable
            style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text, flexShrink: 1 }]}
          >
            {document.title}
          </Text>
          {document.isAttached ? (
            <View
              style={{
                backgroundColor: colors.feedback.info.background,
                borderRadius: radius.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xxs,
              }}
            >
              <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.feedback.info.text }]}>
                {t("canvas.home.attachedLabel")}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <CanvasTemplatePill gradeBand={gradeBand} template={document.template} />
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {document.updatedLabel}
          </Text>
        </View>

        <CanvasSyncStatusBadge gradeBand={gradeBand} status={document.syncStatus} />
      </View>

      <Ionicons color={colors.text.muted} name="chevron-forward" size={20} />
    </Pressable>
  );
}
