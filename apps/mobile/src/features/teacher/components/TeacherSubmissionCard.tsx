import { Text } from "react-native";

import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { Inline, Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { teacherSubmissionStatusLabelKeys } from "./teacherLabels";
import type { TeacherSubmissionSummary } from "../types";

interface TeacherSubmissionCardProps {
  gradeBand?: GradeBand;
  onPress: () => void;
  submission: TeacherSubmissionSummary;
}

export function TeacherSubmissionCard({
  gradeBand = "middle",
  onPress,
  submission,
}: TeacherSubmissionCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const statusLabel = t(teacherSubmissionStatusLabelKeys[submission.status]);

  return (
    <Card
      accessibilityLabel={t("teacher.submissions.cardAccessibility", {
        assignment: submission.assignmentTitle,
        student: submission.studentName,
      })}
      gradeBand={gradeBand}
      title={submission.studentName}
    >
      <Stack gap="sm">
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}
        >
          {submission.assignmentTitle}
        </Text>
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
        >
          {submission.className} · {submission.submittedLabel}
        </Text>
        <Inline gap="sm">
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.caption, settings),
              {
                color:
                  submission.status === "awaiting_review"
                    ? colors.feedback.warning.text
                    : accessibleColors.text,
              },
            ]}
          >
            {statusLabel}
          </Text>
          <Text
            selectable
            style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.text }]}
          >
            {t("teacher.submissions.wordCount", { count: submission.wordCount })}
          </Text>
          {submission.hasCanvas ? (
            <Text
              selectable
              style={[getAccessibleTextStyle(type.caption, settings), { color: colors.feedback.info.text }]}
            >
              {t("teacher.submissions.canvasAttached")}
            </Text>
          ) : null}
          {submission.priority === "high" ? (
            <Text
              selectable
              style={[getAccessibleTextStyle(type.caption, settings), { color: colors.feedback.error.text }]}
            >
              {t("teacher.submissions.priorityHigh")}
            </Text>
          ) : null}
        </Inline>
        <Button
          accessibilityHint={t("teacher.submissions.openHint")}
          accessibilityLabel={t("teacher.submissions.openAccessibility", {
            student: submission.studentName,
          })}
          gradeBand={gradeBand}
          label={t("teacher.submissions.openCta")}
          onPress={onPress}
          size="sm"
          variant="secondary"
        />
      </Stack>
    </Card>
  );
}
