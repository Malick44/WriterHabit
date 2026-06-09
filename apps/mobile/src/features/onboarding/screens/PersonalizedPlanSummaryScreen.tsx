import { useEffect, useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { Stack } from "@/shared/components/layout/Stack";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { assignmentFocusCopyKeys, confidenceCopyKeys, writingGoalCopyKeys } from "../constants";
import { OnboardingStepFrame } from "../components";
import { useOnboarding } from "../hooks/useOnboarding";
import {
  getCompletedOnboardingProfile,
  onboardingErrorMessageKeys,
  onboardingStepRoutes,
} from "../types";

export function PersonalizedPlanSummaryScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const onboarding = useOnboarding();
  const [isCompleting, setIsCompleting] = useState(false);
  const profile = getCompletedOnboardingProfile(onboarding.progress);
  const gradeBand = onboarding.progress.gradeLevel
    ? typography.getGradeBandForGrade(onboarding.progress.gradeLevel)
    : "middle";
  const type = typography.gradeBands[gradeBand];
  const accessibleColors = getAccessibleColors(settings);

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
      step="planSummary"
      subtitle={t("onboarding.planSummary.description")}
      title={t("onboarding.planSummary.title")}
    >
      <Stack gap="lg">
        <StatusState
          description={t("onboarding.planSummary.readyDescription")}
          gradeBand={gradeBand}
          title={t("onboarding.planSummary.readyTitle")}
          tone="success"
        />
        <Card
          gradeBand={gradeBand}
          title={t("onboarding.planSummary.planCardTitle")}
          subtitle={t("onboarding.planSummary.planCardSubtitle")}
        >
          <Stack gap="md">
            <SummaryRow
              label={t("onboarding.planSummary.gradeLabel")}
              value={t("onboarding.gradeSelection.gradeLabel", { grade: onboarding.plan.gradeLevel })}
            />
            <SummaryRow
              label={t("onboarding.planSummary.practiceLabel")}
              value={t("onboarding.planSummary.practiceValue", {
                daily: onboarding.plan.dailyPracticeMinutes,
                weekly: onboarding.plan.weeklyPracticeMinutes,
              })}
            />
            <SummaryRow
              label={t("onboarding.planSummary.assignmentLabel")}
              value={t(assignmentFocusCopyKeys[onboarding.plan.assignmentFocus])}
            />
            <SummaryRow
              label={t("onboarding.planSummary.confidenceLabel")}
              value={t(confidenceCopyKeys[onboarding.plan.confidenceLevel].label)}
            />
          </Stack>
        </Card>
        <Card
          gradeBand={gradeBand}
          title={t("onboarding.planSummary.firstWeekTitle")}
          subtitle={t("onboarding.planSummary.firstWeekSubtitle")}
        >
          <Stack gap="sm">
            {onboarding.plan.firstWeekGoals.map((goal) => (
              <Text
                key={goal}
                selectable
                style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}
              >
                {t(writingGoalCopyKeys[goal].label)}
              </Text>
            ))}
          </Stack>
        </Card>
        <Text
          selectable
          style={[getAccessibleTextStyle(type.bodySmall, settings), { color: colors.text.secondary }]}
        >
          {t("onboarding.planSummary.safetyNote")}
        </Text>
      </Stack>
    </OnboardingStepFrame>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap="xs">
      <Text selectable style={{ color: colors.text.secondary }}>
        {label}
      </Text>
      <Text selectable style={{ color: colors.text.primary, fontWeight: "700" }}>
        {value}
      </Text>
    </Stack>
  );
}
