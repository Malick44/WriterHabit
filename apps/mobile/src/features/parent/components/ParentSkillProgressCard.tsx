import { Text } from "react-native";

import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { ParentSkillProgress } from "../types";

interface ParentSkillProgressCardProps {
  gradeBand: GradeBand;
  skill: ParentSkillProgress;
}

export function ParentSkillProgressCard({ gradeBand, skill }: ParentSkillProgressCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const progressValue = skill.currentScore / 100;

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([
        t("parent.skills.cardAccessibility"),
        skill.label,
        skill.currentScore,
      ])}
      gradeBand={gradeBand}
      testID={`parent-skill-${skill.skill}`}
    >
      <Stack gap="md">
        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
            {skill.label}
          </Text>
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.caption, settings),
              {
                color: skill.currentScore > skill.previousScore ? colors.text.success : accessibleColors.mutedText,
              },
            ]}
          >
            {skill.trendDescription}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
            {skill.nextPractice}
          </Text>
        </Stack>
        <ProgressBar
          gradeBand={gradeBand}
          label={buildAccessibilityLabel([skill.label, t("parent.skills.progressAccessibility")])}
          showValue={gradeBand !== "elementary"}
          value={progressValue}
        />
      </Stack>
    </Card>
  );
}
