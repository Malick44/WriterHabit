import { Text, View } from "react-native";

import { colors, radius, typography, type GradeBand } from "@/design/tokens";
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

import type { ProgressBadgeViewModel } from "../types";

interface BadgeCardProps {
  badge: ProgressBadgeViewModel;
  gradeBand: GradeBand;
}

function getStatusKey(status: ProgressBadgeViewModel["status"]) {
  switch (status) {
    case "locked":
      return "progress.badges.status.locked";
    case "new":
      return "progress.badges.status.new";
    case "unlocked":
      return "progress.badges.status.unlocked";
  }
}

export function BadgeCard({ badge, gradeBand }: BadgeCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const title = t(badge.titleKey);
  const status = t(getStatusKey(badge.status));

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([title, status])}
      gradeBand={gradeBand}
      testID={`progress-badge-${badge.id}`}
      variant={badge.status === "new" ? "success" : badge.unlocked ? "accent" : "default"}
    >
      <Stack gap="md">
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{
            alignItems: "center",
            alignSelf: "flex-start",
            backgroundColor: badge.unlocked ? colors.gradeBand[gradeBand].accentStrong : colors.background.subtle,
            borderRadius: radius.full,
            height: gradeBand === "elementary" ? 56 : 48,
            justifyContent: "center",
            width: gradeBand === "elementary" ? 56 : 48,
          }}
        >
          <Text
            style={[
              getAccessibleTextStyle(type.label, settings),
              {
                color: badge.unlocked ? colors.text.inverse : colors.text.secondary,
                fontVariant: ["tabular-nums"],
                textAlign: "center",
              },
            ]}
          >
            {badge.tokenLabel}
          </Text>
        </View>

        <Stack gap="xs">
          <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
            {title}
          </Text>
          <Text
            selectable
            style={[
              getAccessibleTextStyle(type.caption, settings),
              { color: badge.status === "locked" ? accessibleColors.mutedText : colors.text.success },
            ]}
          >
            {status}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
            {t(badge.descriptionKey)}
          </Text>
          <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
            {t(badge.requirementKey)}
          </Text>
        </Stack>

        {!badge.unlocked ? (
          <ProgressBar
            gradeBand={gradeBand}
            label={buildAccessibilityLabel([title, t("progress.badges.progressAccessibility")])}
            showValue={gradeBand !== "elementary"}
            value={badge.progressValue}
          />
        ) : null}
      </Stack>
    </Card>
  );
}
