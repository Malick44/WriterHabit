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

import type { AssignmentGradeAdaptation, AssignmentRecord } from "../types";

interface RubricChecklistProps {
  assignment: AssignmentRecord;
  gradeAdaptation: AssignmentGradeAdaptation;
  gradeBand: GradeBand;
}

export function RubricChecklist({ assignment, gradeAdaptation, gradeBand }: RubricChecklistProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={t("assignments.detail.rubricAccessibility")}
      gradeBand={gradeBand}
      testID="assignment-detail-rubric"
      title={t("assignments.detail.rubricTitle")}
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
              accessibilityLabel={t("assignments.detail.rubricUncheckedAccessibility")}
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
          {t("assignments.detail.rubricNote")}
        </Text>
      </Stack>
    </Card>
  );
}
