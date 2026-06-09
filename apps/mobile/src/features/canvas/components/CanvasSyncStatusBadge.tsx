import { Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasSyncStatus } from "../types";

const statusTone: Record<CanvasSyncStatus, keyof typeof colors.feedback> = {
  local_only: "warning",
  saved: "success",
  saving: "info",
  sync_failed: "error",
};

interface CanvasSyncStatusBadgeProps {
  gradeBand: GradeBand;
  status: CanvasSyncStatus;
}

export function CanvasSyncStatusBadge({ gradeBand, status }: CanvasSyncStatusBadgeProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const toneTokens = colors.feedback[statusTone[status]];

  return (
    <View
      accessibilityLabel={t("canvas.sync.accessibility", { status: t(`canvas.sync.${status}`) })}
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
        {t(`canvas.sync.${status}`)}
      </Text>
    </View>
  );
}
