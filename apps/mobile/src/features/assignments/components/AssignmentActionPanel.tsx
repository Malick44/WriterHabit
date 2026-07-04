import { Text } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { StatusState } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { AssignmentRecord } from "../types";

interface AssignmentActionPanelProps {
  assignment: AssignmentRecord;
  canStartCanvas: boolean;
  canStartWriting: boolean;
  canSubmit: boolean;
  gradeBand: GradeBand;
  onStartCanvas: () => void;
  onStartWriting: () => void;
  onSubmitPress: () => void;
  startStatus: "idle" | "loading" | "error" | "success";
}

export function AssignmentActionPanel({
  assignment,
  canStartCanvas,
  canStartWriting,
  canSubmit,
  gradeBand,
  onStartCanvas,
  onStartWriting,
  onSubmitPress,
  startStatus,
}: AssignmentActionPanelProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={t("assignments.detail.actionsAccessibility")}
      gradeBand={gradeBand}
      testID="assignment-detail-actions"
      title={t("assignments.detail.actionsTitle")}
    >
      <Stack gap="md">
        <Text
          selectable
          style={[
            getAccessibleTextStyle(type.bodySmall, settings),
            { color: accessibleColors.mutedText },
          ]}
        >
          {t("assignments.detail.actionsDescription")}
        </Text>

        {startStatus === "error" ? (
          <StatusState
            accessibilityLabel={t("assignments.detail.startErrorAccessibility")}
            description={t("assignments.detail.startErrorDescription")}
            gradeBand={gradeBand}
            title={t("assignments.detail.startErrorTitle")}
            tone="error"
          />
        ) : null}

        <Inline align="stretch" gap="sm">
          <Button
            accessibilityHint={t("assignments.detail.startWritingHint")}
            accessibilityLabel={t(
              "assignments.detail.startWritingAccessibility",
            )}
            disabled={!canStartWriting}
            gradeBand={gradeBand}
            label={
              assignment.status === "not_started"
                ? t("assignments.startWriting")
                : t("assignments.continueDraft")
            }
            loading={startStatus === "loading"}
            onPress={onStartWriting}
            size={gradeBand === "elementary" ? "lg" : "md"}
            style={{ flexGrow: 1 }}
          />
          <Button
            accessibilityHint={t("assignments.detail.startCanvasHint")}
            accessibilityLabel={t(
              "assignments.detail.startCanvasAccessibility",
            )}
            disabled={!canStartCanvas}
            gradeBand={gradeBand}
            label={t("assignments.detail.startCanvasCta")}
            loading={startStatus === "loading"}
            onPress={onStartCanvas}
            size={gradeBand === "elementary" ? "lg" : "md"}
            style={{ flexGrow: 1 }}
            variant="secondary"
          />
        </Inline>

        <Button
          accessibilityHint={
            canSubmit
              ? t("assignments.submit.hint")
              : t("assignments.submit.disabledHint")
          }
          accessibilityLabel={t("assignments.submit.ctaAccessibility")}
          disabled={!canSubmit}
          gradeBand={gradeBand}
          label={t("assignments.submit.reviewCta")}
          onPress={onSubmitPress}
          size={gradeBand === "elementary" ? "lg" : "md"}
          variant={canSubmit ? "secondary" : "ghost"}
        />

        <Text
          selectable
          style={[
            getAccessibleTextStyle(type.caption, settings),
            { color: colors.text.muted },
          ]}
        >
          {t("assignments.detail.safetyNote")}
        </Text>
      </Stack>
    </Card>
  );
}
