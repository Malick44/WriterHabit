import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasSyncStatus } from "../types";
import { syncStatusIcon, syncStatusTone } from "./canvasVisuals";

interface CanvasSyncStatusBadgeProps {
  gradeBand: GradeBand;
  status: CanvasSyncStatus;
}

export function CanvasSyncStatusBadge({ gradeBand, status }: CanvasSyncStatusBadgeProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const toneTokens = colors.feedback[syncStatusTone[status]];
  const useAccessibleSurface = settings.highContrast;
  const textColor = useAccessibleSurface ? accessibleColors.text : toneTokens.text;
  const iconColor = useAccessibleSurface ? accessibleColors.text : toneTokens.icon;

  return (
    <View
      accessibilityLabel={t("canvas.sync.accessibility", { status: t(`canvas.sync.${status}`) })}
      style={{
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: useAccessibleSurface ? accessibleColors.surface : toneTokens.background,
        borderColor: useAccessibleSurface ? accessibleColors.border : toneTokens.border,
        borderRadius: radius.full,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
      }}
    >
      <Ionicons color={iconColor} name={syncStatusIcon[status]} size={14} />
      <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: textColor }]}>
        {t(`canvas.sync.${status}`)}
      </Text>
    </View>
  );
}
