import { Text } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { StatusState, SuccessState } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout";
import { typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { WritingMetrics, WritingSubmitError } from "../types";

interface WorkspaceSubmitPanelProps {
  canSubmit: boolean;
  gradeBand: GradeBand;
  metrics: WritingMetrics;
  onSave: () => void;
  onSubmit: () => void;
  submitError: WritingSubmitError | null;
  submitStatus: "idle" | "loading" | "error" | "success";
}

function getSubmitErrorCopy(error: WritingSubmitError | null) {
  switch (error) {
    case "empty_draft":
      return {
        descriptionKey: "writingWorkspace.submit.emptyDescription",
        titleKey: "writingWorkspace.submit.emptyTitle",
      } as const;
    case "save_failed":
      return {
        descriptionKey: "writingWorkspace.submit.saveErrorDescription",
        titleKey: "writingWorkspace.submit.saveErrorTitle",
      } as const;
    case "submit_failed":
      return {
        descriptionKey: "writingWorkspace.submit.submitErrorDescription",
        titleKey: "writingWorkspace.submit.submitErrorTitle",
      } as const;
    case null:
      return null;
  }
}

export function WorkspaceSubmitPanel({
  canSubmit,
  gradeBand,
  metrics,
  onSave,
  onSubmit,
  submitError,
  submitStatus,
}: WorkspaceSubmitPanelProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const errorCopy = getSubmitErrorCopy(submitError);

  if (submitStatus === "success") {
    return (
      <SuccessState
        accessibilityLabel={t("writingWorkspace.submit.successAccessibility")}
        description={t("writingWorkspace.submit.successDescription")}
        gradeBand={gradeBand}
        title={t("writingWorkspace.submit.successTitle")}
      />
    );
  }

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("writingWorkspace.submit.accessibility"),
        t("writingWorkspace.metrics.words", { count: metrics.wordCount }),
      ])}
      gradeBand={gradeBand}
      testID="writing-workspace-submit"
      title={t("writingWorkspace.submit.title")}
    >
      <Stack gap="md">
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
          {t("writingWorkspace.submit.description")}
        </Text>

        {!canSubmit ? (
          <StatusState
            accessibilityLabel={t("writingWorkspace.submit.emptyAccessibility")}
            description={t("writingWorkspace.submit.emptyDescription")}
            gradeBand={gradeBand}
            title={t("writingWorkspace.submit.emptyTitle")}
            tone="warning"
          />
        ) : null}

        {submitStatus === "error" && errorCopy ? (
          <StatusState
            accessibilityLabel={t("writingWorkspace.submit.errorAccessibility")}
            description={t(errorCopy.descriptionKey)}
            gradeBand={gradeBand}
            title={t(errorCopy.titleKey)}
            tone="error"
          />
        ) : null}

        <Button
          accessibilityHint={t("writingWorkspace.submit.saveHint")}
          accessibilityLabel={t("writingWorkspace.submit.saveAccessibility")}
          gradeBand={gradeBand}
          label={t("writingWorkspace.saveDraft")}
          onPress={onSave}
          size={gradeBand === "elementary" ? "lg" : "md"}
          variant="secondary"
        />
        <Button
          accessibilityHint={canSubmit ? t("writingWorkspace.submit.confirmHint") : t("writingWorkspace.submit.disabledHint")}
          accessibilityLabel={t("writingWorkspace.submit.confirmAccessibility")}
          disabled={!canSubmit}
          gradeBand={gradeBand}
          label={t("writingWorkspace.submit.confirmCta")}
          loading={submitStatus === "loading"}
          onPress={onSubmit}
          size={gradeBand === "elementary" ? "lg" : "md"}
        />
      </Stack>
    </Card>
  );
}
