import { Text } from "react-native";

import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Inline, Stack } from "@/shared/components/layout";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { ProgressGradeAdaptation, ProgressSkillViewModel } from "../types";

interface SkillProgressCardProps {
  gradeAdaptation: ProgressGradeAdaptation;
  gradeBand: GradeBand;
  onPress?: () => void;
  skill: ProgressSkillViewModel;
}

export function SkillProgressCard({ gradeAdaptation, gradeBand, onPress, skill }: SkillProgressCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const skillLabel = t(skill.labelKey);
  const deltaText =
    skill.weeklyDelta > 0
      ? t("progress.skills.deltaPositive", { count: skill.weeklyDelta })
      : t("progress.skills.deltaFlat");

  return (
    <Card
      accessibilityHint={onPress ? t("progress.skills.openHint") : undefined}
      accessibilityLabel={buildAccessibilityLabel([skillLabel, t("progress.skills.cardAccessibility")])}
      gradeBand={gradeBand}
      onPress={onPress}
      testID={`progress-skill-${skill.skill}`}
    >
      <Stack gap="md">
        <Inline align="flex-start" justify="space-between">
          <Stack gap="xs" style={{ flex: 1, minWidth: 180 }}>
            <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
              {skillLabel}
            </Text>
            <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
              {t(skill.nextStepKey)}
            </Text>
          </Stack>
          {gradeAdaptation.showDetailedSkillDeltas ? (
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.caption, settings),
                {
                  color: skill.weeklyDelta > 0 ? colors.text.success : colors.text.muted,
                  fontVariant: ["tabular-nums"],
                },
              ]}
            >
              {deltaText}
            </Text>
          ) : null}
        </Inline>

        <ProgressBar
          gradeBand={gradeBand}
          label={buildAccessibilityLabel([skillLabel, t("progress.skills.scoreAccessibility")])}
          showValue={gradeBand !== "elementary"}
          value={skill.progressValue}
        />

        {gradeAdaptation.showProductivityMetrics ? (
          <Inline gap="md">
            <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
              {t("progress.skills.practiceCount", { count: skill.practiceCount })}
            </Text>
            <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
              {t("progress.skills.minutesPracticed", { count: skill.minutesPracticed })}
            </Text>
          </Inline>
        ) : null}
      </Stack>
    </Card>
  );
}
