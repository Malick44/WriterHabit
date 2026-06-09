import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getCanvasDocumentRoute, getCanvasTemplatePickerRoute, getStudentReviewRoute } from "@/core/navigation/deepLinks";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import { CanvasAttachmentPreview } from "../components/CanvasAttachmentPreview";
import { CoachEntryPanel } from "../components/CoachEntryPanel";
import { DraftEditor } from "../components/DraftEditor";
import { WorkspacePromptCard } from "../components/WorkspacePromptCard";
import { WorkspaceRubricPanel } from "../components/WorkspaceRubricPanel";
import { WorkspaceSubmitPanel } from "../components/WorkspaceSubmitPanel";
import { useWritingWorkspace } from "../hooks/useWritingWorkspace";
import { useWritingWorkspaceUiStore } from "../stores/writingWorkspaceUiStore";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function WritingWorkspaceScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ assignmentId?: string | string[] }>();
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const state = useWritingWorkspace(assignmentId);
  const activePanel = useWritingWorkspaceUiStore((store) => store.activePanel);
  const openPanel = useWritingWorkspaceUiStore((store) => store.openPanel);
  const closePanel = useWritingWorkspaceUiStore((store) => store.closePanel);
  const [isSavingNow, setIsSavingNow] = useState(false);

  const saveNow = async () => {
    if (state.status !== "success") {
      return;
    }

    setIsSavingNow(true);
    await state.saveNow();
    setIsSavingNow(false);
  };

  const submitDraft = async () => {
    if (state.status !== "success") {
      return;
    }

    const response = await state.submitDraft();

    if (response) {
      router.push(getStudentReviewRoute(response.submissionId));
    }
  };

  const title =
    state.status === "success" && state.viewModel.assignment
      ? state.viewModel.assignment.title
      : t("writingWorkspace.title");

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("writingWorkspace.subtitle")}
      testID="writing-workspace-screen"
      title={title}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("writingWorkspace.loading.accessibility")}
          description={t("writingWorkspace.loading.description")}
          gradeBand={state.gradeBand}
          label={t("writingWorkspace.loading.title")}
          testID="writing-workspace-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("writingWorkspace.error.accessibility")}
          description={t("writingWorkspace.error.description")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="writing-workspace-error"
          title={t("writingWorkspace.error.title")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("writingWorkspace.missing.action")}
          accessibilityLabel={t("writingWorkspace.missing.accessibility")}
          description={t("writingWorkspace.missing.description")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.replace("/(student)/assignments/history")}
          testID="writing-workspace-missing"
          title={t("writingWorkspace.missing.title")}
        />
      ) : null}

      {state.status === "success" && state.viewModel.assignment ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <StatusState
              actionLabel={t("writingWorkspace.offline.action")}
              accessibilityLabel={t("writingWorkspace.offline.accessibility")}
              description={t("writingWorkspace.offline.description")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              title={t("writingWorkspace.offline.title")}
              tone="warning"
            />
          ) : null}

          {state.viewModel.autosaveStatus === "failed" ? (
            <StatusState
              actionLabel={t("writingWorkspace.recovery.action")}
              accessibilityLabel={t("writingWorkspace.recovery.accessibility")}
              description={t("writingWorkspace.recovery.description")}
              gradeBand={state.gradeBand}
              onActionPress={() => {
                void saveNow();
              }}
              title={t("writingWorkspace.recovery.title")}
              tone="error"
            />
          ) : null}

          {isSavingNow ? (
            <StatusState
              accessibilityLabel={t("writingWorkspace.manualSave.accessibility")}
              description={t("writingWorkspace.manualSave.description")}
              gradeBand={state.gradeBand}
              title={t("writingWorkspace.manualSave.title")}
              tone="info"
            />
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("writingWorkspace.sections.promptSubtitle")}
            title={t("writingWorkspace.sections.prompt")}
          >
            <WorkspacePromptCard assignment={state.viewModel.assignment} gradeBand={state.gradeBand} />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("writingWorkspace.sections.draftSubtitle")}
            title={t("writingWorkspace.sections.draft")}
          >
            <DraftEditor
              autosaveStatus={state.viewModel.autosaveStatus}
              gradeAdaptation={state.viewModel.gradeAdaptation}
              gradeBand={state.gradeBand}
              isEmptyDraft={state.viewModel.isEmptyDraft}
              metrics={state.viewModel.metrics}
              onChangeText={state.setText}
              text={state.viewModel.text}
            />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("writingWorkspace.sections.coachSubtitle")}
            title={t("writingWorkspace.sections.coach")}
          >
            {activePanel === "coach" ? (
              <CoachEntryPanel
                assignment={state.viewModel.assignment}
                canvasAttachment={state.viewModel.draft?.canvasAttachment ?? null}
                draftText={state.viewModel.text}
                gradeAdaptation={state.viewModel.gradeAdaptation}
                gradeLevel={state.gradeLevel}
                isOffline={state.viewModel.isOffline}
                metrics={state.viewModel.metrics}
                onClose={closePanel}
                studentId={state.studentId}
                visible
              />
            ) : (
              <StatusState
                actionLabel={t("writingWorkspace.coach.openCta")}
                accessibilityLabel={t("writingWorkspace.coach.closedAccessibility")}
                description={t("writingWorkspace.coach.closedDescription")}
                gradeBand={state.gradeBand}
                onActionPress={() => openPanel("coach")}
                title={t("writingWorkspace.coach.closedTitle")}
                tone="info"
              />
            )}
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("writingWorkspace.sections.canvasSubtitle")}
            title={t("writingWorkspace.sections.canvas")}
          >
            <CanvasAttachmentPreview
              attachment={state.viewModel.draft?.canvasAttachment ?? null}
              gradeBand={state.gradeBand}
              onOpenCanvas={() => {
                const targetAssignmentId = state.viewModel.assignment?.id ?? assignmentId;
                const attachment = state.viewModel.draft?.canvasAttachment;

                if (attachment) {
                  router.push(getCanvasDocumentRoute(attachment.canvasId, targetAssignmentId));
                  return;
                }

                router.push(getCanvasTemplatePickerRoute(targetAssignmentId));
              }}
            />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("writingWorkspace.sections.rubricSubtitle")}
            title={t("writingWorkspace.sections.rubric")}
          >
            <WorkspaceRubricPanel
              assignment={state.viewModel.assignment}
              gradeAdaptation={state.viewModel.gradeAdaptation}
              gradeBand={state.gradeBand}
            />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("writingWorkspace.sections.submitSubtitle")}
            title={t("writingWorkspace.sections.submit")}
          >
            <WorkspaceSubmitPanel
              canSubmit={state.viewModel.canSubmit}
              gradeBand={state.gradeBand}
              metrics={state.viewModel.metrics}
              onSave={() => {
                void saveNow();
              }}
              onSubmit={() => {
                void submitDraft();
              }}
              submitError={state.viewModel.submitError}
              submitStatus={state.submitStatus}
            />
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
