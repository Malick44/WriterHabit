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

interface AssignmentPlanCardProps {
  assignment: AssignmentRecord;
  gradeAdaptation: AssignmentGradeAdaptation;
  gradeBand: GradeBand;
}

export function AssignmentPlanCard({ assignment, gradeAdaptation, gradeBand }: AssignmentPlanCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const instructions = assignment.instructions.slice(0, gradeAdaptation.visibleInstructionCount);

  return (
    <Card
      accessibilityLabel={t("assignments.detail.planAccessibility")}
      gradeBand={gradeBand}
      testID="assignment-detail-plan"
      title={t("assignments.detail.planTitle")}
    >
      <Stack gap="md">
        {instructions.map((instruction, index) => (
          <View
            key={`${assignment.id}-${index}`}
            style={{
              alignItems: "flex-start",
              flexDirection: "row",
              gap: spacing.md,
            }}
          >
            <View
              style={{
                alignItems: "center",
                backgroundColor: colors.gradeBand[gradeBand].background,
                borderColor: colors.gradeBand[gradeBand].accentStrong,
                borderRadius: radius.full,
                borderWidth: 1,
                height: gradeBand === "elementary" ? 32 : 28,
                justifyContent: "center",
                width: gradeBand === "elementary" ? 32 : 28,
              }}
            >
              <Text
                selectable
                style={[
                  getAccessibleTextStyle(type.caption, settings),
                  { color: colors.gradeBand[gradeBand].accentStrong },
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.body, settings),
                { color: accessibleColors.mutedText, flex: 1 },
              ]}
            >
              {instruction}
            </Text>
          </View>
        ))}
      </Stack>
    </Card>
  );
}
