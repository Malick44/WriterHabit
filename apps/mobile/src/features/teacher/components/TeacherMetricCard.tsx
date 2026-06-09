import { Text } from "react-native";

import { colors, typography, type GradeBand } from "@/design/tokens";
import { Card } from "@/shared/components/cards";
import { Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

interface TeacherMetricCardProps {
  description: string;
  gradeBand?: GradeBand;
  label: string;
  value: string;
}

export function TeacherMetricCard({
  description,
  gradeBand = "middle",
  label,
  value,
}: TeacherMetricCardProps) {
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];

  return (
    <Card accessibilityLabel={`${label}: ${value}`} gradeBand={gradeBand}>
      <Stack gap="xs">
        <Text
          selectable
          style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}
        >
          {label}
        </Text>
        <Text
          selectable
          style={[
            getAccessibleTextStyle(type.heading, settings),
            { color: colors.gradeBand[gradeBand].accentStrong },
          ]}
        >
          {value}
        </Text>
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.text }]}
        >
          {description}
        </Text>
      </Stack>
    </Card>
  );
}
