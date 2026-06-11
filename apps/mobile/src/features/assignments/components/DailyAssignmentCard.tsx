import { Text } from "react-native";
import { InfoCard } from "@/shared/components/cards/InfoCard";
import { colors, spacing, typography } from "@/design/tokens";
import type { Assignment } from "@WriterHabit/shared";

interface DailyAssignmentCardProps {
  assignment: Assignment;
}

export function DailyAssignmentCard({ assignment }: DailyAssignmentCardProps) {
  const type = typography.gradeBands.middle;

  return (
    <InfoCard accessibilityLabel={assignment.title}>
      <Text selectable style={[type.title, { color: colors.text.primary }]}>
        {assignment.title}
      </Text>
      <Text selectable style={[type.body, { color: colors.text.secondary }]}>
        {assignment.prompt}
      </Text>
      <Text selectable style={[type.caption, { color: colors.text.muted, marginTop: spacing.xs }]}>
        {assignment.estimatedMinutes} min
      </Text>
    </InfoCard>
  );
}
