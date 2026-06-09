import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getCanvasTemplatePickerRoute, getWritingWorkspaceRoute } from "@/core/navigation/deepLinks";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, OfflineBanner, StatusState, SuccessState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import { CanvasToolbar, StrokeCanvasAdapter } from "../components";
import { useCanvasWorkspace } from "../hooks/useCanvas";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function HandwritingCanvasScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ assignmentId?: string | string[]; canvasId?: string | string[] }>();
  const canvasId = useMemo(() => getParamValue(params.canvasId), [params.canvasId]);
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const state = useCanvasWorkspace(canvasId, assignmentId);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [attachStatus, setAttachStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const saveNow = async () => {
    if (state.status !== "success") {
      return;
    }

    setSaveStatus("saving");
    const saved = await state.saveNow();
    setSaveStatus(saved ? "success" : "error");
  };

  const attachNow = async () => {
    if (state.status !== "success" || !state.viewModel.document) {
      return;
    }

    const targetAssignmentId = assignmentId ?? state.viewModel.document.assignmentId;

    if (!targetAssignmentId) {
      setAttachStatus("error");
      return;
    }

    setAttachStatus("loading");
    const attached = await state.attach(targetAssignmentId);
    setAttachStatus(attached ? "success" : "error");
  };

  const title =
    state.status === "success" && state.viewModel.document ? state.viewModel.document.title : t("canvas.handwritingTitle");

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("canvas.workspace.subtitle")}
      testID="handwriting-canvas-screen"
      title={title}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("canvas.workspace.loadingAccessibility")}
          description={t("canvas.workspace.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("canvas.workspace.loadingTitle")}
          testID="canvas-workspace-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("canvas.workspace.errorAccessibility")}
          description={t("canvas.workspace.errorDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="canvas-workspace-error"
          title={t("canvas.workspace.errorTitle")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("canvas.workspace.missingAction")}
          accessibilityLabel={t("canvas.workspace.missingAccessibility")}
          description={t("canvas.workspace.missingDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.replace(getCanvasTemplatePickerRoute(assignmentId))}
          testID="canvas-workspace-missing"
          title={t("canvas.workspace.missingTitle")}
        />
      ) : null}

      {state.status === "success" && state.viewModel.document ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <OfflineBanner
              actionLabel={t("canvas.workspace.offlineAction")}
              accessibilityLabel={t("canvas.workspace.offlineAccessibility")}
              description={t("canvas.workspace.offlineDescription")}
              gradeBand={state.gradeBand}
              isRetrying={state.isRefreshing}
              onRetry={state.refetch}
              title={t("canvas.workspace.offlineTitle")}
            />
          ) : null}

          {state.viewModel.syncStatus === "sync_failed" || saveStatus === "error" || attachStatus === "error" ? (
            <StatusState
              actionLabel={t("canvas.workspace.recoveryAction")}
              actionLoading={saveStatus === "saving" || attachStatus === "loading"}
              accessibilityLabel={t("canvas.workspace.recoveryAccessibility")}
              description={t("canvas.workspace.recoveryDescription")}
              gradeBand={state.gradeBand}
              onActionPress={() => {
                void saveNow();
              }}
              title={t("canvas.workspace.recoveryTitle")}
              tone="error"
            />
          ) : null}

          {saveStatus === "success" ? (
            <SuccessState
              accessibilityLabel={t("canvas.workspace.saveSuccessAccessibility")}
              description={t("canvas.workspace.saveSuccessDescription")}
              gradeBand={state.gradeBand}
              title={t("canvas.workspace.saveSuccessTitle")}
            />
          ) : null}

          {attachStatus === "success" ? (
            <SuccessState
              actionLabel={assignmentId ? t("canvas.workspace.backToWritingCta") : undefined}
              accessibilityLabel={t("canvas.workspace.attachSuccessAccessibility")}
              description={t("canvas.workspace.attachSuccessDescription")}
              gradeBand={state.gradeBand}
              onActionPress={assignmentId ? () => router.push(getWritingWorkspaceRoute(assignmentId)) : undefined}
              title={t("canvas.workspace.attachSuccessTitle")}
            />
          ) : null}

          {state.viewModel.isEmpty ? (
            <StatusState
              accessibilityLabel={t("canvas.workspace.emptyAccessibility")}
              description={t("canvas.workspace.emptyDescription")}
              gradeBand={state.gradeBand}
              title={t("canvas.workspace.emptyTitle")}
              tone="info"
            />
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("canvas.workspace.surfaceSubtitle")}
            title={t("canvas.workspace.surfaceTitle")}
          >
            <StrokeCanvasAdapter
              document={state.viewModel.document}
              gradeAdaptation={state.viewModel.gradeAdaptation}
              gradeBand={state.gradeBand}
              onAddPoint={state.addPoint}
            />
          </PageSection>

          <CanvasToolbar
            canAttach={state.viewModel.canAttach}
            canRedo={state.viewModel.canRedo}
            canUndo={state.viewModel.canUndo}
            gradeBand={state.gradeBand}
            onAttach={() => {
              void attachNow();
            }}
            onRedo={state.redo}
            onSave={() => {
              void saveNow();
            }}
            onUndo={state.undo}
            syncStatus={state.viewModel.syncStatus}
          />

          <StatusState
            accessibilityLabel={t("canvas.workspace.memoryAccessibility")}
            description={t("canvas.workspace.memoryDescription", { count: state.viewModel.strokeCount })}
            gradeBand={state.gradeBand}
            title={t("canvas.workspace.memoryTitle")}
            tone="neutral"
          />
        </Stack>
      ) : null}
    </Screen>
  );
}
