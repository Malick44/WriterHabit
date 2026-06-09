import { Text } from "react-native";

import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { ProgressBar } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { StudentHomeSkillProgress } from "../types";

interface SkillProgressPreviewProps {
  gradeBand: GradeBand;
  onOpenProgress: () => void;
  skills: StudentHomeSkillProgress[];
}

export function SkillProgressPreview({ gradeBand, onOpenProgress, skills }: SkillProgressPreviewProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={t("studentHome.skills.accessibility")}
      gradeBand={gradeBand}
      testID="student-home-skills"
      title={t("studentHome.skills.title")}
    >
      <Stack gap="md">
        <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
          {gradeBand === "elementary"
            ? t("studentHome.skills.descriptionElementary")
            : gradeBand === "middle"
              ? t("studentHome.skills.descriptionMiddle")
              : t("studentHome.skills.descriptionHigh")}
        </Text>

        <Stack gap="md">
          {skills.map((skill) => (
            <ProgressBar
              gradeBand={gradeBand}
              key={skill.skill}
              label={buildAccessibilityLabel([skill.label, t("studentHome.skills.progressAccessibility")])}
              showValue={gradeBand !== "elementary"}
              value={skill.currentScore / 100}
            />
          ))}
        </Stack>

        <Button
          accessibilityHint={t("studentHome.skills.hint")}
          accessibilityLabel={t("studentHome.skills.ctaAccessibility")}
          gradeBand={gradeBand}
          label={t("studentHome.skills.cta")}
          onPress={onOpenProgress}
          size={gradeBand === "elementary" ? "lg" : "md"}
          variant="secondary"
        />

        <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
          {t("studentHome.skills.note")}
        </Text>
      </Stack>
    </Card>
  );
}
