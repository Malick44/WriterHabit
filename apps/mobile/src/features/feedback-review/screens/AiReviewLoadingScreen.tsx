import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Animated, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getStudentReviewSummaryRoute } from "@/core/navigation/deepLinks";
import { colors, layout, palette, radius, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, OfflineBanner } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useFeedbackReview } from "../hooks/useFeedbackReview";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function AiReviewLoadingScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ submissionId?: string | string[] }>();
  const submissionId = useMemo(() => getParamValue(params.submissionId), [params.submissionId]);
  const state = useFeedbackReview(submissionId);
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[state.gradeBand];
  const textColor = settings.highContrast ? accessibleColors.text : palette.white;
  const mutedTextColor = settings.highContrast ? accessibleColors.mutedText : colors.dashboard.onPrimaryContainer;

  // Animation values: lazy state keeps the instances stable across renders
  // without reading a ref during render.
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [rotateAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (settings.reducedMotion) {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    rotateLoop.start();

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, [pulseAnim, rotateAnim, settings.reducedMotion]);

  useEffect(() => {
    if (state.status === "success") {
      // Let screen reader users know the review finished and the CTA appeared.
      AccessibilityInfo.announceForAccessibility(t("feedbackReview.loadingContinueCta"));
    }
  }, [state.status, t]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Screen
      backgroundColor={settings.highContrast ? accessibleColors.background : colors.dashboard.onSurface}
      gradeBand={state.gradeBand}
      testID="ai-review-loading-screen"
    >
      {state.status === "error" ? (
        <View style={styles.stateContainer}>
          <ErrorState
            actionLabel={t("common.retry")}
            actionLoading={state.isRefreshing}
            accessibilityLabel={t("feedbackReview.error.accessibility")}
            description={t("feedbackReview.error.description")}
            gradeBand={state.gradeBand}
            onActionPress={state.refetch}
            testID="ai-review-error"
            title={t("feedbackReview.error.title")}
          />
        </View>
      ) : null}

      {state.status === "missing" ? (
        <View style={styles.stateContainer}>
          <EmptyState
            actionLabel={t("feedbackReview.missing.action")}
            accessibilityLabel={t("feedbackReview.missing.accessibility")}
            description={t("feedbackReview.missing.description")}
            gradeBand={state.gradeBand}
            onActionPress={() => router.replace("/(student)/assignments/history")}
            testID="ai-review-missing"
            title={t("feedbackReview.missing.title")}
          />
        </View>
      ) : null}

      {state.status !== "error" && state.status !== "missing" ? (
        <View style={styles.container}>
          {/* Circular back button */}
          <TouchableOpacity
            accessibilityLabel={t("common.back")}
            accessibilityRole="button"
            hitSlop={getAccessibleHitSlop(settings)}
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: settings.highContrast ? accessibleColors.surface : "rgba(42, 61, 86, 0.5)" }]}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.headerTextContainer}>
            <Text
              accessibilityRole="header"
              style={[
                getAccessibleTextStyle(type.heading, settings),
                styles.title,
                { color: textColor },
              ]}
            >
              {t("feedbackReview.reviewingTitle")}
            </Text>
            <Text
              style={[
                getAccessibleTextStyle(type.body, settings),
                styles.subtitle,
                { color: mutedTextColor },
              ]}
            >
              {t("feedbackReview.reviewingSubtitle")}
            </Text>
          </View>

          {/* Glowing Avatar */}
          <View style={styles.avatarWrapper}>
            <Animated.View
              style={[
                styles.glowRingOuter,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: settings.highContrast ? "transparent" : "rgba(218, 226, 255, 0.15)",
                },
              ]}
            />
            <Animated.View
              style={[
                styles.glowRingInner,
                {
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: settings.highContrast ? "transparent" : "rgba(0, 71, 171, 0.3)",
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dashedBorder,
                {
                  transform: [{ rotate: rotation }],
                  borderColor: settings.highContrast ? accessibleColors.border : "rgba(218, 226, 255, 0.25)",
                },
              ]}
            />
            <View style={[styles.avatarCircle, { borderColor: palette.white, backgroundColor: colors.dashboard.inverseSurfaceHigh }]}>
              <Image
                accessible={false}
                source={require("../../../../assets/generated/empty-states/ai-coach-avatar.png")}
                style={styles.avatarImage}
              />
            </View>
          </View>

          {/* Checklist */}
          <View style={styles.checklist}>
            {/* Step 1: Understanding prompt */}
            <View style={styles.checkItem}>
              <View style={[styles.checkCircle, styles.checkCircleComplete]}>
                <Ionicons name="checkmark" size={14} color={colors.dashboard.onSurface} />
              </View>
              <Text style={[getAccessibleTextStyle(type.bodyStrong, settings), styles.checkText, { color: textColor }]}>
                {t("feedbackReview.loadingSteps.understandingPrompt")}
              </Text>
            </View>

            {/* Step 2: Checking main idea */}
            <View style={styles.checkItem}>
              <View style={[styles.checkCircle, styles.checkCircleComplete]}>
                <Ionicons name="checkmark" size={14} color={colors.dashboard.onSurface} />
              </View>
              <Text style={[getAccessibleTextStyle(type.bodyStrong, settings), styles.checkText, { color: textColor }]}>
                {t("feedbackReview.loadingSteps.checkingMainIdea")}
              </Text>
            </View>

            {/* Step 3: Looking for details */}
            <View style={styles.checkItem}>
              <View style={[styles.checkCircle, styles.checkCircleComplete]}>
                <Ionicons name="checkmark" size={14} color={colors.dashboard.onSurface} />
              </View>
              <Text style={[getAccessibleTextStyle(type.bodyStrong, settings), styles.checkText, { color: textColor }]}>
                {t("feedbackReview.loadingSteps.lookingForDetails")}
              </Text>
            </View>

            {/* Step 4: Grammar & usage */}
            <View style={styles.checkItem}>
              {state.status === "success" ? (
                <View style={[styles.checkCircle, styles.checkCircleComplete]}>
                  <Ionicons name="checkmark" size={14} color={colors.dashboard.onSurface} />
                </View>
              ) : (
                <View style={[styles.checkCircle, styles.checkCircleActive]}>
                  <ActivityIndicator size="small" color={mutedTextColor} />
                </View>
              )}
              <Text
                style={[
                  getAccessibleTextStyle(type.bodyStrong, settings),
                  styles.checkText,
                  { color: textColor },
                  state.status !== "success" && { color: mutedTextColor, fontWeight: "bold" },
                ]}
              >
                {t("feedbackReview.loadingSteps.reviewingGrammar")}
              </Text>
            </View>

            {/* Step 5: Preparing feedback */}
            <View style={styles.checkItem}>
              {state.status === "success" ? (
                <View style={[styles.checkCircle, styles.checkCircleComplete]}>
                  <Ionicons name="checkmark" size={14} color={colors.dashboard.onSurface} />
                </View>
              ) : (
                <View style={[styles.checkCircle, styles.checkCirclePending]} />
              )}
              <Text
                style={[
                  getAccessibleTextStyle(type.bodyStrong, settings),
                  styles.checkText,
                  { color: textColor },
                  state.status !== "success" && { opacity: 0.5 },
                ]}
              >
                {t("feedbackReview.loadingSteps.preparingFeedback")}
              </Text>
            </View>
          </View>

          {/* Continue Action (Only shown when ready) */}
          {state.status === "success" ? (
            <TouchableOpacity
              accessibilityLabel={t("feedbackReview.loadingContinueCta")}
              accessibilityRole="button"
              style={[styles.continueButton, { backgroundColor: colors.action.primary.background }]}
              onPress={() => {
                router.replace(getStudentReviewSummaryRoute(state.viewModel.review.submissionId));
              }}
            >
              <Text style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: colors.text.inverse }]}>
                {t("feedbackReview.loadingContinueCta")}
              </Text>
            </TouchableOpacity>
          ) : null}

          {state.status === "success" && state.viewModel.isOffline ? (
            <OfflineBanner
              actionLabel={t("feedbackReview.offline.action")}
              accessibilityLabel={t("feedbackReview.offline.accessibility")}
              description={t("feedbackReview.offline.description")}
              gradeBand={state.gradeBand}
              isRetrying={state.isRefreshing}
              onRetry={state.refetch}
              title={t("feedbackReview.offline.title")}
            />
          ) : null}

          {/* Tip Card at the bottom */}
          <View
            style={[
              styles.tipCard,
              settings.highContrast
                ? { backgroundColor: accessibleColors.surface, borderColor: accessibleColors.border }
                : { backgroundColor: colors.dashboard.inverseSurfaceHigh, borderColor: "rgba(42, 61, 86, 0.8)" },
            ]}
          >
            <View style={styles.tipIconContainer}>
              <Ionicons name="bulb-outline" size={20} color={colors.dashboard.tertiaryFixedDim} />
            </View>
            <View style={styles.tipTextContainer}>
              <Text style={[getAccessibleTextStyle(type.caption, settings), styles.tipLabel, { color: mutedTextColor }]}>
                {t("feedbackReview.loadingTipTitle")}
              </Text>
              <Text style={[getAccessibleTextStyle(type.body, settings), styles.tipBody, { color: textColor }]}>
                {t("feedbackReview.loadingTipBody")}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    justifyContent: "center",
  },
  container: {
    alignItems: "center",
    flex: 1,
    paddingTop: spacing.md,
    width: "100%",
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.full,
    justifyContent: "center",
    minHeight: layout.touchTarget,
    minWidth: layout.touchTarget,
  },
  headerTextContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
    marginTop: spacing.md,
    width: "100%",
  },
  title: {
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    marginTop: spacing.xs,
    textAlign: "center",
  },
  avatarWrapper: {
    alignItems: "center",
    height: 192,
    justifyContent: "center",
    marginBottom: spacing.xl,
    position: "relative",
    width: 192,
  },
  glowRingOuter: {
    borderRadius: radius.full,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  glowRingInner: {
    borderRadius: radius.full,
    bottom: 16,
    left: 16,
    position: "absolute",
    right: 16,
    top: 16,
  },
  dashedBorder: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderRadius: radius.full,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  avatarCircle: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 4,
    height: 128,
    justifyContent: "center",
    overflow: "hidden",
    width: 128,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  checklist: {
    alignSelf: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
    width: 280,
  },
  checkItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  checkCircle: {
    alignItems: "center",
    borderRadius: radius.full,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkCircleComplete: {
    backgroundColor: colors.dashboard.secondaryFixedDim,
  },
  checkCircleActive: {
    borderWidth: 2,
    borderColor: colors.dashboard.onPrimaryContainer,
  },
  checkCirclePending: {
    borderWidth: 2,
    borderColor: "rgba(42, 61, 86, 0.8)",
  },
  checkText: {
    opacity: 0.9,
  },
  continueButton: {
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    width: 280,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  tipCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    width: "100%",
    marginTop: spacing.xl,
  },
  tipIconContainer: {
    alignItems: "center",
    borderRadius: radius.full,
    backgroundColor: "rgba(255, 174, 60, 0.1)",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipLabel: {
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tipBody: {
    marginTop: spacing.xs,
  },
});

