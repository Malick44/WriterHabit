import { Text } from "react-native";

import { typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { teacherSkillLabelKeys } from "./teacherLabels";
import type { TeacherInstructionalGroup } from "../types";

interface TeacherInstructionalGroupCardProps {
  gradeBand?: GradeBand;
  group: TeacherInstructionalGroup;
}

export function TeacherInstructionalGroupCard({
  gradeBand = "middle",
  group,
}: TeacherInstructionalGroupCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];

  return (
    <Card
      accessibilityLabel={t("teacher.classProgress.groupAccessibility", { title: group.title })}
      gradeBand={gradeBand}
      title={group.title}
    >
      <Stack gap="sm">
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
        >
          {t("teacher.classProgress.groupSkill", { skill: t(teacherSkillLabelKeys[group.skill]) })}
        </Text>
        <Text
          selectable
          style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}
        >
          {group.description}
        </Text>
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}
        >
          {group.action}
        </Text>
        <Text
          selectable
          style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}
        >
          {group.studentNames.join(", ")}
        </Text>
      </Stack>
    </Card>
  );
}
