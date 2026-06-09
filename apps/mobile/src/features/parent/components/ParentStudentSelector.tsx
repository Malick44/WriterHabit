import { Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { Inline, Stack } from "@/shared/components/layout";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { ParentStudentSummary } from "../types";

interface ParentStudentSelectorProps {
  gradeBand: GradeBand;
  onSelectStudent: (studentId: string) => void;
  selectedStudentId?: string;
  students: ParentStudentSummary[];
}

export function ParentStudentSelector({
  gradeBand,
  onSelectStudent,
  selectedStudentId,
  students,
}: ParentStudentSelectorProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Inline align="stretch" gap="md">
      {students.map((student) => {
        const selected = student.id === selectedStudentId;

        return (
          <View key={student.id} style={{ flex: 1, minWidth: gradeBand === "elementary" ? "100%" : 180 }}>
            <Card
              accessibilityHint={t("parent.selector.hint")}
              accessibilityLabel={buildAccessibilityLabel([
                t("parent.selector.studentAccessibility"),
                student.displayName,
                student.schoolLabel,
              ])}
              gradeBand={gradeBand}
              onPress={() => onSelectStudent(student.id)}
              style={{
                borderColor: selected ? colors.gradeBand[gradeBand].accentStrong : colors.border.default,
                borderWidth: selected ? 2 : 1,
              }}
              variant={selected ? "accent" : "default"}
            >
              <Stack gap="sm">
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{
                    alignItems: "center",
                    backgroundColor: selected ? colors.gradeBand[gradeBand].accentStrong : colors.background.subtle,
                    borderRadius: radius.full,
                    height: gradeBand === "elementary" ? 48 : 40,
                    justifyContent: "center",
                    width: gradeBand === "elementary" ? 48 : 40,
                  }}
                >
                  <Text
                    style={[
                      getAccessibleTextStyle(type.label, settings),
                      { color: selected ? colors.text.inverse : accessibleColors.text },
                    ]}
                  >
                    {student.avatarInitials}
                  </Text>
                </View>
                <Stack gap="xs">
                  <Text selectable style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
                    {student.displayName}
                  </Text>
                  <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
                    {t("parent.selector.studentMeta", {
                      grade: student.gradeLevel,
                      relationship: student.relationshipLabel,
                    })}
                  </Text>
                </Stack>
              </Stack>
            </Card>
          </View>
        );
      })}
    </Inline>
  );
}
