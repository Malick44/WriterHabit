import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getStudentReviewCompletionRoute } from "@/core/navigation/deepLinks";
import { colors } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { TextField } from "@/shared/components/forms";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

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

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("feedbackReview.revision.subtitle")}
      testID="feedback-revision-screen"
      title={t("feedbackReview.revisionTitle")}
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
          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("feedbackReview.revision.taskSubtitle")}
            title={t("feedbackReview.revision.taskTitle")}
          >
            <Card
              accessibilityLabel={t("feedbackReview.revision.taskAccessibility")}
              gradeBand={state.gradeBand}
              title={state.viewModel.review.revisionTask.focusLabel}
              variant="accent"
            >
              <Stack gap="md">
                <StatusState
                  accessibilityLabel={t("feedbackReview.revision.coachingAccessibility")}
                  description={state.viewModel.review.revisionTask.instruction}
                  gradeBand={state.gradeBand}
                  title={t("feedbackReview.nextStepLabel")}
                  tone="info"
                />
                <StatusState
                  accessibilityLabel={t("feedbackReview.revision.questionAccessibility")}
                  description={state.viewModel.review.revisionTask.guidingQuestion}
                  gradeBand={state.gradeBand}
                  title={t("feedbackReview.revision.questionTitle")}
                  tone="neutral"
                />
              </Stack>
            </Card>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("feedbackReview.revision.compareSubtitle")}
            title={t("feedbackReview.revision.compareSectionTitle")}
          >
            <RevisionComparisonCard
              gradeBand={state.gradeBand}
              originalExcerpt={state.viewModel.review.revisionTask.originalExcerpt}
              revisedText={revisedText}
            />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("feedbackReview.revision.editorSubtitle")}
            title={t("feedbackReview.revision.editorTitle")}
          >
            <Stack gap="md">
              <TextField
                accessibilityHint={t("feedbackReview.revision.inputHint")}
                accessibilityLabel={t("feedbackReview.revision.inputAccessibility")}
                error={revisionErrorKey ? t(revisionErrorKey) : undefined}
                gradeBand={state.gradeBand}
                inputStyle={{ minHeight: state.viewModel.gradeAdaptation.revisionInputMinHeight }}
                label={t("feedbackReview.revision.inputLabel")}
                multiline
                onChangeText={(value) => {
                  setRevisedText(value);
                  setLocalError(null);
                }}
                placeholder={t("feedbackReview.revision.inputPlaceholder")}
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

              <Button
                accessibilityHint={t("feedbackReview.revision.submitHint")}
                accessibilityLabel={t("feedbackReview.revision.submitAccessibility")}
                gradeBand={state.gradeBand}
                label={t("feedbackReview.revision.submitCta")}
                loading={state.revisionStatus === "loading"}
                onPress={() => {
                  void submitRevision();
                }}
                size={state.gradeBand === "elementary" ? "lg" : "md"}
              />
            </Stack>
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
