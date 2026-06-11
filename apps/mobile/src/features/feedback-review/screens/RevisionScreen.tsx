import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getStudentReviewCompletionRoute } from "@/core/navigation/deepLinks";
import { colors, layout, radius, spacing, typography } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { Screen, Stack } from "@/shared/components/layout";
import { Modal as AppModal } from "@/shared/components/modals";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { RevisionComparisonCard } from "../components";
import { useFeedbackReview } from "../hooks/useFeedbackReview";
import { getFeedbackRevisionValidation } from "../services/feedbackReviewService";
import { revisionPersistenceService } from "../services/revisionPersistenceService";
import type { FeedbackRevisionError } from "../types";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getRevisionErrorKey(error: FeedbackRevisionError | null): TranslationKey | null {
  switch (error) {
    case "empty_revision":
      return "feedbackReview.revision.errors.empty";
    case "submit_failed":
      return "feedbackReview.revision.errors.submitFailed";
    case "too_long":
      return "feedbackReview.revision.errors.tooLong";
    case "unchanged_revision":
      return "feedbackReview.revision.errors.unchanged";
    case null:
      return null;
  }
}

export function RevisionScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ submissionId?: string | string[] }>();
  const submissionId = useMemo(() => getParamValue(params.submissionId), [params.submissionId]);
  const state = useFeedbackReview(submissionId);
  const [revisedText, setRevisedText] = useState("");
  const [localError, setLocalError] = useState<FeedbackRevisionError | null>(null);
  const [revisionSaveStatus, setRevisionSaveStatus] = useState<
    "idle" | "restoring" | "saving" | "saved" | "failed"
  >("idle");
  const restoredRevisionKeyRef = useRef<string | null>(null);
  const pendingDraftRef = useRef<{ revisedText: string; studentId: string; submissionId: string } | null>(null);
  const revisionStudentId = state.status === "success" ? state.studentId : null;
  const revisionError =
    state.status === "success" ? state.revisionError ?? localError : localError;
  const revisionErrorKey = getRevisionErrorKey(revisionError);
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = state.status === "success" ? typography.gradeBands[state.gradeBand] : typography.gradeBands.middle;

  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isOriginalDraftOpen, setIsOriginalDraftOpen] = useState(false);

  useEffect(() => {
    if (!revisionStudentId || !submissionId) {
      return;
    }

    const revisionKey = `${revisionStudentId}:${submissionId}`;

    if (restoredRevisionKeyRef.current === revisionKey) {
      return;
    }

    let active = true;
    restoredRevisionKeyRef.current = revisionKey;
    setRevisionSaveStatus("restoring");

    revisionPersistenceService
      .getRevisionDraft({
        studentId: revisionStudentId,
        submissionId,
      })
      .then((draft) => {
        if (!active) {
          return;
        }

        if (draft?.revisedText) {
          setRevisedText((current) => (current.trim() ? current : draft.revisedText));
          setRevisionSaveStatus("saved");
          return;
        }

        setRevisionSaveStatus("idle");
      })
      .catch(() => {
        if (active) {
          setRevisionSaveStatus("failed");
        }
      });

    return () => {
      active = false;
    };
  }, [revisionStudentId, submissionId]);

  useEffect(() => {
    if (!revisionStudentId || !submissionId || !revisedText.trim()) {
      return;
    }

    const draft = { revisedText, studentId: revisionStudentId, submissionId };
    pendingDraftRef.current = draft;

    const timeout = setTimeout(() => {
      revisionPersistenceService
        .saveRevisionDraft(draft)
        .then(() => {
          if (pendingDraftRef.current?.revisedText === draft.revisedText) {
            pendingDraftRef.current = null;
            setRevisionSaveStatus("saved");
          }
        })
        .catch(() => {
          setRevisionSaveStatus("failed");
        });
    }, 700);

    return () => {
      clearTimeout(timeout);
    };
  }, [revisedText, revisionStudentId, submissionId]);

  const flushRevisionDraft = useCallback(() => {
    const pending = pendingDraftRef.current;

    if (!pending) {
      return;
    }

    pendingDraftRef.current = null;
    revisionPersistenceService.saveRevisionDraft(pending).catch(() => {
      // The draft stays on screen; the failed badge already warned the student.
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "background" || status === "inactive") {
        flushRevisionDraft();
      }
    });

    return () => {
      subscription.remove();
      flushRevisionDraft();
    };
  }, [flushRevisionDraft]);

  const submitRevision = async () => {
    if (state.status !== "success" || !submissionId) {
      return;
    }

    const validation = getFeedbackRevisionValidation(
      revisedText,
      state.viewModel.review.revisionTask.originalExcerpt,
    );

    setLocalError(validation.error);

    if (!validation.canSubmit) {
      return;
    }

    const completion = await state.submitRevision({
      originalExcerpt: state.viewModel.review.revisionTask.originalExcerpt,
      revisedText,
    });

    if (completion) {
      // Drop any queued autosave so the unmount flush cannot resurrect the
      // draft that the successful submit just removed.
      pendingDraftRef.current = null;
      await revisionPersistenceService.removeRevisionDraft({
        studentId: state.studentId,
        submissionId,
      });
      router.replace(getStudentReviewCompletionRoute(submissionId));
    }
  };

  const stickyFooter = state.status === "success" ? (
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
        accessibilityLabel={t("feedbackReview.revision.compareCta")}
        accessibilityRole="button"
        style={[
          styles.footerButton,
          styles.footerButtonSecondary,
          { borderColor: colors.action.primary.background },
        ]}
        onPress={() => setIsCompareOpen(true)}
      >
        <Text
          style={[
            getAccessibleTextStyle(type.bodyStrong, settings),
            { color: colors.action.primary.background },
          ]}
        >
          {t("feedbackReview.revision.compareCta")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityLabel={t("feedbackReview.revision.submitCta")}
        accessibilityRole="button"
        style={[
          styles.footerButton,
          styles.footerButtonPrimary,
          { backgroundColor: colors.action.primary.background },
          state.revisionStatus === "loading" && styles.footerButtonDisabled,
        ]}
        onPress={() => {
          void submitRevision();
        }}
        disabled={state.revisionStatus === "loading"}
      >
        <Text
          style={[
            getAccessibleTextStyle(type.bodyStrong, settings),
            { color: colors.text.inverse },
          ]}
        >
          {state.revisionStatus === "loading" ? t("common.loading") : t("feedbackReview.revision.submitCta")}
        </Text>
      </TouchableOpacity>
    </View>
  ) : null;

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      testID="feedback-revision-screen"
      footer={stickyFooter}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("feedbackReview.revision.loadingAccessibility")}
          description={t("feedbackReview.revision.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("feedbackReview.revision.loadingTitle")}
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
          {/* Custom Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityLabel={t("common.back")}
              accessibilityRole="button"
              hitSlop={getAccessibleHitSlop(settings)}
              onPress={() => router.back()}
              style={[styles.headerIconContainer, { backgroundColor: accessibleColors.surface }]}
            >
              <Ionicons name="arrow-back" size={24} color={colors.action.primary.background} />
            </TouchableOpacity>

            <View style={styles.autosaveBadgeRow}>
              <Ionicons
                name={
                  revisionSaveStatus === "failed"
                    ? "cloud-offline-outline"
                    : revisionSaveStatus === "saving"
                      ? "cloud-upload-outline"
                      : revisionSaveStatus === "saved"
                        ? "cloud-done-outline"
                        : "cloud-outline"
                }
                size={16}
                color={revisionSaveStatus === "failed" ? colors.feedback.error.text : colors.text.muted}
              />
              <Text
                style={[
                  getAccessibleTextStyle(type.caption, settings),
                  { color: revisionSaveStatus === "failed" ? colors.feedback.error.text : colors.text.muted },
                ]}
              >
                {t(
                  revisionSaveStatus === "failed"
                    ? "feedbackReview.revision.autosave.failed"
                    : revisionSaveStatus === "saving"
                      ? "feedbackReview.revision.autosave.saving"
                      : revisionSaveStatus === "saved"
                        ? "feedbackReview.revision.autosave.saved"
                        : "feedbackReview.revision.autosave.idle",
                )}
              </Text>
            </View>

            <View style={styles.headerIconContainer} />
          </View>

          {/* Heading intro */}
          <View style={styles.introContainer}>
            <Text
              accessibilityRole="header"
              style={[
                getAccessibleTextStyle(type.heading, settings),
                styles.introTitle,
                { color: accessibleColors.text },
              ]}
            >
              {t("feedbackReview.revision.headerTitle")}
            </Text>
            <Text
              style={[
                getAccessibleTextStyle(type.body, settings),
                styles.introSubtitle,
                { color: accessibleColors.mutedText },
              ]}
            >
              {t("feedbackReview.revision.headerSubtitle")}
            </Text>
          </View>

          {/* Original Draft Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  getAccessibleTextStyle(type.bodyStrong, settings),
                  { color: accessibleColors.text },
                ]}
              >
                {t("feedbackReview.revision.originalDraftLabel")}
              </Text>
              <TouchableOpacity
                accessibilityLabel={t("feedbackReview.revision.viewFullScreenLabel")}
                accessibilityRole="button"
                onPress={() => setIsOriginalDraftOpen(true)}
                style={styles.sectionHeaderLink}
              >
                <Text
                  style={[
                    getAccessibleTextStyle(type.bodySmall, settings),
                    { color: colors.action.primary.background },
                  ]}
                >
                  {t("feedbackReview.revision.viewFullScreenLabel")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.draftCard, { backgroundColor: accessibleColors.surface, borderColor: accessibleColors.border }]}>
              <Text
                selectable
                style={[
                  getAccessibleTextStyle(type.body, settings),
                  { color: accessibleColors.text },
                ]}
              >
                {state.viewModel.review.revisionTask.originalExcerpt}
              </Text>
            </View>
          </View>

          {/* Revision Task Card */}
          <View style={[styles.taskCard, { backgroundColor: colors.feedback.warning.background, borderColor: colors.feedback.warning.border }]}>
            <View style={styles.taskCardHeader}>
              <View style={styles.starIconContainer}>
                <Ionicons name="star" size={16} color={colors.feedback.warning.text} />
              </View>
              <Text
                style={[
                  getAccessibleTextStyle(type.caption, settings),
                  { color: colors.feedback.warning.text, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
                ]}
              >
                {t("feedbackReview.revisionTitle")}
              </Text>
            </View>

            <Text
              style={[
                getAccessibleTextStyle(type.bodyStrong, settings),
                { color: accessibleColors.text, marginTop: spacing.xs },
              ]}
            >
              {state.viewModel.review.revisionTask.instruction}
            </Text>

            {state.viewModel.review.revisionTask.guidingQuestion ? (
              <View style={[styles.questionBox, { backgroundColor: accessibleColors.surface, borderColor: accessibleColors.border }]}>
                <Text
                  style={[
                    getAccessibleTextStyle(type.caption, settings),
                    { color: colors.coach.accentStrong, fontWeight: "600", textTransform: "uppercase" },
                  ]}
                >
                  {t("feedbackReview.revision.questionTitle")}
                </Text>
                <Text
                  style={[
                    getAccessibleTextStyle(type.bodySmall, settings),
                    { color: accessibleColors.text, marginTop: spacing.xs },
                  ]}
                >
                  {state.viewModel.review.revisionTask.guidingQuestion}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Your Revision Workspace */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  getAccessibleTextStyle(type.bodyStrong, settings),
                  { color: accessibleColors.text },
                ]}
              >
                {t("feedbackReview.revision.editorTitle")}
              </Text>
            </View>

            <TextInput
              accessibilityHint={t("feedbackReview.revision.inputHint")}
              accessibilityLabel={t("feedbackReview.revision.inputAccessibility")}
              multiline
              onChangeText={(value) => {
                setRevisedText(value);
                setLocalError(null);

                if (value.trim()) {
                  setRevisionSaveStatus("saving");
                }
              }}
              placeholder={t("feedbackReview.revision.inputPlaceholder")}
              placeholderTextColor={accessibleColors.mutedText}
              scrollEnabled
              style={[
                getAccessibleTextStyle(type.body, settings),
                styles.editorInput,
                {
                  backgroundColor: accessibleColors.surface,
                  borderColor: accessibleColors.border,
                  color: accessibleColors.text,
                  minHeight: Math.max(180, state.viewModel.gradeAdaptation.revisionInputMinHeight),
                },
              ]}
              textAlignVertical="top"
              value={revisedText}
            />

            {state.revisionStatus === "error" && revisionErrorKey ? (
              <StatusState
                accessibilityLabel={t("feedbackReview.revision.errorAccessibility")}
                description={t(revisionErrorKey)}
                gradeBand={state.gradeBand}
                title={t("feedbackReview.revision.errorTitle")}
                tone="error"
              />
            ) : null}

            {revisionSaveStatus === "failed" ? (
              <StatusState
                accessibilityLabel={t("feedbackReview.revision.recoveryAccessibility")}
                description={t("feedbackReview.revision.recoveryDescription")}
                gradeBand={state.gradeBand}
                title={t("feedbackReview.revision.recoveryTitle")}
                tone="error"
              />
            ) : null}
          </View>

          <AppModal
            gradeBand={state.gradeBand}
            mode="bottomSheet"
            onClose={() => setIsOriginalDraftOpen(false)}
            testID="revision-original-draft-modal"
            titleKey="feedbackReview.revision.originalDraftLabel"
            visible={isOriginalDraftOpen}
          >
            <Text
              selectable
              style={[
                getAccessibleTextStyle(type.body, settings),
                { color: accessibleColors.text },
              ]}
            >
              {state.viewModel.review.revisionTask.originalExcerpt}
            </Text>
          </AppModal>

          <AppModal
            gradeBand={state.gradeBand}
            mode="bottomSheet"
            onClose={() => setIsCompareOpen(false)}
            testID="revision-comparison-modal"
            titleKey="feedbackReview.revision.compareSectionTitle"
            visible={isCompareOpen}
          >
            <RevisionComparisonCard
              gradeBand={state.gradeBand}
              originalExcerpt={state.viewModel.review.revisionTask.originalExcerpt}
              revisedText={revisedText}
            />
          </AppModal>
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
    width: "100%",
  },
  headerIconContainer: {
    alignItems: "center",
    borderRadius: radius.full,
    justifyContent: "center",
    minHeight: layout.touchTarget,
    minWidth: layout.touchTarget,
  },
  autosaveBadgeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  introContainer: {
    alignItems: "center",
    marginTop: spacing.xs,
    width: "100%",
  },
  introTitle: {
    fontWeight: "bold",
    textAlign: "center",
  },
  introSubtitle: {
    marginTop: spacing.xs,
    textAlign: "center",
  },
  sectionContainer: {
    width: "100%",
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionHeaderLink: {
    justifyContent: "center",
    minHeight: layout.touchTarget,
  },
  draftCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  taskCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  taskCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  starIconContainer: {
    alignItems: "center",
    backgroundColor: colors.background.surface,
    borderRadius: radius.full,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  questionBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  editorInput: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlignVertical: "top",
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
