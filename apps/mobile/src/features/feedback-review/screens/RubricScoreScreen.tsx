import { useMemo, type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getStudentReviewRevisionRoute } from "@/core/navigation/deepLinks";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";
import { EntitlementGate } from "@/features/subscriptions";

import { RubricScoreCard } from "../components";
import { useFeedbackReview } from "../hooks/useFeedbackReview";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function RubricScoreScreen() {
  const { t } = useI18n();
  const fallbackWrapper = (content: ReactNode) => (
    <Screen
      backgroundColor={colors.background.subtle}
      gradeBand="middle"
      subtitle={t("feedbackReview.rubric.subtitle")}
      testID="feedback-rubric-screen"
      title={t("feedbackReview.rubric.title")}
    >
      {content}
    </Screen>
  );

  return (
    <EntitlementGate fallbackWrapper={fallbackWrapper} featureId="rubric_detail">
      <RubricScoreContent />
    </EntitlementGate>
  );
}

function RubricScoreContent() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ submissionId?: string | string[] }>();
  const submissionId = useMemo(() => getParamValue(params.submissionId), [params.submissionId]);
  const state = useFeedbackReview(submissionId);

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("feedbackReview.rubric.subtitle")}
      testID="feedback-rubric-screen"
      title={t("feedbackReview.rubric.title")}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("feedbackReview.rubric.loadingAccessibility")}
          description={t("feedbackReview.rubric.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("feedbackReview.rubric.loadingTitle")}
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
        <Stack gap="lg">
          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("feedbackReview.rubric.sectionSubtitle")}
            title={t("feedbackReview.rubric.sectionTitle")}
          >
            <Stack gap="md">
              {state.viewModel.visibleRubricScores.map((score) => (
                <RubricScoreCard gradeBand={state.gradeBand} key={score.criterionId} score={score} />
              ))}
            </Stack>
          </PageSection>

          {!state.viewModel.gradeAdaptation.showDetailedRubric ? (
            <StatusState
              accessibilityLabel={t("feedbackReview.rubric.simpleAccessibility")}
              description={t("feedbackReview.rubric.simpleDescription")}
              gradeBand={state.gradeBand}
              title={t("feedbackReview.rubric.simpleTitle")}
              tone="info"
            />
          ) : null}

          <StatusState
            actionLabel={t("feedbackReview.rubric.revisionCta")}
            accessibilityLabel={t("feedbackReview.rubric.revisionAccessibility")}
            description={t("feedbackReview.rubric.revisionDescription")}
            gradeBand={state.gradeBand}
            onActionPress={() => {
              router.push(getStudentReviewRevisionRoute(state.viewModel.review.submissionId));
            }}
            title={t("feedbackReview.nextStepLabel")}
            tone="success"
          />
        </Stack>
      ) : null}
    </Screen>
  );
}
