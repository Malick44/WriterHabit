import { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getAssignmentDetailRoute } from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import { AssignmentPromptCard, SubmissionChecklist } from "../components";
import { useAssignmentSubmissionData } from "../hooks/useAssignments";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function AssignmentSubmissionScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ assignmentId?: string | string[] }>();
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const state = useAssignmentSubmissionData(assignmentId);

  const backToAssignment = () => {
    if (assignmentId) {
      router.replace(getAssignmentDetailRoute(assignmentId));
      return;
    }

    router.replace(routes.studentAssignmentsHistory);
  };

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("assignments.submit.subtitle")}
      testID="assignment-submission-screen"
      title={t("assignments.submit.screenTitle")}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("assignments.submit.loadingAccessibility")}
          description={t("assignments.submit.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("assignments.submit.loadingTitle")}
          testID="assignment-submission-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("assignments.submit.errorAccessibility")}
          description={t("assignments.submit.loadErrorDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="assignment-submission-error"
          title={t("assignments.submit.errorTitle")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("assignments.detail.missingAction")}
          accessibilityLabel={t("assignments.detail.missingAccessibility")}
          description={t("assignments.detail.missingDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.replace(routes.studentAssignmentsHistory)}
          testID="assignment-submission-missing"
          title={t("assignments.detail.missingTitle")}
        />
      ) : null}

      {state.status === "success" && state.viewModel.assignment ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <StatusState
              actionLabel={t("assignments.submit.offlineAction")}
              accessibilityLabel={t("assignments.submit.offlineAccessibility")}
              description={t("assignments.submit.offlineDescription")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              title={t("assignments.submit.offlineTitle")}
              tone="warning"
            />
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("assignments.submit.assignmentSubtitle")}
            title={t("assignments.submit.assignmentTitle")}
          >
            <AssignmentPromptCard
              assignment={state.viewModel.assignment}
              gradeAdaptation={state.viewModel.gradeAdaptation}
              gradeBand={state.gradeBand}
            />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("assignments.submit.checklistSubtitle")}
            title={t("assignments.submit.checklistTitle")}
          >
            <SubmissionChecklist
              gradeBand={state.gradeBand}
              onBackToAssignment={backToAssignment}
              onSubmit={() => {
                void state.submitAssignment();
              }}
              submitResult={state.submitResult}
              submitStatus={state.submitStatus}
              viewModel={state.viewModel}
            />
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
