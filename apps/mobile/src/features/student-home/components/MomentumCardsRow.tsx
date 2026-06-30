import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, palette } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

import type { StudentHomeViewModel } from "../types";

const dashboard = colors.dashboard;
const FEEDBACK_REWARD_POINTS = 12;

interface MomentumCardsRowProps {
  viewModel: StudentHomeViewModel;
  onOpenAllAssignments: () => void;
  onOpenFeedback: () => void;
  onOpenPractice: () => void;
  onOpenTask: () => void;
}

/**
 * "Keep the momentum" — the Habit Loop home's horizontal next-step cards:
 * today's task, daily practice, and new feedback when one is waiting.
 */
export function MomentumCardsRow({
  viewModel,
  onOpenAllAssignments,
  onOpenFeedback,
  onOpenPractice,
  onOpenTask,
}: MomentumCardsRowProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const draft = viewModel.continueDraft;
  const assignment = viewModel.todayAssignment;
  const feedback = viewModel.recentFeedback[0] ?? null;
  const taskTitle = draft?.title ?? assignment?.title ?? null;
  const taskMeta = draft
    ? t("studentHome.momentum.wordsDrafted", { count: draft.wordCount })
    : assignment
      ? t("common.minutes", { count: assignment.estimatedMinutes })
      : null;
  const practiceMeta = viewModel.dailyPractice.completedToday
    ? t("studentHome.momentum.practiceDoneMeta")
    : t("studentHome.momentum.practiceMeta", { count: viewModel.dailyPractice.minutesGoal });

  return (
    <View style={styles.section} testID="student-home-momentum">
      <View style={styles.headerRow}>
        <Text selectable style={getAccessibleTextStyle(styles.headerTitle, settings)}>
          {t("studentHome.momentum.title")}
        </Text>
        <Pressable
          accessibilityLabel={t("studentHome.momentum.allAssignmentsAccessibility")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onOpenAllAssignments}
          style={({ pressed }) => [styles.headerLink, pressed ? styles.pressed : null]}
        >
          <Text selectable={false} style={getAccessibleTextStyle(styles.headerLinkText, settings)}>
            {t("studentHome.momentum.allAssignments")}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={dashboard.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.rowContent}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {taskTitle ? (
          <MomentumCard
            accessibilityLabel={t("studentHome.momentum.taskAccessibility")}
            ctaColor={dashboard.primary}
            ctaLabel={
              draft
                ? t("studentHome.momentum.taskContinueCta")
                : t("studentHome.momentum.startWritingCta")
            }
            eyebrow={t("studentHome.momentum.taskEyebrow")}
            eyebrowColor={dashboard.secondary}
            meta={taskMeta ?? ""}
            onPress={onOpenTask}
            testID="student-home-today-assignment"
            title={taskTitle}
          />
        ) : null}

        <MomentumCard
          accessibilityLabel={t("studentHome.practice.dailyAccessibility")}
          ctaColor={palette.amber[700]}
          ctaLabel={t("studentHome.momentum.startCta")}
          eyebrow={t("studentHome.momentum.practiceEyebrow")}
          eyebrowColor={palette.amber[700]}
          meta={practiceMeta}
          onPress={onOpenPractice}
          testID="student-home-daily-practice"
          title={viewModel.dailyPractice.nextPromptLabel}
        />

        {feedback ? (
          <MomentumCard
            accessibilityLabel={t("studentHome.feedback.accessibility")}
            ctaColor={dashboard.primary}
            ctaLabel={t("studentHome.momentum.openCta")}
            eyebrow={t("studentHome.momentum.feedbackEyebrow")}
            eyebrowColor={dashboard.secondary}
            meta={t("studentHome.momentum.feedbackMeta", { count: FEEDBACK_REWARD_POINTS })}
            onPress={onOpenFeedback}
            testID="student-home-feedback"
            title={feedback.title}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function MomentumCard({
  accessibilityLabel,
  ctaColor,
  ctaLabel,
  eyebrow,
  eyebrowColor,
  meta,
  onPress,
  testID,
  title,
}: {
  accessibilityLabel: string;
  ctaColor: string;
  ctaLabel: string;
  eyebrow: string;
  eyebrowColor: string;
  meta: string;
  onPress: () => void;
  testID: string;
  title: string;
}) {
  const { settings } = useAccessibilityContext();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
      testID={testID}
    >
      <Text
        numberOfLines={1}
        selectable={false}
        style={[getAccessibleTextStyle(styles.cardEyebrow, settings), { color: eyebrowColor }]}
      >
        {eyebrow}
      </Text>
      <Text numberOfLines={2} selectable style={getAccessibleTextStyle(styles.cardTitle, settings)}>
        {title}
      </Text>
      <Text numberOfLines={1} selectable style={getAccessibleTextStyle(styles.cardMeta, settings)}>
        {meta}
      </Text>
      <View style={styles.cardCta}>
        <Text
          numberOfLines={1}
          selectable={false}
          style={[getAccessibleTextStyle(styles.cardCtaText, settings), { color: ctaColor }]}
        >
          {ctaLabel}
        </Text>
        <Ionicons name="chevron-forward" size={15} color={ctaColor} />
      </View>
    </Pressable>
  );
}

const cardShadow = {
  elevation: 2,
  shadowColor: palette.black,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 14,
} as const;

const styles = StyleSheet.create({
  card: {
    ...cardShadow,
    backgroundColor: dashboard.card,
    borderColor: dashboard.outlineVariant,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 15,
    width: 182,
  },
  cardCta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 5,
  },
  cardCtaText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    lineHeight: 13,
    textTransform: "uppercase",
  },
  cardMeta: {
    color: dashboard.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  cardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.995 }],
  },
  cardTitle: {
    color: dashboard.onSurface,
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 22,
  },
  headerLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    minHeight: 32,
  },
  headerLinkText: {
    color: dashboard.primary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: dashboard.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.3,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  pressed: {
    opacity: 0.72,
  },
  rowContent: {
    gap: 12,
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  section: {
    gap: 11,
  },
});
