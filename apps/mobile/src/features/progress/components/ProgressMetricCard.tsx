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

import type { ProgressMetricViewModel } from "../types";

interface ProgressMetricCardProps {
  gradeBand: GradeBand;
  metric: ProgressMetricViewModel;
  testID?: string;
}

export function ProgressMetricCard({ gradeBand, metric, testID }: ProgressMetricCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const value = t(metric.valueKey, metric.valueParams);

  return (
    <Card
      accessibilityLabel={buildAccessibilityLabel([t(metric.accessibilityLabelKey), value])}
      gradeBand={gradeBand}
      testID={testID}
    >
      <Stack gap="xs">
        <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}>
          {t(metric.titleKey)}
        </Text>
        <Text
          selectable
          style={[
            getAccessibleTextStyle(type.metric, settings),
            { color: colors.gradeBand[gradeBand].accentStrong, fontVariant: ["tabular-nums"] },
          ]}
        >
          {value}
        </Text>
        <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
          {t(metric.descriptionKey)}
        </Text>
      </Stack>

      {typeof metric.progressValue === "number" ? (
        <ProgressBar
          gradeBand={gradeBand}
          label={buildAccessibilityLabel([t(metric.titleKey), t("progress.metrics.progressAccessibility")])}
          showValue={gradeBand !== "elementary"}
          value={metric.progressValue}
        />
      ) : null}
    </Card>
  );
}
