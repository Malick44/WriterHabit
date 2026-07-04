import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  colors,
  radius,
  shadows,
  typography,
  type GradeBand,
} from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { getStatusCta } from "../services/assignmentStatusService";
import type { AssignmentRecord, AssignmentStatus } from "../types";

const dashboard = colors.dashboard;

type BadgeTone = "due" | "active" | "done";

const badgeTokens: Record<BadgeTone, { bg: string; text: string }> = {
  due: { bg: dashboard.tertiaryContainer, text: dashboard.tertiaryText },
  active: {
    bg: dashboard.secondaryContainerSoft,
    text: dashboard.onSecondaryContainer,
  },
  done: { bg: dashboard.secondaryContainer, text: dashboard.secondary },
};

function getBadgeTone(status: AssignmentStatus): BadgeTone {
  if (status === "completed") {
    return "done";
  }

  if (status === "feedback_ready" || status === "revision_in_progress") {
    return "due";
  }

  return "active";
}

interface AssignmentSummaryCardProps {
  assignment: AssignmentRecord;
  gradeBand: GradeBand;
  onPress: () => void;
}

export function AssignmentSummaryCard({
  assignment,
  gradeBand,
  onPress,
}: AssignmentSummaryCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const tone = badgeTokens[getBadgeTone(assignment.status)];
  const statusLabel = t(`assignments.status.${assignment.status}`);
  const ctaLabel = t(
    `assignments.history.cta.${getStatusCta(assignment.status)}`,
  );
  const minutesLabel = t("common.minutes", {
    count: assignment.estimatedMinutes,
  });

  return (
    <Pressable
      accessibilityHint={t("assignments.history.openHint")}
      accessibilityLabel={buildAccessibilityLabel([
        statusLabel,
        assignment.title,
        minutesLabel,
        ctaLabel,
      ])}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed ? styles.cardPressed : null,
      ]}
      testID={`assignment-card-${assignment.id}`}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
          <Text
            style={[
              getAccessibleTextStyle(type.caption, settings),
              styles.badgeText,
              { color: tone.text },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
        <Text
          style={[
            getAccessibleTextStyle(type.caption, settings),
            styles.minutes,
          ]}
        >
          {minutesLabel}
        </Text>
      </View>

      <Text
        selectable
        style={[
          getAccessibleTextStyle(type.title, settings),
          styles.title,
          { color: accessibleColors.text },
        ]}
      >
        {assignment.title}
      </Text>

      <View style={styles.ctaRow}>
        <Text
          selectable={false}
          style={[getAccessibleTextStyle(type.label, settings), styles.ctaText]}
        >
          {ctaLabel}
        </Text>
        <Ionicons color={dashboard.primary} name="chevron-forward" size={18} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    ...shadows.card,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardPressed: {
    opacity: 0.85,
  },
  ctaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ctaText: {
    color: dashboard.primary,
    fontWeight: "600",
  },
  minutes: {
    color: dashboard.onSurfaceVariant,
    fontWeight: "500",
  },
  title: {
    fontWeight: "600",
  },
});
