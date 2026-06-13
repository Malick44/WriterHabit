import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "@/shared/components/cards";
import { colors, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { getStatusCta } from "../services/assignmentStatusService";
import type { AssignmentRecord } from "../types";
import { AssignmentStatusBadge } from "./AssignmentStatusBadge";

const dashboard = colors.dashboard;

interface AssignmentListCardProps {
  assignment: AssignmentRecord;
  gradeBand: GradeBand;
  onPress: () => void;
}

export function AssignmentListCard({ assignment, gradeBand, onPress }: AssignmentListCardProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const ctaLabel = t(`assignments.history.cta.${getStatusCta(assignment.status)}`);
  const skillLabel = t(`assignments.skills.${assignment.skillFocus[0]}`);
  const showDifficulty = gradeBand !== "elementary";

  return (
    <Card
      accessibilityHint={t("assignments.history.openHint")}
      accessibilityLabel={buildAccessibilityLabel([
        assignment.title,
        t(`assignments.status.${assignment.status}`),
        assignment.dueLabel,
        ctaLabel,
      ])}
      gradeBand={gradeBand}
      onPress={onPress}
      testID={`assignment-card-${assignment.id}`}
    >
      {assignment.status === "feedback_ready" ? (
        <View style={styles.feedbackBanner}>
          <View style={styles.feedbackDot} />
          <Text
            numberOfLines={1}
            selectable
            style={[getAccessibleTextStyle(styles.feedbackBannerText, settings)]}
          >
            {t("assignments.history.feedbackReadyBanner")}
          </Text>
        </View>
      ) : null}

      <View style={styles.statusRow}>
        <AssignmentStatusBadge gradeBand={gradeBand} status={assignment.status} />
        <Text
          selectable
          style={[getAccessibleTextStyle(styles.dueLabel, settings)]}
        >
          {assignment.dueLabel}
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

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons color={dashboard.outline} name="time-outline" size={13} />
          <Text selectable style={getAccessibleTextStyle(styles.metaText, settings)}>
            {t("common.minutes", { count: assignment.estimatedMinutes })}
          </Text>
        </View>
        {showDifficulty ? (
          <Text selectable style={getAccessibleTextStyle(styles.metaText, settings)}>
            {t(`assignments.difficulty.${assignment.difficulty}`)}
          </Text>
        ) : null}
        <Text selectable style={getAccessibleTextStyle(styles.metaText, settings)}>
          {t("assignments.history.skillLabel", { skill: skillLabel })}
        </Text>
      </View>

      <View style={styles.ctaRow}>
        <Text selectable={false} style={getAccessibleTextStyle(styles.ctaText, settings)}>
          {ctaLabel}
        </Text>
        <Ionicons color={dashboard.primary} name="chevron-forward" size={17} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  ctaRow: {
    alignItems: "center",
    borderTopColor: dashboard.surfaceContainer,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 13,
  },
  ctaText: {
    color: dashboard.primary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  dueLabel: {
    color: dashboard.outline,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  feedbackBanner: {
    alignItems: "center",
    backgroundColor: dashboard.tertiaryContainer,
    borderColor: colors.feedback.warning.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    marginBottom: 13,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  feedbackBannerText: {
    color: dashboard.tertiaryText,
    flex: 1,
    fontSize: 11.5,
    fontWeight: "600",
    lineHeight: 15,
  },
  feedbackDot: {
    backgroundColor: dashboard.tertiaryFixedDim,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  metaRow: {
    alignItems: "center",
    columnGap: 9,
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
    rowGap: 6,
  },
  metaText: {
    color: dashboard.outline,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  title: {
    marginBottom: 13,
  },
});
