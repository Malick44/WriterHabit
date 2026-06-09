import { useRouter } from "expo-router";

import { getTeacherSubmissionReviewRoute } from "@/core/navigation/deepLinks";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, OfflineBanner, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import { TeacherSubmissionCard } from "../components";
import { useTeacherSubmissionsData } from "../hooks/useTeacher";

export function TeacherSubmissionsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useTeacherSubmissionsData();

  return (
    <Screen
      backgroundColor={colors.background.subtle}
      gradeBand={state.gradeBand}
      subtitle={t("teacher.submissions.subtitle")}
      testID="teacher-submissions-screen"
      title={t("teacher.submissions.title")}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("teacher.loading.submissionsAccessibility")}
          description={t("teacher.loading.submissionsDescription")}
          gradeBand={state.gradeBand}
          label={t("teacher.loading.submissionsTitle")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("teacher.error.submissionsAccessibility")}
          description={t("teacher.error.submissionsDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("teacher.error.submissionsTitle")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("teacher.empty.submissionsAccessibility")}
          description={t("teacher.empty.submissionsDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("teacher.empty.submissionsTitle")}
        />
      ) : null}

      {state.status === "success" ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <OfflineBanner
              actionLabel={t("common.retry")}
              accessibilityLabel={t("teacher.offline.accessibility")}
              description={t("teacher.offline.description")}
              gradeBand={state.gradeBand}
              isRetrying={state.isRefreshing}
              onRetry={state.refetch}
              title={t("teacher.offline.title")}
            />
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.submissions.queueSubtitle")}
            title={t("teacher.submissions.queueTitle")}
          >
            <Stack gap="md">
              {state.viewModel.awaitingReview.length > 0 ? (
                state.viewModel.awaitingReview.map((submission) => (
                  <TeacherSubmissionCard
                    gradeBand={state.gradeBand}
                    key={submission.id}
                    onPress={() => router.push(getTeacherSubmissionReviewRoute(submission.id))}
                    submission={submission}
                  />
                ))
              ) : (
                <StatusState
                  accessibilityLabel={t("teacher.submissions.emptyQueueAccessibility")}
                  description={t("teacher.submissions.emptyQueueDescription")}
                  gradeBand={state.gradeBand}
                  title={t("teacher.submissions.emptyQueueTitle")}
                  tone="success"
                />
              )}
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.submissions.reviewedSubtitle")}
            title={t("teacher.submissions.reviewedTitle")}
          >
            <Stack gap="md">
              {state.viewModel.reviewed.length > 0 ? (
                state.viewModel.reviewed.map((submission) => (
                  <TeacherSubmissionCard
                    gradeBand={state.gradeBand}
                    key={submission.id}
                    onPress={() => router.push(getTeacherSubmissionReviewRoute(submission.id))}
                    submission={submission}
                  />
                ))
              ) : (
                <StatusState
                  accessibilityLabel={t("teacher.submissions.emptyReviewedAccessibility")}
                  description={t("teacher.submissions.emptyReviewedDescription")}
                  gradeBand={state.gradeBand}
                  title={t("teacher.submissions.emptyReviewedTitle")}
                  tone="neutral"
                />
              )}
              <StatusState
                accessibilityLabel={t("teacher.submissions.paginationAccessibility")}
                description={t("teacher.submissions.paginationDescription")}
                gradeBand={state.gradeBand}
                title={t("teacher.submissions.paginationTitle")}
                tone="neutral"
              />
            </Stack>
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
