import { Text } from "react-native";

import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { teacherSkillLabelKeys } from "./teacherLabels";
import type { TeacherStudentProgress } from "../types";

interface TeacherStudentProgressRowProps {
  gradeBand?: GradeBand;
  student: TeacherStudentProgress;
}

export function TeacherStudentProgressRow({
  gradeBand = "middle",
  student,
}: TeacherStudentProgressRowProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];

  return (
    <Card
      accessibilityLabel={t("teacher.classProgress.studentAccessibility", { name: student.displayName })}
      gradeBand={gradeBand}
    >
      <Stack gap="sm">
        <Inline gap="sm" justify="space-between">
          <Text
            selectable
            style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}
          >
            {student.displayName}
          </Text>
          {student.needsSupport ? (
            <Text
              selectable
              style={[getAccessibleTextStyle(type.caption, settings), { color: colors.feedback.warning.text }]}
            >
              {t("teacher.classProgress.needsSupport")}
            </Text>
          ) : null}
        </Inline>
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
        >
          {t("teacher.classProgress.focusSkill", {
            skill: t(teacherSkillLabelKeys[student.focusSkill]),
          })}
        </Text>
        <ProgressBar
          gradeBand={gradeBand}
          label={t("teacher.classProgress.completionAccessibility", { name: student.displayName })}
          showValue
          value={student.assignmentCompletionPercent / 100}
        />
        <ProgressBar
          gradeBand={gradeBand}
          label={t("teacher.classProgress.rubricAccessibility", { name: student.displayName })}
          showValue
          value={student.averageRubricScore / 100}
        />
      </Stack>
    </Card>
  );
}
