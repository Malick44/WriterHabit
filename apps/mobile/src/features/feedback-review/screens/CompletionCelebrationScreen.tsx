import { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, StatusState, SuccessState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import { ProgressEarnedCard } from "../components";
import { useFeedbackReview } from "../hooks/useFeedbackReview";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function CompletionCelebrationScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ submissionId?: string | string[] }>();
  const submissionId = useMemo(() => getParamValue(params.submissionId), [params.submissionId]);
  const state = useFeedbackReview(submissionId);

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("feedbackReview.completion.subtitle")}
      testID="feedback-completion-screen"
      title={t("feedbackReview.celebrationTitle")}
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
        <Stack gap="lg">
          <SuccessState
            accessibilityLabel={t("feedbackReview.completion.successAccessibility")}
            description={t("feedbackReview.completion.successDescription")}
            gradeBand={state.gradeBand}
            title={t("feedbackReview.completion.successTitle")}
          />

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("feedbackReview.completion.progressSubtitle")}
            title={t("feedbackReview.completion.progressSectionTitle")}
          >
            <ProgressEarnedCard gradeBand={state.gradeBand} progress={state.viewModel.review.progressEarned} />
          </PageSection>

          <Button
            accessibilityHint={t("feedbackReview.completion.homeHint")}
            accessibilityLabel={t("feedbackReview.completion.homeAccessibility")}
            gradeBand={state.gradeBand}
            label={t("feedbackReview.completion.homeCta")}
            onPress={() => router.replace("/(student)/home")}
            size={state.gradeBand === "elementary" ? "lg" : "md"}
          />
          <Button
            accessibilityHint={t("feedbackReview.completion.progressHint")}
            accessibilityLabel={t("feedbackReview.completion.progressCtaAccessibility")}
            gradeBand={state.gradeBand}
            label={t("feedbackReview.completion.progressCta")}
            onPress={() => router.push("/(student)/progress")}
            size={state.gradeBand === "elementary" ? "lg" : "md"}
            variant="secondary"
          />
        </Stack>
      ) : null}
    </Screen>
  );
}
