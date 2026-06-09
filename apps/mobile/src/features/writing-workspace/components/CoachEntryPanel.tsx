import { useState } from "react";
import { Text } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { StatusState } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { WritingWorkspaceGradeAdaptation } from "../types";

interface CoachEntryPanelProps {
  gradeAdaptation: WritingWorkspaceGradeAdaptation;
  gradeBand: GradeBand;
  onClose: () => void;
  visible: boolean;
}

const coachActionKeys = [
  "aiCoach.hintCta",
  "aiCoach.brainstormCta",
  "aiCoach.sentenceCheckCta",
  "writingWorkspace.revise",
] as const;

export function CoachEntryPanel({ gradeAdaptation, gradeBand, onClose, visible }: CoachEntryPanelProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const [selectedAction, setSelectedAction] = useState<(typeof coachActionKeys)[number] | null>(null);
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  if (!visible) {
    return null;
  }

  return (
    <Card
      accessibilityLabel={t("writingWorkspace.coach.accessibility")}
      gradeBand={gradeBand}
      testID="writing-workspace-coach"
      title={t("writingWorkspace.coach.title")}
      variant="accent"
    >
      <Stack gap="md">
        <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.mutedText }]}>
          {gradeBand === "elementary"
            ? t("writingWorkspace.coach.descriptionElementary")
            : gradeBand === "middle"
              ? t("writingWorkspace.coach.descriptionMiddle")
              : t("writingWorkspace.coach.descriptionHigh")}
        </Text>
        <Inline align="stretch" gap="sm">
          {coachActionKeys.slice(0, gradeAdaptation.visibleCoachActionCount).map((key) => (
            <Button
              accessibilityHint={t("writingWorkspace.coach.actionHint")}
              accessibilityLabel={t(key)}
              gradeBand={gradeBand}
              key={key}
              label={t(key)}
              onPress={() => setSelectedAction(key)}
              size={gradeBand === "elementary" ? "lg" : "md"}
              style={{ flexGrow: 1 }}
              variant="secondary"
            />
          ))}
        </Inline>
        {selectedAction ? (
          <StatusState
            accessibilityLabel={t("writingWorkspace.coach.readyAccessibility")}
            description={t("writingWorkspace.coach.readyDescription", { action: t(selectedAction) })}
            gradeBand={gradeBand}
            title={t("writingWorkspace.coach.readyTitle")}
            tone="success"
          />
        ) : null}
        <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.coach.accentStrong }]}>
          {t("aiCoach.safetyReminder")}
        </Text>
        <Button
          accessibilityLabel={t("writingWorkspace.coach.closeAccessibility")}
          gradeBand={gradeBand}
          label={t("writingWorkspace.coach.closeCta")}
          onPress={onClose}
          size="sm"
          variant="ghost"
        />
      </Stack>
    </Card>
  );
}
