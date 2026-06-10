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
import { CanvasTemplatePill } from "./CanvasTemplatePill";
import { CanvasTemplatePreview } from "./CanvasTemplatePreview";

interface CanvasSelectableDocumentCardProps {
  document: CanvasDocumentSummary;
  gradeBand: GradeBand;
  selected: boolean;
  onSelect: () => void;
}

export function CanvasSelectableDocumentCard({
  document,
  gradeBand,
  selected,
  onSelect,
}: CanvasSelectableDocumentCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const accent = colors.gradeBand[gradeBand].accent;
  const selectedColor = settings.highContrast ? accessibleColors.focus : colors.action.primary.background;

  return (
    <Pressable
      accessibilityHint={t("canvas.attachment.selectHint")}
      accessibilityLabel={buildAccessibilityLabel([t("canvas.attachment.selectAccessibility"), document.title])}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected }}
      hitSlop={layout.hitSlop}
      onPress={onSelect}
      testID={`canvas-attach-${document.id}`}
      style={[
        {
          alignItems: "center",
          backgroundColor: selected ? colors.background.subtle : colors.background.surface,
          borderColor: selected ? selectedColor : colors.border.default,
          borderCurve: "continuous",
          borderRadius: radius.xl,
          borderWidth: selected ? 2 : 1,
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
          {document.syncStatus === "saved" ? (
            <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.success }]}>
              {t("canvas.sync.saved")}
            </Text>
          ) : null}
        </View>

        <CanvasTemplatePill gradeBand={gradeBand} template={document.template} />

        <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
          {t("canvas.attachment.cardMeta", { count: document.strokeCount, updated: document.updatedLabel })}
        </Text>
      </View>

      <View
        style={{
          alignItems: "center",
          backgroundColor: selected ? selectedColor : "transparent",
          borderColor: selected ? selectedColor : colors.border.strong,
          borderRadius: radius.full,
          borderWidth: 2,
          height: 26,
          justifyContent: "center",
          width: 26,
        }}
      >
        {selected ? <Ionicons color={colors.action.primary.foreground} name="checkmark" size={16} /> : null}
      </View>
    </Pressable>
  );
}
