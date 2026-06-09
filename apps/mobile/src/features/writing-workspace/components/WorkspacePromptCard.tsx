import { Text } from "react-native";

import { Card } from "@/shared/components/cards";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { AssignmentRecord } from "@/features/assignments";

interface WorkspacePromptCardProps {
  assignment: AssignmentRecord;
  gradeBand: GradeBand;
}

export function WorkspacePromptCard({ assignment, gradeBand }: WorkspacePromptCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={t("writingWorkspace.prompt.accessibility")}
      gradeBand={gradeBand}
      testID="writing-workspace-prompt"
      title={t("writingWorkspace.prompt.title")}
      variant="accent"
    >
      <Stack gap="md">
        <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
          {assignment.title}
        </Text>
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
          {assignment.prompt}
        </Text>
        <Inline gap="sm">
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {assignment.dueLabel}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
            {t("common.minutes", { count: assignment.estimatedMinutes })}
          </Text>
        </Inline>
      </Stack>
    </Card>
  );
}
