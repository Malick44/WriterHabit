import { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getStudentReviewSummaryRoute } from "@/core/navigation/deepLinks";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { Screen, Stack } from "@/shared/components/layout";

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

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("feedbackReview.loadingSubtitle")}
      testID="ai-review-loading-screen"
      title={t("feedbackReview.loadingTitle")}
    >
      <Stack gap="lg">
        {state.status === "loading" ? (
          <LoadingState
            accessibilityLabel={t("feedbackReview.loadingAccessibility")}
            description={t("feedbackReview.loadingDescription", {
              submissionId: submissionId ?? t("common.unavailable"),
            })}
            gradeBand={state.gradeBand}
            label={t("feedbackReview.loadingLabel")}
            testID="ai-review-loading"
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
            testID="ai-review-error"
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
            testID="ai-review-missing"
            title={t("feedbackReview.missing.title")}
          />
        ) : null}

        {state.status === "success" ? (
          <StatusState
            actionLabel={t("feedbackReview.loadingContinueCta")}
            accessibilityLabel={t("feedbackReview.readyAccessibility")}
            description={t("feedbackReview.readyDescription")}
            gradeBand={state.gradeBand}
            onActionPress={() => {
              router.replace(getStudentReviewSummaryRoute(state.viewModel.review.submissionId));
            }}
            title={t("feedbackReview.readyTitle")}
            tone="success"
          />
        ) : null}

        {state.status === "success" && state.viewModel.isOffline ? (
          <StatusState
            actionLabel={t("feedbackReview.offline.action")}
            accessibilityLabel={t("feedbackReview.offline.accessibility")}
            description={t("feedbackReview.offline.description")}
            gradeBand={state.gradeBand}
            onActionPress={state.refetch}
            title={t("feedbackReview.offline.title")}
            tone="warning"
          />
        ) : null}

        <StatusState
          accessibilityLabel={t("feedbackReview.coachingAccessibility")}
          description={t("feedbackReview.coachingDescription")}
          gradeBand={state.gradeBand}
          title={t("feedbackReview.coachingTitle")}
          tone="info"
        />
      </Stack>
    </Screen>
  );
}
