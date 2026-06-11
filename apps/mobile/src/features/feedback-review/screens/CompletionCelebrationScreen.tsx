import { useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import { useAuthStore } from "@/core/auth/authStore";

import { useFeedbackReview } from "../hooks/useFeedbackReview";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Static reward defaults until the backend rewards API supplies real values.
const completionRewards = {
  grammarDelta: 10,
  points: 25,
  streakDays: 1,
} as const;

export function CompletionCelebrationScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ submissionId?: string | string[] }>();
  const submissionId = useMemo(() => getParamValue(params.submissionId), [params.submissionId]);
  const state = useFeedbackReview(submissionId);
  const session = useAuthStore((state) => state.session);
  const studentName = session?.user?.displayName || t("common.fallbackDisplayName");
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = state.status === "success" ? typography.gradeBands[state.gradeBand] : typography.gradeBands.middle;

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      testID="feedback-completion-screen"
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("feedbackReview.completion.loadingAccessibility")}
          description={t("feedbackReview.completion.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("feedbackReview.completion.loadingTitle")}
        />
      ) : null}

      {state.status === "processing" ? (
        <StatusState
          actionLabel={t("feedbackReview.loadingRetryCta")}
          accessibilityLabel={t("feedbackReview.processingAccessibility")}
          description={t("feedbackReview.processingDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("feedbackReview.processingTitle")}
          tone="info"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("feedbackReview.error.accessibility")}
          description={t("feedbackReview.error.description")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("feedbackReview.error.title")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("feedbackReview.missing.action")}
          accessibilityLabel={t("feedbackReview.missing.accessibility")}
          description={t("feedbackReview.missing.description")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.replace("/(student)/assignments/history")}
          title={t("feedbackReview.missing.title")}
        />
      ) : null}

      {state.status === "success" ? (
        <View style={styles.container}>
          {/* Confetti Dots Decoration */}
          <View style={[styles.confetti, { backgroundColor: colors.coach.accent, left: 30, top: 40, width: 8, height: 8 }]} />
          <View style={[styles.confetti, { backgroundColor: colors.action.primary.background, left: 140, top: 10, width: 6, height: 6 }]} />
          <View style={[styles.confetti, { backgroundColor: colors.feedback.success.text, right: 60, top: 50, width: 10, height: 10 }]} />
          <View style={[styles.confetti, { backgroundColor: colors.coach.accent, right: 20, top: 120, width: 6, height: 6 }]} />
          <View style={[styles.confetti, { backgroundColor: colors.feedback.success.text, left: 40, bottom: 250, width: 8, height: 8 }]} />
          <View style={[styles.confetti, { backgroundColor: colors.action.primary.background, right: 80, bottom: 200, width: 10, height: 10 }]} />

          {/* Header Text */}
          <View style={styles.header}>
            <Text
              accessibilityRole="header"
              style={[
                getAccessibleTextStyle(type.heading, settings),
                styles.title,
                { color: accessibleColors.text },
              ]}
            >
              {t("feedbackReview.completion.headerTitlePersonalized", { name: studentName })}{" "}
              <Ionicons name="gift-outline" size={24} color={colors.coach.accent} />
            </Text>
            <Text
              style={[
                getAccessibleTextStyle(type.body, settings),
                styles.subtitle,
                { color: accessibleColors.mutedText },
              ]}
            >
              {t("feedbackReview.completion.headerSubtitle")}
            </Text>
          </View>

          {/* Central Trophy */}
          <View style={styles.trophyWrapper}>
            <Image
              accessible={false}
              source={require("../../../../assets/generated/badges/completion-trophy.png")}
              style={styles.trophyImage}
            />
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: colors.feedback.success.background,
                borderColor: colors.feedback.success.border,
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={18} color={colors.feedback.success.text} />
            <Text
              style={[
                getAccessibleTextStyle(type.bodyStrong, settings),
                { color: colors.feedback.success.text, fontWeight: "bold" },
              ]}
            >
              {t("feedbackReview.completion.statusBadgeLabel")}
            </Text>
          </View>

          {/* Rewards Grid */}
          <View style={styles.rewardsContainer}>
            <Text
              style={[
                getAccessibleTextStyle(type.caption, settings),
                styles.rewardsLabel,
                { color: accessibleColors.mutedText },
              ]}
            >
              {t("feedbackReview.completion.youEarnedLabel")}
            </Text>

            <View style={styles.grid}>
              {/* Card 1: Points */}
              <View style={[styles.rewardCard, { backgroundColor: accessibleColors.surface, borderColor: accessibleColors.border }]}>
                <Ionicons name="star" size={28} color={colors.coach.accent} style={styles.rewardIcon} />
                <Text
                  style={[
                    getAccessibleTextStyle(type.heading, settings),
                    styles.rewardValue,
                    { color: colors.action.primary.background },
                  ]}
                >
                  {t("feedbackReview.completion.points", { count: completionRewards.points })}
                </Text>
                <Text style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
                  {t("feedbackReview.completion.pointsLabel")}
                </Text>
              </View>

              {/* Card 2: Streak */}
              <View style={[styles.rewardCard, { backgroundColor: accessibleColors.surface, borderColor: accessibleColors.border }]}>
                <Ionicons name="flame" size={28} color={colors.feedback.error.text} style={styles.rewardIcon} />
                <Text
                  style={[
                    getAccessibleTextStyle(type.heading, settings),
                    styles.rewardValue,
                    { color: colors.action.primary.background },
                  ]}
                >
                  {t("feedbackReview.completion.streakDays", { count: completionRewards.streakDays })}
                </Text>
                <Text style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
                  {t("feedbackReview.completion.streakLabel")}
                </Text>
              </View>

              {/* Card 3: Grammar */}
              <View style={[styles.rewardCard, { backgroundColor: accessibleColors.surface, borderColor: accessibleColors.border }]}>
                <Ionicons name="bar-chart" size={28} color={colors.feedback.success.text} style={styles.rewardIcon} />
                <Text
                  style={[
                    getAccessibleTextStyle(type.heading, settings),
                    styles.rewardValue,
                    { color: colors.action.primary.background },
                  ]}
                >
                  {t("feedbackReview.completion.grammarDelta", { count: completionRewards.grammarDelta })}
                </Text>
                <Text style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
                  {t("feedbackReview.completion.grammarLabel")}
                </Text>
              </View>
            </View>
          </View>

          {/* Encouragement */}
          <View style={styles.encouragementContainer}>
            <Text
              style={[
                getAccessibleTextStyle(type.bodyStrong, settings),
                { color: accessibleColors.text },
              ]}
            >
              {t("feedbackReview.completion.keepItUp")}
            </Text>
            <Text
              style={[
                getAccessibleTextStyle(type.body, settings),
                styles.encouragementText,
                { color: accessibleColors.mutedText },
              ]}
            >
              {t("feedbackReview.completion.strongWritingHabits")}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityLabel={t("feedbackReview.completion.progressCta")}
              accessibilityRole="button"
              style={[styles.actionButton, styles.actionButtonPrimary, { backgroundColor: colors.action.primary.background }]}
              onPress={() => router.push("/(student)/progress")}
            >
              <Text style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: colors.text.inverse }]}>
                {t("feedbackReview.completion.progressCta")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityLabel={t("feedbackReview.completion.homeCta")}
              accessibilityRole="button"
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => router.replace("/(student)/home")}
            >
              <Text style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: colors.action.primary.background }]}>
                {t("feedbackReview.completion.homeCta")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    paddingTop: spacing.md,
    position: "relative",
    width: "100%",
  },
  confetti: {
    borderRadius: radius.full,
    opacity: 0.6,
    position: "absolute",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.xs,
    textAlign: "center",
  },
  trophyWrapper: {
    alignItems: "center",
    height: 224,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: 224,
  },
  trophyImage: {
    height: "100%",
    resizeMode: "contain",
    width: "100%",
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rewardsContainer: {
    marginBottom: spacing.lg,
    width: "100%",
  },
  rewardsLabel: {
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: spacing.md,
    textAlign: "center",
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },
  rewardCard: {
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  rewardIcon: {
    marginBottom: spacing.xs,
  },
  rewardValue: {
    fontWeight: "bold",
  },
  encouragementContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  encouragementText: {
    marginTop: spacing.xs,
    textAlign: "center",
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
    width: "100%",
  },
  actionButton: {
    alignItems: "center",
    borderRadius: radius.full,
    justifyContent: "center",
    paddingVertical: spacing.md,
    width: "100%",
  },
  actionButtonPrimary: {
    borderWidth: 0,
  },
  actionButtonSecondary: {
    borderWidth: 0,
  },
});
