import { Pressable, Text } from "react-native";

import { colors, layout, radius, shadows, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasTemplateDefinition } from "../types";
import { CanvasTemplatePreview } from "./CanvasTemplatePreview";

interface CanvasTemplateCardProps {
  definition: CanvasTemplateDefinition;
  disabled?: boolean;
  gradeBand: GradeBand;
  onSelect: () => void;
  showDescription: boolean;
}

export function CanvasTemplateCard({
  definition,
  disabled = false,
  gradeBand,
  onSelect,
  showDescription,
}: CanvasTemplateCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const accent = colors.gradeBand[gradeBand].accent;

  return (
    <Pressable
      accessibilityHint={t("canvas.templates.cardHint")}
      accessibilityLabel={buildAccessibilityLabel([t("canvas.templates.cardAccessibility"), t(definition.labelKey)])}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={layout.hitSlop}
      onPress={onSelect}
      testID={`canvas-template-${definition.template}`}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? colors.background.subtle : colors.background.surface,
          borderColor: colors.border.default,
          borderCurve: "continuous",
          borderRadius: radius.xl,
          borderWidth: 1,
          gap: spacing.sm,
          opacity: disabled ? 0.6 : 1,
          padding: spacing.md,
          ...shadows.card,
        },
      ]}
    >
      <CanvasTemplatePreview accent={accent} template={definition.template} variant="tile" />
      <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
        {t(definition.labelKey)}
      </Text>
      {showDescription ? (
        <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: colors.text.secondary }]}>
          {t(definition.descriptionKey)}
        </Text>
      ) : null}
    </Pressable>
  );
}
