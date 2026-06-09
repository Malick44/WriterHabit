import { Text } from "react-native";

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

import type { AssignmentRecord } from "../types";
import { AssignmentStatusBadge } from "./AssignmentStatusBadge";

interface AssignmentListCardProps {
  assignment: AssignmentRecord;
  gradeBand: GradeBand;
  onPress: () => void;
}

export function AssignmentListCard({ assignment, gradeBand, onPress }: AssignmentListCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const summary =
    assignment.draft && gradeBand !== "elementary"
      ? t("assignments.history.draftSummary", {
          count: assignment.draft.wordCount,
          label: assignment.draft.lastEditedLabel,
        })
      : assignment.dueLabel;

  return (
    <Card
      accessibilityHint={t("assignments.history.openHint")}
      accessibilityLabel={buildAccessibilityLabel([
        assignment.title,
        t(`assignments.status.${assignment.status}`),
        assignment.dueLabel,
      ])}
      gradeBand={gradeBand}
      onPress={onPress}
      testID={`assignment-card-${assignment.id}`}
    >
      <Stack gap="md">
        <Inline align="flex-start" justify="space-between">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
              {assignment.title}
            </Text>
            <Text
              numberOfLines={gradeBand === "elementary" ? 2 : 3}
              selectable
              style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
            >
              {assignment.prompt}
            </Text>
          </Stack>
          <AssignmentStatusBadge gradeBand={gradeBand} status={assignment.status} />
        </Inline>

        <Inline gap="sm">
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {assignment.assignedLabel}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {t("common.minutes", { count: assignment.estimatedMinutes })}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {summary}
          </Text>
        </Inline>
      </Stack>
    </Card>
  );
}
