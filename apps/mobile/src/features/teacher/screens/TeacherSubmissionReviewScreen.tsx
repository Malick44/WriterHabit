import { useEffect, useMemo, useState } from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { EmptyState, ErrorState, LoadingState, ProgressBar, StatusState } from "@/shared/components/feedback";
import { TextField } from "@/shared/components/forms";
import { PageSection, Screen, Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { TeacherRubricReviewCard } from "../components";
import {
  useTeacherSubmissionReviewData,
  useUpdateTeacherSubmissionComment,
} from "../hooks/useTeacher";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function TeacherSubmissionReviewScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const params = useLocalSearchParams<{ submissionId?: string | string[] }>();
  const submissionId = useMemo(() => getParamValue(params.submissionId), [params.submissionId]);
  const state = useTeacherSubmissionReviewData(submissionId);
  const saveComment = useUpdateTeacherSubmissionComment();
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const reviewComment = state.status === "success" ? state.viewModel.review.teacherComment : "";
  const type = typography.gradeBands[state.gradeBand];

  useEffect(() => {
    setComment(reviewComment);
  }, [reviewComment]);

  const handleSave = async () => {
    if (!submissionId) {
      return;
    }

    if (comment.trim().length < 10) {
      setCommentError(t("teacher.review.commentTooShort"));
      return;
    }

    setCommentError(null);

    try {
      await saveComment.saveComment({ comment, submissionId });
    } catch {
      // The mutation status renders the recovery state below.
    }
  };

  return (
    <Screen
      backgroundColor={colors.background.subtle}
      gradeBand={state.gradeBand}
      subtitle={t("teacher.review.subtitle")}
      testID="teacher-submission-review-screen"
      title={t("teacher.review.title")}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("teacher.loading.reviewAccessibility")}
          description={t("teacher.loading.reviewDescription")}
          gradeBand={state.gradeBand}
          label={t("teacher.loading.reviewTitle")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("teacher.error.reviewAccessibility")}
          description={t("teacher.error.reviewDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("teacher.error.reviewTitle")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("teacher.submissions.backCta")}
          accessibilityLabel={t("teacher.missing.reviewAccessibility")}
          description={t("teacher.missing.reviewDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.replace(routes.teacherSubmissions)}
          title={t("teacher.missing.reviewTitle")}
        />
      ) : null}

      {state.status === "success" ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <StatusState
              actionLabel={t("common.retry")}
              accessibilityLabel={t("teacher.offline.accessibility")}
              description={t("teacher.offline.description")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              title={t("teacher.offline.title")}
              tone="warning"
            />
          ) : null}

          {saveComment.status === "success" ? (
            <StatusState
              accessibilityLabel={t("teacher.review.savedAccessibility")}
              description={t("teacher.review.savedDescription")}
              gradeBand={state.gradeBand}
              title={t("teacher.review.savedTitle")}
              tone="success"
            />
          ) : null}

          {saveComment.status === "error" ? (
            <ErrorState
              actionLabel={t("common.retry")}
              accessibilityLabel={t("teacher.review.saveErrorAccessibility")}
              description={t("teacher.review.saveErrorDescription")}
              gradeBand={state.gradeBand}
              onActionPress={() => {
                void handleSave();
              }}
              title={t("teacher.review.saveErrorTitle")}
            />
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.review.overviewSubtitle")}
            title={t("teacher.review.overviewTitle")}
          >
            <Card
              accessibilityLabel={t("teacher.review.overviewAccessibility")}
              gradeBand={state.gradeBand}
              title={state.viewModel.review.assignmentTitle}
            >
              <Stack gap="sm">
                <Text
                  selectable
                  style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.text }]}
                >
                  {state.viewModel.review.studentName} · {state.viewModel.review.className} ·{" "}
                  {state.viewModel.review.submittedLabel}
                </Text>
                <Text
                  selectable
                  style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}
                >
                  {state.viewModel.review.assignmentPrompt}
                </Text>
                <Text
                  selectable
                  style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}
                >
                  {t("teacher.review.wordCount", { count: state.viewModel.review.wordCount })}
                </Text>
              </Stack>
            </Card>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.review.workSubtitle")}
            title={t("teacher.review.workTitle")}
          >
            <Card
              accessibilityLabel={t("teacher.review.workAccessibility")}
              gradeBand={state.gradeBand}
            >
              <Stack gap="sm">
                <Text
                  selectable
                  style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}
                >
                  {state.viewModel.review.writingPreview}
                </Text>
                {state.viewModel.review.canvasPreview ? (
                  <Text
                    selectable
                    style={[getAccessibleTextStyle(type.caption, settings), { color: colors.feedback.info.text }]}
                  >
                    {t("teacher.review.canvasPreview", {
                      count: state.viewModel.review.canvasPreview.pageCount,
                      title: state.viewModel.review.canvasPreview.title,
                    })}
                  </Text>
                ) : null}
              </Stack>
            </Card>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.review.rubricSubtitle")}
            title={t("teacher.review.rubricTitle")}
          >
            <Stack gap="md">
              <ProgressBar
                gradeBand={state.gradeBand}
                label={t("teacher.review.rubricTotalAccessibility")}
                showValue
                value={state.viewModel.rubricScoreValue}
              />
              <Text
                selectable
                style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.text }]}
              >
                {t("teacher.review.totalScoreLabel", {
                  max: state.viewModel.rubricMax,
                  score: state.viewModel.rubricEarned,
                })}
              </Text>
              {state.viewModel.visibleRubric.map((row) => (
                <TeacherRubricReviewCard gradeBand={state.gradeBand} key={row.criterionId} row={row} />
              ))}
            </Stack>
          </PageSection>

          <StatusState
            accessibilityLabel={t("teacher.review.revisionTaskAccessibility")}
            description={state.viewModel.review.revisionTask}
            gradeBand={state.gradeBand}
            title={t("teacher.review.revisionTaskTitle")}
            tone="info"
          />

          <StatusState
            accessibilityLabel={t("teacher.safety.accessibility")}
            description={state.viewModel.review.safetyNote}
            gradeBand={state.gradeBand}
            title={t("teacher.safety.title")}
            tone="info"
          />

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.review.commentSubtitle")}
            title={t("teacher.review.commentTitle")}
          >
            <Stack gap="md">
              <TextField
                accessibilityHint={t("teacher.review.commentHint")}
                accessibilityLabel={t("teacher.review.commentAccessibility")}
                editable={!saveComment.isSaving}
                error={commentError ?? undefined}
                gradeBand={state.gradeBand}
                inputStyle={{ minHeight: 120 }}
                label={t("teacher.review.commentLabel")}
                multiline
                onChangeText={(value) => {
                  setComment(value);
                  setCommentError(null);
                  saveComment.reset();
                }}
                placeholder={t("teacher.review.commentPlaceholder")}
                value={comment}
              />
              <Button
                accessibilityHint={t("teacher.review.saveHint")}
                accessibilityLabel={t("teacher.review.saveAccessibility")}
                gradeBand={state.gradeBand}
                label={t("teacher.review.saveCta")}
                loading={saveComment.isSaving}
                onPress={() => {
                  void handleSave();
                }}
              />
              <Button
                accessibilityHint={t("teacher.submissions.backHint")}
                accessibilityLabel={t("teacher.submissions.backAccessibility")}
                disabled={saveComment.isSaving}
                gradeBand={state.gradeBand}
                label={t("teacher.submissions.backCta")}
                onPress={() => router.replace(routes.teacherSubmissions)}
                variant="secondary"
              />
            </Stack>
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
