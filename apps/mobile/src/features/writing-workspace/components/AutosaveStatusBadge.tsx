import { Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { WritingAutosaveStatus } from "../types";

const statusTone: Record<WritingAutosaveStatus, keyof typeof colors.feedback> = {
  failed: "error",
  idle: "neutral",
  restoring: "info",
  saved: "success",
  saving: "info",
  unsaved: "warning",
};

interface AutosaveStatusBadgeProps {
  gradeBand: GradeBand;
  status: WritingAutosaveStatus;
}

export function AutosaveStatusBadge({ gradeBand, status }: AutosaveStatusBadgeProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const toneTokens = colors.feedback[statusTone[status]];

  return (
    <View
      accessibilityLabel={t("writingWorkspace.autosave.accessibility", {
        status: t(`writingWorkspace.autosave.${status}`),
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
        {t(`writingWorkspace.autosave.${status}`)}
      </Text>
    </View>
  );
}
