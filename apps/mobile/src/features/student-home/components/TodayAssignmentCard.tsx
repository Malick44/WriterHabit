import { Text, View } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { StudentHomeAssignment, StudentHomeGradeAdaptation } from "../types";

interface TodayAssignmentCardProps {
  assignment: StudentHomeAssignment;
  gradeAdaptation: StudentHomeGradeAdaptation;
  gradeBand: GradeBand;
  onOpenAssignment: () => void;
  onStartWriting: () => void;
}

export function TodayAssignmentCard({
  assignment,
  gradeAdaptation,
  gradeBand,
  onOpenAssignment,
  onStartWriting,
}: TodayAssignmentCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("studentHome.todayAssignment.accessibility"),
        assignment.title,
        assignment.estimatedMinutes,
      ])}
      gradeBand={gradeBand}
      testID="student-home-today-assignment"
      variant="accent"
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Inline gap="sm">
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.caption, settings),
                { color: colors.gradeBand[gradeBand].accentStrong },
              ]}
            >
              {assignment.dueLabel}
            </Text>
            <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
              {t("common.minutes", { count: assignment.estimatedMinutes })}
            </Text>
          </Inline>
          <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
            {assignment.title}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
            {assignment.prompt}
          </Text>
        </Stack>

        {gradeAdaptation.showRubricFocus && assignment.rubricFocus.length > 0 ? (
          <Stack gap="sm">
            <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.text }]}>
              {t("studentHome.todayAssignment.rubricFocus")}
            </Text>
            <Inline gap="sm">
              {assignment.rubricFocus.map((criterion) => (
                <View
                  key={criterion}
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
                    style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}
                  >
                    {criterion}
                  </Text>
                </View>
              ))}
            </Inline>
          </Stack>
        ) : null}

        {assignment.coachSuggestion ? (
          <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
            {assignment.coachSuggestion}
          </Text>
        ) : null}

        <Inline gap="sm">
          <Button
            accessibilityHint={t("studentHome.todayAssignment.startHint")}
            accessibilityLabel={t("studentHome.todayAssignment.startAccessibility")}
            gradeBand={gradeBand}
            label={t("studentHome.todayAssignment.startCta")}
            onPress={onStartWriting}
            size={gradeBand === "elementary" ? "lg" : "md"}
          />
          <Button
            accessibilityHint={t("studentHome.todayAssignment.detailsHint")}
            accessibilityLabel={t("studentHome.todayAssignment.detailsAccessibility")}
            gradeBand={gradeBand}
            label={t("studentHome.todayAssignment.detailsCta")}
            onPress={onOpenAssignment}
            size={gradeBand === "elementary" ? "lg" : "md"}
            variant="secondary"
          />
        </Inline>
      </Stack>
    </Card>
  );
}
