import { Text, View } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { SuccessState, StatusState } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout";
import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { AssignmentDetailViewModel, AssignmentSubmissionResponse } from "../types";

interface SubmissionChecklistProps {
  gradeBand: GradeBand;
  onBackToAssignment: () => void;
  onSubmit: () => void;
  submitResult: AssignmentSubmissionResponse | null;
  submitStatus: "idle" | "loading" | "error" | "success";
  viewModel: AssignmentDetailViewModel;
}

export function SubmissionChecklist({
  gradeBand,
  onBackToAssignment,
  onSubmit,
  submitResult,
  submitStatus,
  viewModel,
}: SubmissionChecklistProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const assignment = viewModel.assignment;

  if (!assignment) {
    return null;
  }

  if (submitStatus === "success" && submitResult) {
    return (
      <SuccessState
        actionLabel={t("assignments.submit.successAction")}
        accessibilityLabel={t("assignments.submit.successAccessibility")}
        description={t("assignments.submit.successDescription")}
        gradeBand={gradeBand}
        onActionPress={onBackToAssignment}
        title={t("assignments.submit.successTitle")}
      />
    );
  }

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([t("assignments.submit.accessibility"), assignment.title])}
      gradeBand={gradeBand}
      testID="assignment-submission-checklist"
      title={t("assignments.submit.title")}
    >
      <Stack gap="md">
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
          {t("assignments.submit.description")}
        </Text>

        <Stack gap="md">
          {assignment.rubric.map((criterion) => (
            <View
              key={criterion.id}
              style={{
                alignItems: "flex-start",
                flexDirection: "row",
                gap: spacing.md,
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: viewModel.canSubmit ? colors.feedback.success.background : colors.feedback.neutral.background,
                  borderColor: viewModel.canSubmit ? colors.feedback.success.border : colors.border.default,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  height: gradeBand === "elementary" ? 30 : 26,
                  justifyContent: "center",
                  width: gradeBand === "elementary" ? 30 : 26,
                }}
              >
                <Text
                  selectable
                  style={[
                    getAccessibleTextStyle(type.caption, settings),
                    { color: viewModel.canSubmit ? colors.text.success : colors.text.muted },
                  ]}
                >
                  {viewModel.canSubmit
                    ? t("assignments.submit.checklistComplete")
                    : t("assignments.submit.checklistPending")}
                </Text>
              </View>
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
                  {criterion.label}
                </Text>
                {viewModel.gradeAdaptation.showDetailedRubric ? (
                  <Text
                    selectable
                    style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
                  >
                    {criterion.description}
                  </Text>
                ) : null}
              </Stack>
            </View>
          ))}
        </Stack>

        {!viewModel.canSubmit ? (
          <StatusState
            accessibilityLabel={t("assignments.submit.notReadyAccessibility")}
            description={t("assignments.submit.notReadyDescription")}
            gradeBand={gradeBand}
            title={t("assignments.submit.notReadyTitle")}
            tone="warning"
          />
        ) : null}

        {submitStatus === "error" ? (
          <StatusState
            accessibilityLabel={t("assignments.submit.errorAccessibility")}
            description={t("assignments.submit.errorDescription")}
            gradeBand={gradeBand}
            title={t("assignments.submit.errorTitle")}
            tone="error"
          />
        ) : null}

        <Button
          accessibilityHint={viewModel.canSubmit ? t("assignments.submit.confirmHint") : t("assignments.submit.disabledHint")}
          accessibilityLabel={t("assignments.submit.confirmAccessibility")}
          disabled={!viewModel.canSubmit}
          gradeBand={gradeBand}
          label={t("assignments.submit.confirmCta")}
          loading={submitStatus === "loading"}
          onPress={onSubmit}
          size={gradeBand === "elementary" ? "lg" : "md"}
        />
        <Button
          accessibilityHint={t("assignments.submit.backHint")}
          accessibilityLabel={t("assignments.submit.backAccessibility")}
          gradeBand={gradeBand}
          label={t("assignments.submit.backCta")}
          onPress={onBackToAssignment}
          size={gradeBand === "elementary" ? "lg" : "md"}
          variant="ghost"
        />
      </Stack>
    </Card>
  );
}
