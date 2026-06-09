import { Text } from "react-native";

import { typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { Stack } from "@/shared/components/layout";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { ParentSettings } from "../types";

interface ParentSettingsSummaryCardProps {
  gradeBand: GradeBand;
  onPress?: () => void;
  settingsSummary: ParentSettings;
}

export function ParentSettingsSummaryCard({
  gradeBand,
  onPress,
  settingsSummary,
}: ParentSettingsSummaryCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const coachLabel =
    settingsSummary.aiCoachAccess === "hints_and_revision"
      ? t("parent.settings.aiCoachAccess.allowed")
      : t("parent.settings.aiCoachAccess.restricted");

  return (
    <Card
      accessibilityHint={onPress ? t("parent.settings.openHint") : undefined}
      accessibilityLabel={buildAccessibilityLabel([t("parent.settings.summaryAccessibility"), coachLabel])}
      gradeBand={gradeBand}
      onPress={onPress}
    >
      <Stack gap="xs">
        <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
          {t("parent.settings.summaryTitle")}
        </Text>
        <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
          {t("parent.settings.summaryDescription", {
            coach: coachLabel,
            quietHours: settingsSummary.quietHoursLabel,
          })}
        </Text>
      </Stack>
    </Card>
  );
}
