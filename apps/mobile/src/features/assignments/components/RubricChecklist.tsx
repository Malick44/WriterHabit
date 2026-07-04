import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "@/shared/components/cards";
import { Stack } from "@/shared/components/layout";
import {
  colors,
  radius,
  spacing,
  typography,
  type GradeBand,
} from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { AssignmentGradeAdaptation, AssignmentRecord } from "../types";

interface RubricChecklistProps {
  assignment: AssignmentRecord;
  /** Checked state per rubric criterion id. */
  checkedIds: Record<string, boolean>;
  gradeAdaptation: AssignmentGradeAdaptation;
  gradeBand: GradeBand;
  onToggle: (criterionId: string) => void;
}

export function RubricChecklist({
  assignment,
  checkedIds,
  gradeAdaptation,
  gradeBand,
  onToggle,
}: RubricChecklistProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const accentStrong = colors.gradeBand[gradeBand].accentStrong;
  const boxSize = gradeBand === "elementary" ? 28 : 24;
  const checkedCount = assignment.rubric.filter(
    (criterion) => checkedIds[criterion.id],
  ).length;

  return (
    <Card
      accessibilityLabel={t("assignments.detail.rubricAccessibility")}
      gradeBand={gradeBand}
      testID="assignment-detail-rubric"
      title={t("assignments.detail.rubricTitle")}
    >
      <Stack gap="md">
        {assignment.rubric.map((criterion) => {
          const checked = Boolean(checkedIds[criterion.id]);

          return (
            <Pressable
              accessibilityLabel={t(
                "writingWorkspace.stages.reviseToggleAccessibility",
                { label: criterion.label },
              )}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              key={criterion.id}
              onPress={() => onToggle(criterion.id)}
              style={({ pressed }) => ({
                alignItems: "flex-start",
                flexDirection: "row",
                gap: spacing.md,
                opacity: pressed ? 0.7 : 1,
              })}
              testID={`assignment-detail-rubric-item-${criterion.id}`}
            >
              <View
                style={{
                  alignItems: "center",
                  backgroundColor: checked ? accentStrong : "transparent",
                  borderColor: accentStrong,
                  borderRadius: radius.sm,
                  borderWidth: 2,
                  height: boxSize,
                  justifyContent: "center",
                  marginTop: spacing.xs,
                  width: boxSize,
                }}
              >
                {checked ? (
                  <Ionicons
                    color={colors.text.inverse}
                    name="checkmark"
                    size={boxSize - 10}
                  />
                ) : null}
              </View>
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text
                  selectable
                  style={[
                    getAccessibleTextStyle(type.bodyStrong, settings),
                    { color: accessibleColors.text },
                  ]}
                >
                  {criterion.label}
                </Text>
                {gradeAdaptation.showDetailedRubric ? (
                  <Text
                    selectable
                    style={[
                      getAccessibleTextStyle(type.bodySmall, settings),
                      { color: accessibleColors.mutedText },
                    ]}
                  >
                    {criterion.description}
                  </Text>
                ) : null}
              </Stack>
            </Pressable>
          );
        })}
        <Text
          selectable
          style={[
            getAccessibleTextStyle(type.bodyStrong, settings),
            { color: accessibleColors.text },
          ]}
        >
          {t("writingWorkspace.stages.reviseProgress", {
            count: checkedCount,
            total: assignment.rubric.length,
          })}
        </Text>
        <Text
          selectable
          style={[
            getAccessibleTextStyle(type.caption, settings),
            { color: colors.text.muted },
          ]}
        >
          {t("assignments.detail.rubricNote")}
        </Text>
      </Stack>
    </Card>
  );
}
