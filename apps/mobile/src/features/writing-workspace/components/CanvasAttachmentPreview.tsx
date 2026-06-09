import { Text, View } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { EmptyState } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { WritingCanvasAttachment } from "../types";

interface CanvasAttachmentPreviewProps {
  attachment: WritingCanvasAttachment | null;
  gradeBand: GradeBand;
  onOpenCanvas: () => void;
}

export function CanvasAttachmentPreview({ attachment, gradeBand, onOpenCanvas }: CanvasAttachmentPreviewProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={t("writingWorkspace.canvas.accessibility")}
      gradeBand={gradeBand}
      testID="writing-workspace-canvas"
      title={t("writingWorkspace.canvas.title")}
    >
      {attachment ? (
        <Stack gap="md">
          <View
            style={{
              backgroundColor: colors.background.canvas,
              borderColor: accessibleColors.border,
              borderRadius: radius.md,
              borderWidth: 1,
              minHeight: 96,
              padding: spacing.lg,
            }}
          >
            <Stack gap="xs">
              <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
                {attachment.title}
              </Text>
              <Inline gap="sm">
                <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
                  {t("writingWorkspace.canvas.pages", { count: attachment.pageCount })}
                </Text>
                <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
                  {attachment.updatedLabel}
                </Text>
              </Inline>
            </Stack>
          </View>
          <Button
            accessibilityHint={t("writingWorkspace.canvas.openHint")}
            accessibilityLabel={t("writingWorkspace.canvas.openAccessibility")}
            gradeBand={gradeBand}
            label={t("writingWorkspace.canvas.openCta")}
            onPress={onOpenCanvas}
            size={gradeBand === "elementary" ? "lg" : "md"}
            variant="secondary"
          />
        </Stack>
      ) : (
        <EmptyState
          actionLabel={t("writingWorkspace.canvas.addCta")}
          accessibilityLabel={t("writingWorkspace.canvas.emptyAccessibility")}
          description={t("writingWorkspace.canvas.emptyDescription")}
          gradeBand={gradeBand}
          onActionPress={onOpenCanvas}
          title={t("writingWorkspace.canvas.emptyTitle")}
        />
      )}
    </Card>
  );
}
