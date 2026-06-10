import { useMemo, useState } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getCanvasDocumentRoute, getCanvasTemplatePickerRoute, getStudentReviewRoute } from "@/core/navigation/deepLinks";
import { colors, radius, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, OfflineBanner, StatusState } from "@/shared/components/feedback";
import { Screen, Stack } from "@/shared/components/layout";
import { useGlacierThemeStore } from "@/shared/theme/glacierThemeStore";
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
  const { primaryColor, tertiaryColor, fontSizeScale } = useGlacierThemeStore();

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
    <View
      style={[
        styles.footer,
        {
          backgroundColor: accessibleColors.surface,
          borderTopColor: accessibleColors.border,
        },
      ]}
    >
      <TouchableOpacity
        accessibilityLabel={t("writingWorkspace.saveDraft")}
        style={[
          styles.footerButton,
          styles.footerButtonSecondary,
          { borderColor: primaryColor },
        ]}
        onPress={() => {
          void saveNow();
        }}
        disabled={isSavingNow}
      >
        <Text
          style={[
            getAccessibleTextStyle(type.bodyStrong, settings),
            { color: primaryColor, fontSize: type.bodyStrong.fontSize * fontSizeScale },
          ]}
        >
          {isSavingNow ? t("common.loading") : t("writingWorkspace.saveDraft")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityLabel={t("writingWorkspace.submit.confirmCta")}
        style={[
          styles.footerButton,
          styles.footerButtonPrimary,
          { backgroundColor: primaryColor },
          (!successState.viewModel.canSubmit || successState.submitStatus === "loading") && styles.footerButtonDisabled,
        ]}
        onPress={() => {
          void submitDraft();
        }}
        disabled={!successState.viewModel.canSubmit || successState.submitStatus === "loading"}
      >
        <Text
          style={[
            getAccessibleTextStyle(type.bodyStrong, settings),
            { color: colors.text.inverse, fontSize: type.bodyStrong.fontSize * fontSizeScale },
          ]}
        >
          {successState.submitStatus === "loading" ? t("common.loading") : t("writingWorkspace.submit.confirmCta")}
        </Text>
      </TouchableOpacity>
    </View>
  ) : null;

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
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
          onActionPress={() => router.replace("/(student)/assignments/history")}
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
              onPress={() => router.back()}
              style={[styles.headerIconContainer, { backgroundColor: accessibleColors.surface }]}
            >
              <Ionicons name="arrow-back" size={24} color={primaryColor} />
            </TouchableOpacity>

            <Text
              accessibilityRole="header"
              style={[
                getAccessibleTextStyle(type.heading, settings),
                styles.headerTitle,
                { color: accessibleColors.text, fontSize: type.heading.fontSize * fontSizeScale },
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
                { color: tertiaryColor },
              ]}
            >
              {t("writingWorkspace.prompt.title").toUpperCase()}
            </Text>
            <Text
              style={[
                getAccessibleTextStyle(type.bodyStrong, settings),
                styles.promptText,
                { color: accessibleColors.text, fontSize: type.bodyStrong.fontSize * fontSizeScale },
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
                  fontSize: type.body.fontSize * fontSizeScale,
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
                style={[styles.coachButton, { backgroundColor: accessibleColors.surface, borderColor: accessibleColors.border }]}
                onPress={() => openPanel("coach")}
              >
                <Ionicons name="sparkles-outline" size={18} color={primaryColor} />
                <Text
                  style={[
                    getAccessibleTextStyle(type.bodyStrong, settings),
                    { color: primaryColor, fontSize: type.bodyStrong.fontSize * fontSizeScale },
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
                  { color: accessibleColors.text, fontSize: type.bodyStrong.fontSize * fontSizeScale },
                ]}
              >
                {t("writingWorkspace.rubric.title")}
              </Text>
              <Text
                style={[
                  getAccessibleTextStyle(type.bodySmall, settings),
                  { color: accessibleColors.mutedText, fontSize: type.bodySmall.fontSize * fontSizeScale },
                ]}
              >
                {completedRubricCount} / {rubricTotal}
              </Text>
            </View>

            <View style={styles.progressBar}>
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
    height: 40,
    justifyContent: "center",
    width: 40,
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
  },
  promptText: {
    fontWeight: "500",
    lineHeight: 22,
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
    alignItems: "center",
    borderRadius: radius.full,
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  footerButtonSecondary: {
    borderWidth: 1,
  },
  footerButtonPrimary: {
    borderWidth: 0,
  },
  footerButtonDisabled: {
    opacity: 0.5,
  },
});

