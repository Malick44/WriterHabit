import { Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { getStatusTone } from "../services/assignmentStatusService";
import type { AssignmentStatus } from "../types";

interface AssignmentStatusBadgeProps {
  gradeBand: GradeBand;
  status: AssignmentStatus;
}

export function AssignmentStatusBadge({ gradeBand, status }: AssignmentStatusBadgeProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const tone = getStatusTone(status);
  const toneTokens = colors.feedback[tone];

  return (
    <View
      accessibilityLabel={t("assignments.status.accessibility", {
        status: t(`assignments.status.${status}`),
      })}
      style={{
        alignSelf: "flex-start",
        backgroundColor: settings.highContrast ? accessibleColors.surface : toneTokens.background,
        borderColor: settings.highContrast ? accessibleColors.border : toneTokens.border,
        borderRadius: radius.full,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      <Text
        selectable
        style={[
          getAccessibleTextStyle(type.caption, settings),
          { color: settings.highContrast ? accessibleColors.text : toneTokens.text },
        ]}
      >
        {t(`assignments.status.${status}`)}
      </Text>
    </View>
  );
}
