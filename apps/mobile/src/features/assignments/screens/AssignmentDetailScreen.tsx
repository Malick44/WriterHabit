import { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getAssignmentSubmissionRoute, getWritingWorkspaceRoute } from "@/core/navigation/deepLinks";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import {
  AssignmentActionPanel,
  AssignmentPlanCard,
  AssignmentPromptCard,
  RubricChecklist,
  SkillFocusCard,
} from "../components";
import { useAssignmentDetailData } from "../hooks/useAssignments";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function AssignmentDetailScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ assignmentId?: string | string[] }>();
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const state = useAssignmentDetailData(assignmentId);

  const startWriting = async () => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    const startedAssignment = await state.startAssignment();

    if (startedAssignment) {
      router.push(getWritingWorkspaceRoute(startedAssignment.id));
    }
  };

  const startCanvas = async () => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    const startedAssignment = await state.startAssignment();

    if (startedAssignment) {
      router.push({
        pathname: "/(student)/canvas/templates",
        params: { assignmentId: startedAssignment.id },
      });
    }
  };

  const openSubmit = () => {
    if (state.status !== "success" || !state.viewModel.assignment) {
      return;
    }

    router.push(getAssignmentSubmissionRoute(state.viewModel.assignment.id));
  };

  const title =
    state.status === "success" && state.viewModel.assignment
      ? state.viewModel.assignment.title
      : t("assignments.detail.title");

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("assignments.detail.subtitle")}
      testID="assignment-detail-screen"
      title={title}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("assignments.detail.loadingAccessibility")}
          description={t("assignments.detail.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("assignments.detail.loadingTitle")}
          testID="assignment-detail-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("assignments.detail.errorAccessibility")}
          description={t("assignments.detail.errorDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="assignment-detail-error"
          title={t("assignments.detail.errorTitle")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("assignments.detail.missingAction")}
          accessibilityLabel={t("assignments.detail.missingAccessibility")}
          description={t("assignments.detail.missingDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.push("/(student)/assignments/history")}
          testID="assignment-detail-missing"
          title={t("assignments.detail.missingTitle")}
        />
      ) : null}

      {state.status === "success" && state.viewModel.assignment ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <StatusState
              actionLabel={t("assignments.detail.offlineAction")}
              accessibilityLabel={t("assignments.detail.offlineAccessibility")}
              description={t("assignments.detail.offlineDescription")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              title={t("assignments.detail.offlineTitle")}
              tone="warning"
            />
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("assignments.detail.promptSubtitle")}
            title={t("assignments.detail.promptTitle")}
          >
            <AssignmentPromptCard
              assignment={state.viewModel.assignment}
              gradeAdaptation={state.viewModel.gradeAdaptation}
              gradeBand={state.gradeBand}
            />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("assignments.detail.planSubtitle")}
            title={t("assignments.detail.planSectionTitle")}
          >
            <AssignmentPlanCard
              assignment={state.viewModel.assignment}
              gradeAdaptation={state.viewModel.gradeAdaptation}
              gradeBand={state.gradeBand}
            />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("assignments.detail.skillsSubtitle")}
            title={t("assignments.detail.skillsSectionTitle")}
          >
            <SkillFocusCard assignment={state.viewModel.assignment} gradeBand={state.gradeBand} />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("assignments.detail.rubricSubtitle")}
            title={t("assignments.detail.rubricSectionTitle")}
          >
            <RubricChecklist
              assignment={state.viewModel.assignment}
              gradeAdaptation={state.viewModel.gradeAdaptation}
              gradeBand={state.gradeBand}
            />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("assignments.detail.actionsSubtitle")}
            title={t("assignments.detail.actionsSectionTitle")}
          >
            <AssignmentActionPanel
              assignment={state.viewModel.assignment}
              canStartCanvas={state.viewModel.canStartCanvas}
              canStartWriting={state.viewModel.canStartWriting}
              canSubmit={state.viewModel.canSubmit}
              gradeBand={state.gradeBand}
              onStartCanvas={startCanvas}
              onStartWriting={startWriting}
              onSubmitPress={openSubmit}
              startStatus={state.startStatus}
            />
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
