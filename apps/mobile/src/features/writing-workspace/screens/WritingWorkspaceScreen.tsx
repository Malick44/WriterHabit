import { useMemo, useState } from "react";
import {
  I18nManager,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getCanvasDocumentRoute, getCanvasTemplatePickerRoute, getStudentReviewRoute } from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors, layout, radius, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, OfflineBanner, StatusState } from "@/shared/components/feedback";
import { Screen, Stack } from "@/shared/components/layout";
import { getAccessibleTextStyle, getAccessibleColors, useAccessibilityContext } from "@/shared/utils/accessibility";

import { CanvasAttachmentPreview } from "../components/CanvasAttachmentPreview";
import { CoachEntryPanel } from "../components/CoachEntryPanel";
import { AutosaveStatusBadge } from "../components/AutosaveStatusBadge";
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
  const successState = state.status === "success" ? state : null;
  const activePanel = useWritingWorkspaceUiStore((store) => store.activePanel);
  const openPanel = useWritingWorkspaceUiStore((store) => store.openPanel);
  const closePanel = useWritingWorkspaceUiStore((store) => store.closePanel);
  const [isSavingNow, setIsSavingNow] = useState(false);
  const { settings } = useAccessibilityContext();
  const primaryColor = colors.action.primary.background;
  const accentColor = colors.gradeBand[state.gradeBand].accent;

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

  const type = state.status === "success" ? typography.gradeBands[state.gradeBand] : typography.gradeBands.middle;
  const accessibleColors = getAccessibleColors(settings);

  // Rubric completions computation
  const assignment = successState?.viewModel.assignment ?? null;
  const rubricTotal = assignment?.rubric?.length ?? 0;
  const rubricMetrics = successState?.viewModel.metrics ?? null;
  const completedRubricCount = useMemo(() => {
    if (!rubricMetrics) return 0;
    let completed = 0;
    if (rubricTotal > 0 && rubricMetrics.wordCount >= 10) completed++;
    if (rubricTotal > 1 && rubricMetrics.sentenceCount >= 2) completed++;
    if (rubricTotal > 2 && rubricMetrics.paragraphCount >= 1) completed++;
    if (rubricTotal > 3 && rubricMetrics.wordCount >= 40) completed++;
    return Math.min(completed, rubricTotal);
  }, [rubricMetrics, rubricTotal]);

  const stickyFooter = successState && successState.viewModel.assignment ? (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View
        style={[
          styles.footer,
          {
            backgroundColor: accessibleColors.surface,
            borderTopColor: accessibleColors.border,
          },
        ]}
      >
        <Button
          accessibilityLabel={t("writingWorkspace.saveDraft")}
          disabled={isSavingNow}
          gradeBand={state.gradeBand}
          label={t("writingWorkspace.saveDraft")}
          loading={isSavingNow}
          onPress={() => {
            void saveNow();
          }}
          style={styles.footerButton}
          variant="secondary"
        />

        <Button
          accessibilityLabel={t("writingWorkspace.submit.confirmCta")}
          disabled={!successState.viewModel.canSubmit}
          gradeBand={state.gradeBand}
          label={t("writingWorkspace.submit.confirmCta")}
          loading={successState.submitStatus === "loading"}
          onPress={() => {
            void submitDraft();
          }}
          style={styles.footerButton}
          variant="primary"
        />
      </View>
    </KeyboardAvoidingView>
  ) : null;

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      keyboardAvoiding
      testID="writing-workspace-screen"
      footer={stickyFooter}
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
          onActionPress={() => router.replace(routes.studentAssignmentsHistory)}
          testID="writing-workspace-missing"
          title={t("writingWorkspace.missing.title")}
        />
      ) : null}

      {successState && successState.viewModel.assignment ? (
        <Stack gap="lg">
          {/* Custom Task Header */}
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityLabel={t("common.back")}
              accessibilityRole="button"
              onPress={() => router.back()}
              style={[styles.headerIconContainer, { backgroundColor: accessibleColors.surface }]}
            >
              <Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={24} color={primaryColor} />
            </TouchableOpacity>

            <Text
              accessibilityRole="header"
              style={[
                getAccessibleTextStyle(type.heading, settings),
                styles.headerTitle,
                { color: accessibleColors.text },
              ]}
            >
              {t("writingWorkspace.headerTitle")}
            </Text>

            <AutosaveStatusBadge gradeBand={state.gradeBand} status={successState.viewModel.autosaveStatus} />
          </View>

          {successState.viewModel.isOffline ? (
            <OfflineBanner
              actionLabel={t("writingWorkspace.offline.action")}
              accessibilityLabel={t("writingWorkspace.offline.accessibility")}
              description={t("writingWorkspace.offline.description")}
              gradeBand={state.gradeBand}
              isRetrying={successState.isRefreshing}
              onRetry={state.refetch}
              title={t("writingWorkspace.offline.title")}
            />
          ) : null}

          {successState.viewModel.autosaveStatus === "failed" ? (
            <StatusState
              actionLabel={t("writingWorkspace.recovery.action")}
              actionLoading={isSavingNow}
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

          {/* Prompt Card */}
          <View
            style={[
              styles.promptCard,
              {
                backgroundColor: accessibleColors.surface,
                borderColor: accessibleColors.border,
              },
            ]}
          >
            <Text
              style={[
                getAccessibleTextStyle(type.caption, settings),
                styles.promptLabel,
                { color: accentColor },
              ]}
            >
              {t("writingWorkspace.prompt.title")}
            </Text>
            <Text
              style={[
                getAccessibleTextStyle(type.bodyStrong, settings),
                styles.promptText,
                { color: accessibleColors.text },
              ]}
            >
              {successState.viewModel.assignment.prompt}
            </Text>
          </View>

          {/* Writing Textarea Area */}
          <View style={styles.editorContainer}>
            <TextInput
              accessibilityHint={t("writingWorkspace.editor.inputHint")}
              accessibilityLabel={t("writingWorkspace.editor.inputAccessibility")}
              multiline
              onChangeText={successState.setText}
              placeholder={t("writingWorkspace.editor.placeholder")}
              placeholderTextColor={colors.text.muted}
              scrollEnabled
              style={[
                getAccessibleTextStyle(type.body, settings),
                styles.textInput,
                {
                  backgroundColor: accessibleColors.surface,
                  borderColor: accessibleColors.border,
                  color: accessibleColors.text,
                  minHeight: Math.max(300, successState.viewModel.gradeAdaptation.editorMinHeight),
                },
              ]}
              testID="writing-workspace-draft-input"
              value={successState.viewModel.text}
            />

            {/* Editor Actions & Word Count */}
            <View style={[styles.editorActions, { borderTopColor: accessibleColors.border }]}>
              <Text
                selectable
                style={[
                  getAccessibleTextStyle(type.caption, settings),
                  { color: accessibleColors.mutedText },
                ]}
              >
                {t("writingWorkspace.metrics.words", { count: successState.viewModel.metrics.wordCount })}
              </Text>

              <TouchableOpacity
                accessibilityLabel={t("writingWorkspace.aiCoachButton")}
                accessibilityRole="button"
                style={[styles.coachButton, { backgroundColor: accessibleColors.surface, borderColor: accessibleColors.border }]}
                onPress={() => openPanel("coach")}
              >
                <Ionicons name="sparkles-outline" size={18} color={primaryColor} />
                <Text
                  style={[
                    getAccessibleTextStyle(type.bodyStrong, settings),
                    { color: primaryColor },
                  ]}
                >
                  {t("writingWorkspace.aiCoachButton")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rubric Checklist Overview */}
          <View
            style={[
              styles.rubricCard,
              {
                backgroundColor: accessibleColors.surface,
                borderColor: accessibleColors.border,
              },
            ]}
          >
            <View style={styles.rubricHeader}>
              <Text
                style={[
                  getAccessibleTextStyle(type.bodyStrong, settings),
                  { color: accessibleColors.text },
                ]}
              >
                {t("writingWorkspace.rubric.title")}
              </Text>
              <Text
                style={[
                  getAccessibleTextStyle(type.bodySmall, settings),
                  { color: accessibleColors.mutedText },
                ]}
              >
                {t("writingWorkspace.rubric.progress", { completed: completedRubricCount, total: rubricTotal })}
              </Text>
            </View>

            <View
              accessibilityLabel={t("writingWorkspace.rubric.progress", { completed: completedRubricCount, total: rubricTotal })}
              accessibilityRole="progressbar"
              accessibilityValue={{ max: rubricTotal, min: 0, now: completedRubricCount }}
              style={styles.progressBar}
            >
              {Array.from({ length: rubricTotal }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.progressBarSegment,
                    {
                      backgroundColor: idx < completedRubricCount ? colors.feedback.success.background : accessibleColors.border,
                      borderColor: idx < completedRubricCount ? colors.feedback.success.border : accessibleColors.border,
                    },
                    idx === 0 && styles.progressBarSegmentFirst,
                    idx === rubricTotal - 1 && styles.progressBarSegmentLast,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Canvas Attachment Preview */}
          <CanvasAttachmentPreview
            attachment={successState.viewModel.draft?.canvasAttachment ?? null}
            gradeBand={state.gradeBand}
            onOpenCanvas={() => {
              const targetAssignmentId = successState.viewModel.assignment?.id ?? assignmentId;
              const attachment = successState.viewModel.draft?.canvasAttachment;

              if (attachment) {
                router.push(getCanvasDocumentRoute(attachment.canvasId, targetAssignmentId));
                return;
              }

              router.push(getCanvasTemplatePickerRoute(targetAssignmentId));
            }}
          />

          {/* AI Coach Overlay/Drawer */}
          {activePanel === "coach" ? (
            <CoachEntryPanel
              assignment={successState.viewModel.assignment}
              canvasAttachment={successState.viewModel.draft?.canvasAttachment ?? null}
              draftText={successState.viewModel.text}
              gradeAdaptation={successState.viewModel.gradeAdaptation}
              gradeLevel={successState.gradeLevel}
              isOffline={successState.viewModel.isOffline}
              metrics={successState.viewModel.metrics}
              onClose={closePanel}
              studentId={successState.studentId}
              visible
            />
          ) : null}
        </Stack>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    width: "100%",
  },
  headerIconContainer: {
    alignItems: "center",
    borderRadius: radius.full,
    justifyContent: "center",
    minHeight: layout.touchTarget,
    minWidth: layout.touchTarget,
  },
  headerTitle: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
  },
  promptCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  promptLabel: {
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  promptText: {
    fontWeight: "500",
  },
  editorContainer: {
    flexDirection: "column",
    width: "100%",
  },
  textInput: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlignVertical: "top",
  },
  editorActions: {
    alignItems: "center",
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  coachButton: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: layout.touchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  rubricCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  rubricHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressBar: {
    flexDirection: "row",
    gap: 4,
    height: 8,
    width: "100%",
  },
  progressBarSegment: {
    flex: 1,
    height: "100%",
  },
  progressBarSegmentFirst: {
    borderBottomLeftRadius: radius.full,
    borderTopLeftRadius: radius.full,
  },
  progressBarSegmentLast: {
    borderBottomRightRadius: radius.full,
    borderTopRightRadius: radius.full,
  },
  footer: {
    alignItems: "center",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    width: "100%",
  },
  footerButton: {
    borderRadius: radius.full,
    flex: 1,
  },
});

