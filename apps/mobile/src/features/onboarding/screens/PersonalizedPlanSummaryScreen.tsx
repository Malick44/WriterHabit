import { useEffect, useState } from "react";
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { WritingGoal } from "@WriterHabit/shared";

import { routes } from "@/core/navigation/routeNames";
import { colors, getGradeBandForGrade } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { ErrorState, LoadingState } from "@/shared/components/feedback";
import { getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";
import type { AccessibilitySettings } from "@/shared/utils/accessibility";

import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import {
  getCompletedOnboardingProfile,
  onboardingErrorMessageKeys,
  onboardingStepRoutes,
} from "../types";

const NAVY = colors.onboarding.navy;
const SCREEN_BACKGROUND = colors.onboarding.surface;

const goalSummaryCopyKeys: Partial<Record<WritingGoal, TranslationKey>> = {
  creative_writing: "onboarding.planSummary.goalNames.creativeWriting",
  improve_grammar: "onboarding.planSummary.goalNames.grammar",
  improve_handwriting: "onboarding.planSummary.goalNames.handwriting",
  improve_spelling: "onboarding.planSummary.goalNames.spelling",
  school_assignments: "onboarding.planSummary.goalNames.schoolAssignments",
  test_prep: "onboarding.planSummary.goalNames.testPrep",
  write_better_sentences: "onboarding.planSummary.goalNames.sentences",
  write_essays: "onboarding.planSummary.goalNames.essays",
  write_paragraphs: "onboarding.planSummary.goalNames.paragraphs",
};

export function PersonalizedPlanSummaryScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const onboarding = useOnboarding();
  const [isCompleting, setIsCompleting] = useState(false);

  const { settings } = useAccessibilityContext();
  const profile = getCompletedOnboardingProfile(onboarding.progress);
  const gradeBand = getGradeBandForGrade(onboarding.progress.gradeLevel ?? 7);

  useEffect(() => {
    if (!onboarding.hydrated || onboarding.plan || onboarding.status !== "idle" || !profile.success) {
      return;
    }

    void onboarding.createPlan();
  }, [onboarding, onboarding.hydrated, onboarding.plan, onboarding.status, profile.success]);

  if (!onboarding.hydrated) {
    return (
      <LoadingState
        description={t("onboarding.loading.description")}
        label={t("onboarding.loading.title")}
      />
    );
  }

  if (!profile.success) {
    const redirectStep = onboarding.firstIncompleteStep ?? "role";

    return (
      <OnboardingStepFrame
        gradeBand={gradeBand}
        backgroundColor={SCREEN_BACKGROUND}
        step="planSummary"
        subtitle={t("onboarding.planSummary.description")}
        title={t("onboarding.planSummary.title")}
      >
        <ErrorState
          actionLabel={t("onboarding.planSummary.fixMissingAction")}
          description={t("onboarding.planSummary.missingDescription")}
          gradeBand={gradeBand}
          onActionPress={() => {
            router.replace(onboardingStepRoutes[redirectStep]);
          }}
          title={t("onboarding.planSummary.missingTitle")}
        />
      </OnboardingStepFrame>
    );
  }

  if (onboarding.status === "loading" || !onboarding.plan) {
    return (
      <OnboardingStepFrame
        gradeBand={gradeBand}
        backgroundColor={SCREEN_BACKGROUND}
        step="planSummary"
        subtitle={t("onboarding.planSummary.loadingDescription")}
        title={t("onboarding.planSummary.loadingTitle")}
      >
        <LoadingState
          description={t("onboarding.planSummary.loadingDescription")}
          gradeBand={gradeBand}
          label={t("onboarding.planSummary.loadingTitle")}
        />
      </OnboardingStepFrame>
    );
  }

  const errorMessage = onboarding.errorCode ? t(onboardingErrorMessageKeys[onboarding.errorCode]) : null;
  const goalSummary = onboarding.plan.firstWeekGoals
    .map((goal) => t(goalSummaryCopyKeys[goal] ?? "onboarding.planSummary.goalNames.general"))
    .join(", ");

  return (
    <OnboardingStepFrame
      errorMessage={errorMessage}
      gradeBand={gradeBand}
      onPrimaryPress={() => {
        setIsCompleting(true);
        void onboarding.completeOnboarding().then((result) => {
          if (result.ok) {
            router.replace(routes.studentHome);
            return;
          }

          if (result.redirectTo) {
            router.replace(result.redirectTo);
          }
        }).finally(() => {
          setIsCompleting(false);
        });
      }}
      onSecondaryPress={() => {
        router.back();
      }}
      primaryLabel={t("onboarding.planSummary.startCta")}
      primaryLoading={isCompleting || onboarding.authOperationStatus === "loading"}
      secondaryLabel={t("common.back")}
      showProgressDots
      step="planSummary"
      subtitle={t("onboarding.planSummary.description")}
      title={t("onboarding.planSummary.title")}
      backgroundColor={SCREEN_BACKGROUND}
      headerAlign="left"
      primaryButtonStyle={styles.primaryButton}
      titleStyle={styles.title}
    >
      <View style={styles.summaryStack}>
        <SummaryCard
          iconName="school-outline"
          label={t("onboarding.planSummary.gradeLabel")}
          settings={settings}
          value={t("onboarding.gradeSelection.gradeLabel", { grade: onboarding.plan.gradeLevel })}
        />

        <SummaryCard
          iconName="checkmark-circle-outline"
          label={t("onboarding.planSummary.goalsLabel")}
          settings={settings}
          value={goalSummary}
          valueStyle={styles.goalsValue}
        />

        <SummaryCard
          iconName="time-outline"
          label={t("onboarding.planSummary.practiceLabel")}
          settings={settings}
          subvalue={t("onboarding.planSummary.practiceSubvalue")}
          value={t("onboarding.planSummary.practiceValue", {
            daily: onboarding.plan.dailyPracticeMinutes,
          })}
        />

        <View style={styles.previewCard}>
          <View style={styles.previewIcon}>
            <Ionicons name="document-text-outline" size={34} color={NAVY} />
          </View>
          <View style={styles.previewCopy}>
            <Text selectable style={getAccessibleTextStyle(styles.previewLabel, settings)}>
              {t("onboarding.planSummary.assignmentPreviewTitle")}
            </Text>
            <View style={styles.quoteBox}>
              <Text selectable style={getAccessibleTextStyle(styles.quoteText, settings)}>
                {t("onboarding.planSummary.assignmentPreviewQuote")}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </OnboardingStepFrame>
  );
}

function SummaryCard({
  iconName,
  label,
  value,
  settings,
  subvalue,
  valueStyle,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  settings: AccessibilitySettings;
  subvalue?: string;
  valueStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <Ionicons name={iconName} size={34} color={NAVY} />
      </View>
      <View style={styles.summaryCopy}>
        <Text selectable style={getAccessibleTextStyle(styles.summaryLabel, settings)}>
          {label}
        </Text>
        <Text
          selectable
          style={getAccessibleTextStyle({ ...styles.summaryValue, ...StyleSheet.flatten(valueStyle) }, settings)}
        >
          {value}
        </Text>
        {subvalue ? (
          <Text selectable style={getAccessibleTextStyle(styles.summarySubvalue, settings)}>
            {subvalue}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  goalsValue: {
    fontSize: 25,
    lineHeight: 34,
  },
  previewCard: {
    backgroundColor: colors.onboarding.previewCard,
    borderColor: colors.onboarding.previewBorder,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 28,
    minHeight: 196,
    overflow: "hidden",
    padding: 30,
  },
  previewCopy: {
    flex: 1,
    gap: 18,
  },
  previewIcon: {
    alignItems: "center",
    backgroundColor: colors.onboarding.surface,
    borderRadius: 44,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  previewLabel: {
    color: NAVY,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: 2,
    lineHeight: 28,
  },
  primaryButton: {
    borderRadius: 999,
  },
  quoteBox: {
    backgroundColor: colors.onboarding.surface,
    borderColor: "#E0E5EF",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  quoteText: {
    color: colors.onboarding.ink,
    fontSize: 26,
    fontStyle: "italic",
    lineHeight: 40,
  },
  summaryCard: {
    alignItems: "center",
    backgroundColor: colors.onboarding.screenBackground,
    borderColor: colors.onboarding.cardBorder,
    borderRadius: 18,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 30,
    minHeight: 142,
    paddingHorizontal: 30,
    paddingVertical: 24,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  summaryCopy: {
    flex: 1,
    gap: 8,
  },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: colors.onboarding.iconBubbleSoft,
    borderRadius: 44,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  summaryLabel: {
    color: colors.onboarding.label,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 1.2,
    lineHeight: 25,
  },
  summaryStack: {
    gap: 28,
  },
  summarySubvalue: {
    color: colors.onboarding.subtitle,
    fontSize: 23,
    lineHeight: 30,
  },
  summaryValue: {
    color: colors.onboarding.ink,
    fontSize: 27,
    fontWeight: "500",
    lineHeight: 35,
  },
  title: {
    fontSize: 28,
    fontWeight: "500",
    lineHeight: 40,
  },
});
