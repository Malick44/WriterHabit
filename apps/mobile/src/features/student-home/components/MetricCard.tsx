import { Text } from "react-native";

import { Card, type CardVariant } from "@/shared/components/cards";
import { colors, spacing, typography, type GradeBand } from "@/design/tokens";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

interface MetricCardProps {
  accessibilityLabel: string;
  description: string;
  gradeBand: GradeBand;
  testID?: string;
  title: string;
  value: string;
  variant?: CardVariant;
}

export function MetricCard({
  accessibilityLabel,
  description,
  gradeBand,
  testID,
  title,
  value,
  variant = "default",
}: MetricCardProps) {
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Card accessibilityLabel={accessibilityLabel} gradeBand={gradeBand} testID={testID} variant={variant}>
      <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}>
        {title}
      </Text>
      <Text
        selectable
        style={[
          getAccessibleTextStyle(type.metric, settings),
          { color: colors.gradeBand[gradeBand].accentStrong, marginTop: spacing.xs },
        ]}
      >
        {value}
      </Text>
      <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
        {description}
      </Text>
    </Card>
  );
}
