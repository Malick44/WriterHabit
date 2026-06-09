import { useMemo } from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import {
  ParentAiFeedbackCard,
  ParentCanvasPreviewCard,
  ParentRubricRowCard,
  ParentRubricSummaryCard,
  ParentWorkPreviewCard,
} from "../components";
import { useParentAssignmentReviewData } from "../hooks/useParent";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function ParentAssignmentReviewScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ submissionId?: string | string[] }>();
  const submissionId = useMemo(() => getParamValue(params.submissionId), [params.submissionId]);
  const state = useParentAssignmentReviewData(submissionId);
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[state.gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const title =
    state.status === "success"
      ? state.viewModel.review.assignmentTitle
      : t("parent.assignmentReviewTitle");

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("parent.review.subtitle")}
      testID="parent-assignment-review-screen"
      title={title}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("parent.loading.reviewAccessibility")}
          description={t("parent.loading.reviewDescription")}
          gradeBand={state.gradeBand}
          label={t("parent.loading.reviewTitle")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("parent.error.reviewAccessibility")}
          description={t("parent.error.reviewDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("parent.error.reviewTitle")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("parent.review.missingAction")}
          accessibilityLabel={t("parent.review.missingAccessibility")}
          description={t("parent.review.missingDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.push(routes.parentAssignments)}
          title={t("parent.review.missingTitle")}
        />
      ) : null}

      {state.status === "success" ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <StatusState
              actionLabel={t("common.retry")}
              accessibilityLabel={t("parent.offline.accessibility")}
              description={t("parent.offline.description")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              title={t("parent.offline.title")}
              tone="warning"
            />
          ) : null}

          <StatusState
            accessibilityLabel={t("parent.review.safetyAccessibility")}
            description={state.viewModel.review.safetyNote}
            gradeBand={state.gradeBand}
            title={t("parent.review.safetyTitle")}
            tone="info"
          />

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.review.workSubtitle", {
              name: state.viewModel.review.studentName,
              submitted: state.viewModel.review.submittedLabel,
            })}
            title={t("parent.review.workTitle")}
          >
            <ParentWorkPreviewCard gradeBand={state.gradeBand} viewModel={state.viewModel} />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.review.feedbackSubtitle")}
            title={t("parent.review.feedbackTitle")}
          >
            <ParentAiFeedbackCard gradeBand={state.gradeBand} viewModel={state.viewModel} />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.review.canvasSubtitle")}
            title={t("parent.review.canvasTitle")}
          >
            <ParentCanvasPreviewCard gradeBand={state.gradeBand} viewModel={state.viewModel} />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.review.rubricSubtitle")}
            title={t("parent.review.rubricTitle")}
          >
            <Stack gap="md">
              <ParentRubricSummaryCard gradeBand={state.gradeBand} viewModel={state.viewModel} />
              {state.viewModel.review.rubric.map((row) => (
                <ParentRubricRowCard
                  gradeBand={state.gradeBand}
                  key={row.id}
                  row={row}
                  showDescription={state.viewModel.gradeAdaptation.showDetailedRubric}
                />
              ))}
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.review.guidanceSubtitle")}
            title={t("parent.review.guidanceTitle")}
          >
            <Stack gap="md">
              {state.viewModel.review.parentGuidance.map((guidance, index) => (
                <Card
                  accessibilityLabel={buildAccessibilityLabel([
                    t("parent.review.guidanceAccessibility"),
                    index + 1,
                    guidance,
                  ])}
                  gradeBand={state.gradeBand}
                  key={guidance}
                  variant="warning"
                >
                  <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
                    {t("parent.review.guidanceValue", { count: index + 1, guidance })}
                  </Text>
                </Card>
              ))}
            </Stack>
          </PageSection>

          <Button
            accessibilityHint={t("parent.review.backHint")}
            accessibilityLabel={t("parent.review.backAccessibility")}
            gradeBand={state.gradeBand}
            label={t("parent.review.backCta")}
            onPress={() => router.push(routes.parentAssignments)}
            size={state.gradeBand === "elementary" ? "lg" : "md"}
            variant="secondary"
          />
        </Stack>
      ) : null}
    </Screen>
  );
}
