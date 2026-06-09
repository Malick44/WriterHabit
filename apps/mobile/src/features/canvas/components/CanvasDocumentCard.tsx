import { Text } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasDocumentSummary } from "../types";
import { CanvasSyncStatusBadge } from "./CanvasSyncStatusBadge";

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

  return (
    <Card
      accessibilityHint={t("canvas.home.cardHint")}
      accessibilityLabel={buildAccessibilityLabel([t("canvas.home.cardAccessibility"), document.title])}
      gradeBand={gradeBand}
      onPress={onOpen}
      testID={`canvas-document-${document.id}`}
      title={document.title}
    >
      <Stack gap="md">
        <Inline gap="sm">
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {t("canvas.home.strokeCount", { count: document.strokeCount })}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {document.updatedLabel}
          </Text>
        </Inline>
        <Inline align="center" gap="sm" justify="space-between">
          <CanvasSyncStatusBadge gradeBand={gradeBand} status={document.syncStatus} />
          {document.isAttached ? (
            <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.text }]}>
              {t("canvas.home.attachedLabel")}
            </Text>
          ) : null}
        </Inline>
        <Button
          accessibilityLabel={t("canvas.home.openAccessibility")}
          gradeBand={gradeBand}
          label={t("canvas.home.openCta")}
          onPress={onOpen}
          size={gradeBand === "elementary" ? "lg" : "md"}
          variant="secondary"
        />
      </Stack>
    </Card>
  );
}
