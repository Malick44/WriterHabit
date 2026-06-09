import { Text } from "react-native";

import { colors, typography, type GradeBand } from "@/design/tokens";
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

import type { ParentAssignmentSummary } from "../types";

interface ParentAssignmentSummaryCardProps {
  assignment: ParentAssignmentSummary;
  gradeBand: GradeBand;
  onPress?: () => void;
}

function getStatusLabelKey(status: ParentAssignmentSummary["status"]) {
  switch (status) {
    case "completed":
      return "parent.assignments.status.completed";
    case "feedback_ready":
      return "parent.assignments.status.feedbackReady";
    case "revision_in_progress":
      return "parent.assignments.status.revisionInProgress";
  }
}

export function ParentAssignmentSummaryCard({
  assignment,
  gradeBand,
  onPress,
}: ParentAssignmentSummaryCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityHint={onPress ? t("parent.assignments.openHint") : undefined}
      accessibilityLabel={buildAccessibilityLabel([
        t("parent.assignments.cardAccessibility"),
        assignment.title,
        assignment.scorePercent,
      ])}
      gradeBand={gradeBand}
      onPress={onPress}
      testID={`parent-assignment-${assignment.submissionId}`}
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Inline align="flex-start" justify="space-between">
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.title, settings),
                { color: accessibleColors.text, flex: 1, minWidth: 180 },
              ]}
            >
              {assignment.title}
            </Text>
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.caption, settings),
                { color: colors.gradeBand[gradeBand].accentStrong },
              ]}
            >
              {t(getStatusLabelKey(assignment.status))}
            </Text>
          </Inline>
          <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
            {t("parent.assignments.submittedLabel", { label: assignment.submittedLabel })}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
            {assignment.feedbackSummary}
          </Text>
        </Stack>

        <ProgressBar
          gradeBand={gradeBand}
          label={buildAccessibilityLabel([assignment.title, t("parent.assignments.scoreAccessibility")])}
          showValue={gradeBand !== "elementary"}
          value={assignment.scorePercent / 100}
        />

        <Inline gap="sm">
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
            {assignment.hasCanvas ? t("parent.assignments.hasCanvas") : t("parent.assignments.typedOnly")}
          </Text>
        </Inline>
      </Stack>
    </Card>
  );
}
