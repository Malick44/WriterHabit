import { Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { ParentAssignmentReviewViewModel, ParentRubricRow } from "../types";

interface ParentWorkPreviewCardProps {
  gradeBand: GradeBand;
  viewModel: ParentAssignmentReviewViewModel;
}

interface ParentRubricRowCardProps {
  gradeBand: GradeBand;
  row: ParentRubricRow;
  showDescription: boolean;
}

export function ParentWorkPreviewCard({ gradeBand, viewModel }: ParentWorkPreviewCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const { review } = viewModel;

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("parent.review.workAccessibility"),
        review.assignmentTitle,
        review.studentName,
      ])}
      gradeBand={gradeBand}
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}>
            {t("parent.review.promptLabel")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
            {review.assignmentPrompt}
          </Text>
        </Stack>
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}>
            {t("parent.review.studentWorkLabel")}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
            {review.writingPreview}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
            {t("parent.review.wordCount", { count: review.wordCount })}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}

export function ParentCanvasPreviewCard({ gradeBand, viewModel }: ParentWorkPreviewCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const canvasPreview = viewModel.review.canvasPreview;

  if (!canvasPreview) {
    return (
      <Card
        accessibilityLabel={t("parent.review.noCanvasAccessibility")}
        gradeBand={gradeBand}
        variant="default"
      >
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
          {t("parent.review.noCanvas")}
        </Text>
      </Card>
    );
  }

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("parent.review.canvasAccessibility"),
        canvasPreview.title,
        canvasPreview.templateLabel,
      ])}
      gradeBand={gradeBand}
      variant="accent"
    >
      <Stack gap="md">
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            backgroundColor: colors.background.surface,
            borderColor: colors.border.strong,
            borderRadius: radius.md,
            borderWidth: 1,
            minHeight: gradeBand === "elementary" ? 132 : 108,
            overflow: "hidden",
            padding: spacing.md,
          }}
        >
          <View
            style={{
              borderColor: colors.border.default,
              borderTopWidth: 1,
              marginTop: spacing.md,
            }}
          />
          <View
            style={{
              borderColor: colors.border.default,
              borderTopWidth: 1,
              marginTop: spacing.lg,
            }}
          />
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: colors.gradeBand[gradeBand].accentStrong,
              borderRadius: radius.full,
              height: 8,
              marginLeft: spacing.lg,
              marginTop: spacing.md,
              width: "48%",
            }}
          />
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: colors.gradeBand[gradeBand].accentStrong,
              borderRadius: radius.full,
              height: 8,
              marginLeft: spacing.xl,
              marginTop: spacing.sm,
              width: "34%",
            }}
          />
        </View>
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
            {canvasPreview.title}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
            {t("parent.review.canvasMeta", {
              count: canvasPreview.strokeCount,
              template: canvasPreview.templateLabel,
            })}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}

export function ParentAiFeedbackCard({ gradeBand, viewModel }: ParentWorkPreviewCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const feedback = viewModel.review.aiFeedback;

  return (
    <Card
      accessibilityLabel={t("parent.review.feedbackAccessibility")}
      gradeBand={gradeBand}
      variant="success"
    >
      <Stack gap="md">
        {[
          { label: t("parent.review.strengthLabel"), value: feedback.strength },
          { label: t("parent.review.improvementLabel"), value: feedback.improvement },
          { label: t("parent.review.revisionTaskLabel"), value: feedback.revisionTask },
        ].map((item) => (
          <Stack gap="xs" key={item.label}>
            <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}>
              {item.label}
            </Text>
            <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
              {item.value}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

export function ParentRubricSummaryCard({ gradeBand, viewModel }: ParentWorkPreviewCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("parent.review.rubricAccessibility"),
        viewModel.rubricEarned,
        viewModel.rubricMax,
      ])}
      gradeBand={gradeBand}
    >
      <Stack gap="md">
        <Inline align="flex-start" justify="space-between">
          <Stack gap="xs" style={{ flex: 1, minWidth: 180 }}>
            <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
              {t("parent.review.rubricScore")}
            </Text>
            <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
              {t("parent.review.rubricDescription")}
            </Text>
          </Stack>
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.metric, settings),
              { color: colors.gradeBand[gradeBand].accentStrong, fontVariant: ["tabular-nums"] },
            ]}
          >
            {t("parent.review.rubricValue", {
              earned: viewModel.rubricEarned,
              max: viewModel.rubricMax,
            })}
          </Text>
        </Inline>
        <ProgressBar
          gradeBand={gradeBand}
          label={t("parent.review.rubricProgressAccessibility")}
          showValue={gradeBand !== "elementary"}
          value={viewModel.rubricScoreValue}
        />
      </Stack>
    </Card>
  );
}

export function ParentRubricRowCard({ gradeBand, row, showDescription }: ParentRubricRowCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("parent.review.rubricRowAccessibility"),
        row.label,
        row.score,
        row.maxScore,
      ])}
      gradeBand={gradeBand}
    >
      <Stack gap="sm">
        <Inline align="flex-start" justify="space-between">
          <Text
            selectable
            style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text, flex: 1 }]}
          >
            {row.label}
          </Text>
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.label, settings),
              { color: colors.gradeBand[gradeBand].accentStrong, fontVariant: ["tabular-nums"] },
            ]}
          >
            {t("parent.review.rubricValue", { earned: row.score, max: row.maxScore })}
          </Text>
        </Inline>
        {showDescription ? (
          <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
            {row.description}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}
