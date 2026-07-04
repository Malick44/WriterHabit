import { Text, View } from "react-native";

import { Card } from "@/shared/components/cards";
import { Inline, Stack } from "@/shared/components/layout";
import {
  colors,
  radius,
  spacing,
  typography,
  type GradeBand,
} from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { AssignmentGradeAdaptation, AssignmentRecord } from "../types";
import { AssignmentStatusBadge } from "./AssignmentStatusBadge";

interface AssignmentPromptCardProps {
  assignment: AssignmentRecord;
  gradeAdaptation: AssignmentGradeAdaptation;
  gradeBand: GradeBand;
}

export function AssignmentPromptCard({
  assignment,
  gradeAdaptation,
  gradeBand,
}: AssignmentPromptCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("assignments.detail.promptAccessibility"),
        assignment.title,
      ])}
      gradeBand={gradeBand}
      testID="assignment-detail-prompt"
      variant="accent"
    >
      <Stack gap="md">
        <Inline align="flex-start" justify="space-between">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.title, settings),
                { color: accessibleColors.text },
              ]}
            >
              {assignment.title}
            </Text>
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.bodySmall, settings),
                { color: accessibleColors.mutedText },
              ]}
            >
              {assignment.dueLabel}
            </Text>
          </Stack>
          <AssignmentStatusBadge
            gradeBand={gradeBand}
            status={assignment.status}
          />
        </Inline>

        <Text
          selectable
          style={[
            getAccessibleTextStyle(type.body, settings),
            { color: accessibleColors.text },
          ]}
        >
          {assignment.prompt}
        </Text>

        {assignment.teacherNote ? (
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.bodySmall, settings),
              { color: accessibleColors.mutedText },
            ]}
          >
            {assignment.teacherNote}
          </Text>
        ) : null}

        <Inline gap="sm">
          <View
            style={{
              backgroundColor: colors.background.surface,
              borderColor: colors.border.default,
              borderRadius: radius.sm,
              borderWidth: 1,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
            }}
          >
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.caption, settings),
                { color: accessibleColors.mutedText },
              ]}
            >
              {t("assignments.detail.estimatedTime", {
                count: assignment.estimatedMinutes,
              })}
            </Text>
          </View>
          {gradeAdaptation.showDifficulty ? (
            <View
              style={{
                backgroundColor: colors.background.surface,
                borderColor: colors.border.default,
                borderRadius: radius.sm,
                borderWidth: 1,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              }}
            >
              <Text
                selectable
                style={[
                  getAccessibleTextStyle(type.caption, settings),
                  { color: accessibleColors.mutedText },
                ]}
              >
                {t("assignments.detail.difficulty", {
                  difficulty: t(
                    `assignments.difficulty.${assignment.difficulty}`,
                  ),
                })}
              </Text>
            </View>
          ) : null}
        </Inline>
      </Stack>
    </Card>
  );
}
