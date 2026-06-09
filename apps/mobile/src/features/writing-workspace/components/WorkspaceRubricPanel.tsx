import { Text, View } from "react-native";

import { Card } from "@/shared/components/cards";
import { Stack } from "@/shared/components/layout";
import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { AssignmentRecord } from "@/features/assignments";
import type { WritingWorkspaceGradeAdaptation } from "../types";

interface WorkspaceRubricPanelProps {
  assignment: AssignmentRecord;
  gradeAdaptation: WritingWorkspaceGradeAdaptation;
  gradeBand: GradeBand;
}

export function WorkspaceRubricPanel({ assignment, gradeAdaptation, gradeBand }: WorkspaceRubricPanelProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={t("writingWorkspace.rubric.accessibility")}
      gradeBand={gradeBand}
      testID="writing-workspace-rubric"
      title={t("writingWorkspace.rubric.title")}
    >
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
                borderColor: colors.gradeBand[gradeBand].accentStrong,
                borderRadius: radius.sm,
                borderWidth: 2,
                height: gradeBand === "elementary" ? 28 : 24,
                marginTop: spacing.xs,
                width: gradeBand === "elementary" ? 28 : 24,
              }}
            />
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
                {criterion.label}
              </Text>
              {gradeAdaptation.showDetailedRubric ? (
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
        <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
          {t("writingWorkspace.rubric.note")}
        </Text>
      </Stack>
    </Card>
  );
}
