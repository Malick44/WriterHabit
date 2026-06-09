import { Text, View } from "react-native";

import { Card } from "@/shared/components/cards";
import { Inline, Stack } from "@/shared/components/layout";
import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { AssignmentRecord } from "../types";

interface SkillFocusCardProps {
  assignment: AssignmentRecord;
  gradeBand: GradeBand;
}

export function SkillFocusCard({ assignment, gradeBand }: SkillFocusCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card
      accessibilityLabel={t("assignments.detail.skillsAccessibility")}
      gradeBand={gradeBand}
      testID="assignment-detail-skills"
      title={t("assignments.detail.skillsTitle")}
    >
      <Stack gap="md">
        <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
          {gradeBand === "elementary"
            ? t("assignments.detail.skillsDescriptionElementary")
            : gradeBand === "middle"
              ? t("assignments.detail.skillsDescriptionMiddle")
              : t("assignments.detail.skillsDescriptionHigh")}
        </Text>
        <Inline gap="sm">
          {assignment.skillFocus.map((skill) => (
            <View
              key={skill}
              style={{
                backgroundColor: colors.gradeBand[gradeBand].background,
                borderColor: colors.gradeBand[gradeBand].accent,
                borderRadius: radius.sm,
                borderWidth: 1,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              }}
            >
              <Text
                selectable
                style={[
                  getAccessibleTextStyle(type.caption, settings),
                  { color: colors.gradeBand[gradeBand].accentStrong },
                ]}
              >
                {t(`assignments.skills.${skill}`)}
              </Text>
            </View>
          ))}
        </Inline>
      </Stack>
    </Card>
  );
}
