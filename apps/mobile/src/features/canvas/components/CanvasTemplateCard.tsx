import { Text } from "react-native";

import { Card } from "@/shared/components/cards";
import { Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasTemplateDefinition } from "../types";

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
  const type = typography.gradeBands[gradeBand];

  return (
    <Card
      accessibilityHint={t("canvas.templates.cardHint")}
      accessibilityLabel={buildAccessibilityLabel([t("canvas.templates.cardAccessibility"), t(definition.labelKey)])}
      gradeBand={gradeBand}
      onPress={disabled ? undefined : onSelect}
      testID={`canvas-template-${definition.template}`}
      title={t(definition.labelKey)}
      variant="accent"
    >
      <Stack gap="sm">
        {showDescription ? (
          <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: colors.text.secondary }]}>
            {t(definition.descriptionKey)}
          </Text>
        ) : null}
        <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
          {t("canvas.templates.selectCta")}
        </Text>
      </Stack>
    </Card>
  );
}
