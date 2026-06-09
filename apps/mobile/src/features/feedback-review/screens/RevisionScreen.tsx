import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getStudentReviewCompletionRoute } from "@/core/navigation/deepLinks";
import { colors, radius, spacing, typography } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { Screen, Stack } from "@/shared/components/layout";
import { useGlacierThemeStore } from "@/shared/theme/glacierThemeStore";
import { getAccessibleColors, getAccessibleTextStyle, useAccessibilityContext } from "@/shared/utils/accessibility";

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
  const [revisionSaveStatus, setRevisionSaveStatus] = useState<"idle" | "restoring" | "saved" | "failed">("idle");
  const restoredRevisionKeyRef = useRef<string | null>(null);
  const revisionStudentId = state.status === "success" ? state.studentId : null;
  const revisionError =
    state.status === "success" ? state.revisionError ?? localError : localError;
  const revisionErrorKey = getRevisionErrorKey(revisionError);
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const { fontSizeScale, primaryColor, tertiaryColor, glassOpacity } = useGlacierThemeStore();
  const type = state.status === "success" ? typography.gradeBands[state.gradeBand] : typography.gradeBands.middle;

  const [isCompareOpen, setIsCompareOpen] = useState(false);

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

    const timeout = setTimeout(() => {
      revisionPersistenceService
        .saveRevisionDraft({
          revisedText,
          studentId: revisionStudentId,
          submissionId,
        })
        .then(() => {
          setRevisionSaveStatus("saved");
        })
        .catch(() => {
          setRevisionSaveStatus("failed");
        });
    }, 700);

    return () => {
      clearTimeout(timeout);
    };
  }, [revisedText, revisionStudentId, submissionId]);

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
        style={[
          styles.footerButton,
          styles.footerButtonSecondary,
          { borderColor: primaryColor },
        ]}
        onPress={() => setIsCompareOpen(true)}
      >
        <Text
          style={[
            getAccessibleTextStyle(type.bodyStrong, settings),
            { color: primaryColor, fontSize: type.bodyStrong.fontSize * fontSizeScale },
          ]}
        >
          {t("feedbackReview.revision.compareCta")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityLabel={t("feedbackReview.revision.submitCta")}
        style={[
          styles.footerButton,
          styles.footerButtonPrimary,
          { backgroundColor: primaryColor },
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
            { color: colors.text.inverse, fontSize: type.bodyStrong.fontSize * fontSizeScale },
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
              onPress={() => router.back()}
              style={[styles.headerIconContainer, { backgroundColor: accessibleColors.surface }]}
            >
              <Ionicons name="arrow-back" size={24} color={primaryColor} />
            </TouchableOpacity>

            <View style={styles.autosaveBadgeRow}>
              <Ionicons name="cloud-done-outline" size={16} color={colors.text.muted} />
              <Text style={[getAccessibleTextStyle(type.caption, settings), { color: colors.text.muted }]}>
                {t("common.saved")}
              </Text>
            </View>

            <TouchableOpacity
              accessibilityLabel={t("common.settings")}
              style={[styles.headerIconContainer, { backgroundColor: accessibleColors.surface }]}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={primaryColor} />
            </TouchableOpacity>
          </View>

          {/* Heading intro */}
          <View style={styles.introContainer}>
            <Text
              accessibilityRole="header"
              style={[
                getAccessibleTextStyle(type.heading, settings),
                styles.introTitle,
                { color: accessibleColors.text, fontSize: type.heading.fontSize * fontSizeScale },
              ]}
            >
              {t("feedbackReview.revision.headerTitle")}
            </Text>
            <Text
              style={[
                getAccessibleTextStyle(type.body, settings),
                styles.introSubtitle,
                { color: accessibleColors.mutedText, fontSize: type.body.fontSize * fontSizeScale },
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
                  { color: accessibleColors.text, fontSize: type.bodyStrong.fontSize * fontSizeScale },
                ]}
              >
                {t("feedbackReview.revision.originalDraftLabel")}
              </Text>
              <TouchableOpacity>
                <Text
                  style={[
                    getAccessibleTextStyle(type.bodySmall, settings),
                    { color: primaryColor, fontSize: type.bodySmall.fontSize * fontSizeScale },
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
                  { color: accessibleColors.text, fontSize: type.body.fontSize * fontSizeScale, lineHeight: 22 },
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
                  { color: colors.feedback.warning.text, fontWeight: "600", letterSpacing: 1 },
                ]}
              >
                {t("feedbackReview.revisionTitle").toUpperCase()}
              </Text>
            </View>

            <Text
              style={[
                getAccessibleTextStyle(type.bodyStrong, settings),
                { color: accessibleColors.text, fontSize: type.bodyStrong.fontSize * fontSizeScale, marginTop: spacing.xs },
              ]}
            >
              {state.viewModel.review.revisionTask.instruction}
            </Text>

            {state.viewModel.review.revisionTask.guidingQuestion ? (
              <View style={[styles.questionBox, { backgroundColor: accessibleColors.surface, borderColor: accessibleColors.border }]}>
                <Text
                  style={[
                    getAccessibleTextStyle(type.caption, settings),
                    { color: tertiaryColor, fontWeight: "600" },
                  ]}
                >
                  {t("feedbackReview.revision.questionTitle").toUpperCase()}
                </Text>
                <Text
                  style={[
                    getAccessibleTextStyle(type.bodySmall, settings),
                    { color: accessibleColors.text, fontSize: type.bodySmall.fontSize * fontSizeScale, marginTop: spacing.xs },
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
                  { color: accessibleColors.text, fontSize: type.bodyStrong.fontSize * fontSizeScale },
                ]}
              >
                {t("feedbackReview.revision.editorTitle")}
              </Text>
              <TouchableOpacity accessibilityLabel={t("feedbackReview.revision.fullscreenEditor")}>
                <Ionicons name="scan-outline" size={20} color={colors.text.muted} />
              </TouchableOpacity>
            </View>

            <TextInput
              accessibilityHint={t("feedbackReview.revision.inputHint")}
              accessibilityLabel={t("feedbackReview.revision.inputAccessibility")}
              multiline
              onChangeText={(value) => {
                setRevisedText(value);
                setLocalError(null);
              }}
              placeholder={t("feedbackReview.revision.inputPlaceholder")}
              placeholderTextColor={colors.text.muted}
              scrollEnabled
              style={[
                getAccessibleTextStyle(type.body, settings),
                styles.editorInput,
                {
                  backgroundColor: accessibleColors.surface,
                  borderColor: accessibleColors.border,
                  color: accessibleColors.text,
                  minHeight: Math.max(180, state.viewModel.gradeAdaptation.revisionInputMinHeight),
                  fontSize: type.body.fontSize * fontSizeScale,
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
                description={t(revisionErrorKey || "feedbackReview.revision.recoveryDescription")}
                gradeBand={state.gradeBand}
                title={t("feedbackReview.revision.recoveryTitle")}
                tone="error"
              />
            ) : null}
          </View>

          {/* Comparison Modal Overlay */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isCompareOpen}
            onRequestClose={() => setIsCompareOpen(false)}
          >
            <View style={[styles.modalOverlay, { backgroundColor: `rgba(11, 28, 48, ${glassOpacity})` }]}>
              <View style={[styles.modalContent, { backgroundColor: accessibleColors.surface, borderColor: accessibleColors.border }]}>
                <View style={styles.modalHeader}>
                  <Text style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.text }]}>
                    {t("feedbackReview.revision.compareSectionTitle")}
                  </Text>
                  <TouchableOpacity onPress={() => setIsCompareOpen(false)}>
                    <Ionicons name="close" size={24} color={primaryColor} />
                  </TouchableOpacity>
                </View>
                <RevisionComparisonCard
                  gradeBand={state.gradeBand}
                  originalExcerpt={state.viewModel.review.revisionTask.originalExcerpt}
                  revisedText={revisedText}
                />
              </View>
            </View>
          </Modal>
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
    height: 40,
    justifyContent: "center",
    width: 40,
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
    backgroundColor: "#ffffff",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
});
