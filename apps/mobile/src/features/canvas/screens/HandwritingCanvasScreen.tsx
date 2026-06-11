import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { routes } from "@/core/navigation/routeNames";
import { getCanvasTemplatePickerRoute, getWritingWorkspaceRoute } from "@/core/navigation/deepLinks";
import { colors, radius, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, OfflineBanner, StatusState, SuccessState } from "@/shared/components/feedback";
import { Screen } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { CanvasSyncStatusBadge, CanvasToolbar, StrokeCanvasAdapter } from "../components";
import { useCanvasWorkspace } from "../hooks/useCanvas";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function HandwritingCanvasScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { settings } = useAccessibilityContext();
  const params = useLocalSearchParams<{ assignmentId?: string | string[]; canvasId?: string | string[] }>();
  const canvasId = useMemo(() => getParamValue(params.canvasId), [params.canvasId]);
  const assignmentId = useMemo(() => getParamValue(params.assignmentId), [params.assignmentId]);
  const state = useCanvasWorkspace(canvasId, assignmentId);
  const accessibleColors = getAccessibleColors(settings);
  const hitSlop = getAccessibleHitSlop(settings);
  const type = typography.gradeBands[state.gradeBand];
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [attachStatus, setAttachStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (saveStatus !== "success") {
      return;
    }

    // Auto-clear the success banner so it does not permanently shrink the canvas.
    const timeout = setTimeout(() => {
      setSaveStatus("idle");
    }, 2500);

    return () => {
      clearTimeout(timeout);
    };
  }, [saveStatus]);

  useEffect(() => {
    if (attachStatus !== "success") {
      return;
    }

    // Auto-clear the attach success banner so it does not permanently shrink the canvas.
    const timeout = setTimeout(() => {
      setAttachStatus("idle");
    }, 2500);

    return () => {
      clearTimeout(timeout);
    };
  }, [attachStatus]);

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

  if (state.status === "success" && state.viewModel.document) {
    return (
      <View
        testID="handwriting-canvas-screen"
        style={[styles.workspaceShell, { backgroundColor: colors.gradeBand[state.gradeBand].background }]}
      >
        <View
          style={[
            styles.workspaceHeader,
            {
              borderBottomColor: accessibleColors.border,
              paddingTop: Math.max(insets.top, spacing.md),
            },
          ]}
        >
          <Pressable
            accessibilityLabel={t("common.back")}
            accessibilityRole="button"
            hitSlop={hitSlop}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
          >
            <Ionicons color={colors.action.secondary.foreground} name="arrow-back" size={22} />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              selectable
              style={[getAccessibleTextStyle(type.title, settings), styles.headerTitle, { color: accessibleColors.text }]}
            >
              {title}
            </Text>
            <CanvasSyncStatusBadge gradeBand={state.gradeBand} status={state.viewModel.syncStatus} />
          </View>

          <Pressable
            accessibilityLabel={t("common.settings")}
            accessibilityRole="button"
            hitSlop={hitSlop}
            onPress={() => router.push(routes.studentSettings)}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
          >
            <Ionicons color={colors.action.secondary.foreground} name="settings-outline" size={22} />
          </Pressable>
        </View>

        <CanvasToolbar
          canRedo={state.viewModel.canRedo}
          canUndo={state.viewModel.canUndo}
          gradeBand={state.gradeBand}
          onRedo={state.redo}
          onUndo={state.undo}
        />

        <View style={styles.statusStack}>
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
                if (attachStatus === "error") {
                  void attachNow();
                  return;
                }

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
        </View>

        <View style={styles.canvasStage}>
          <StrokeCanvasAdapter
            document={state.viewModel.document}
            gradeAdaptation={state.viewModel.gradeAdaptation}
            gradeBand={state.gradeBand}
            onBeginStroke={state.beginStroke}
            onEndStroke={state.endStroke}
            onExtendStroke={state.extendStroke}
            style={styles.canvasSurface}
          />
        </View>

        <View
          style={[
            styles.actionBar,
            {
              borderTopColor: accessibleColors.border,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <Button
            accessibilityLabel={t("canvas.toolbar.saveDraft")}
            gradeBand={state.gradeBand}
            label={t("canvas.toolbar.saveDraft")}
            loading={saveStatus === "saving" || state.viewModel.syncStatus === "saving"}
            onPress={() => {
              void saveNow();
            }}
            size="sm"
            style={styles.secondaryAction}
            testID="canvas-workspace-save"
            variant="secondary"
          />
          <Button
            accessibilityHint={state.viewModel.canAttach ? t("canvas.toolbar.attachHint") : t("canvas.toolbar.attachDisabledHint")}
            accessibilityLabel={t("canvas.attachToAssignment")}
            disabled={!state.viewModel.canAttach}
            gradeBand={state.gradeBand}
            label={t("canvas.attachToAssignment")}
            loading={attachStatus === "loading"}
            onPress={() => {
              void attachNow();
            }}
            rightAccessory={<Ionicons color={colors.action.primary.foreground} name="send" size={18} />}
            size="sm"
            style={styles.primaryAction}
            testID="canvas-workspace-attach"
          />
        </View>
      </View>
    );
  }

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    alignItems: "center",
    backgroundColor: colors.background.surface,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  canvasStage: {
    flex: 1,
    padding: spacing.lg,
  },
  canvasSurface: {
    flex: 1,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  headerTitle: {
    fontWeight: "800",
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.background.subtle,
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  pressed: {
    opacity: 0.72,
  },
  primaryAction: {
    flex: 1.35,
  },
  secondaryAction: {
    flex: 1,
  },
  statusStack: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  workspaceHeader: {
    alignItems: "center",
    backgroundColor: colors.background.surface,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  workspaceShell: {
    flex: 1,
  },
});
