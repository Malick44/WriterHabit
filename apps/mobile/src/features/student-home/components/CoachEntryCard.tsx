import { Text } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { StudentHomeCoachAction } from "../types";

interface CoachEntryCardProps {
  actions: StudentHomeCoachAction[];
  gradeBand: GradeBand;
  onActionPress: (action: StudentHomeCoachAction) => void;
}

export function CoachEntryCard({ actions, gradeBand, onActionPress }: CoachEntryCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={t("studentHome.coach.accessibility")}
      gradeBand={gradeBand}
      testID="student-home-coach"
      title={t("studentHome.coach.title")}
      variant="accent"
    >
      <Stack gap="md">
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
          {gradeBand === "elementary"
            ? t("studentHome.coach.descriptionElementary")
            : gradeBand === "middle"
              ? t("studentHome.coach.descriptionMiddle")
              : t("studentHome.coach.descriptionHigh")}
        </Text>
        <Inline align="stretch" gap="sm">
          {actions.map((action) => (
            <Button
              accessibilityHint={t("studentHome.coach.actionHint")}
              accessibilityLabel={t(action.accessibilityLabelKey)}
              gradeBand={gradeBand}
              key={action.id}
              label={t(action.labelKey)}
              onPress={() => onActionPress(action)}
              size={gradeBand === "elementary" ? "lg" : "md"}
              style={{ flexGrow: 1 }}
              variant={action.id === "revision_help" ? "secondary" : "primary"}
            />
          ))}
        </Inline>
        <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.coach.accentStrong }]}>
          {t("aiCoach.safetyReminder")}
        </Text>
      </Stack>
    </Card>
  );
}
