import { Text } from "react-native";

import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { teacherSkillLabelKeys } from "./teacherLabels";
import type { TeacherAssignmentSummary } from "../types";

interface TeacherAssignmentCardProps {
  assignment: TeacherAssignmentSummary;
  gradeBand?: GradeBand;
  onOpen?: () => void;
}

export function TeacherAssignmentCard({
  assignment,
  gradeBand = "middle",
  onOpen,
}: TeacherAssignmentCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const skillLabels = assignment.skillFocus.map((skill) => t(teacherSkillLabelKeys[skill])).join(", ");

  return (
    <Card
      accessibilityLabel={t("teacher.assignments.cardAccessibility", { title: assignment.title })}
      gradeBand={gradeBand}
      title={assignment.title}
    >
      <Stack gap="sm">
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.text }]}
        >
          {assignment.className} · {assignment.dueLabel}
        </Text>
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
        >
          {skillLabels}
        </Text>
        <ProgressBar
          gradeBand={gradeBand}
          label={t("teacher.assignments.completionAccessibility", { title: assignment.title })}
          showValue
          value={assignment.completionPercent / 100}
        />
        <Inline gap="sm" justify="space-between">
          <Text
            selectable
            style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.text }]}
          >
            {t("teacher.assignments.submissionCount", { count: assignment.submissionsCount })}
          </Text>
          {assignment.allowCanvas ? (
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.caption, settings),
                { color: colors.gradeBand[gradeBand].accentStrong },
              ]}
            >
              {t("teacher.assignments.canvasAllowed")}
            </Text>
          ) : null}
        </Inline>
        {onOpen ? (
          <Button
            accessibilityHint={t("teacher.assignments.openHint")}
            accessibilityLabel={t("teacher.assignments.openAccessibility", { title: assignment.title })}
            gradeBand={gradeBand}
            label={t("teacher.assignments.openCta")}
            onPress={onOpen}
            size="sm"
            variant="secondary"
          />
        ) : null}
      </Stack>
    </Card>
  );
}
