import { useCallback } from "react";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback";
import { PageSection, Screen } from "@/shared/components/layout";

import {
  CoachEntryCard,
  ContinueDraftCard,
  DashboardStatusBanner,
  PracticeOverview,
  RecentFeedbackCard,
  SkillProgressPreview,
  TodayAssignmentCard,
} from "../components";
import { useStudentHomeData } from "../hooks/useStudentHomeData";
import type { StudentHomeNavigationTarget } from "../types";

function getSubtitleKey(gradeBand: GradeBand) {
  switch (gradeBand) {
    case "elementary":
      return "studentHome.subtitle.elementary";
    case "high":
      return "studentHome.subtitle.high";
    case "middle":
      return "studentHome.subtitle.middle";
  }
}

export function StudentHomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useStudentHomeData();

  const navigateToTarget = useCallback(
    (target: StudentHomeNavigationTarget) => {
      switch (target.kind) {
        case "assignmentDetail":
          router.push({
            pathname: "/(student)/assignments/[assignmentId]",
            params: { assignmentId: target.assignmentId },
          });
          return;
        case "assignmentHistory":
          router.push(routes.studentAssignmentsHistory);
          return;
        case "canvasTemplates":
          router.push(routes.studentCanvasTemplates);
          return;
        case "progress":
          router.push(routes.studentProgress);
          return;
        case "review":
          router.push({
            pathname: "/(student)/review/[submissionId]",
            params: { submissionId: target.submissionId },
          });
          return;
        case "write":
          router.push({
            pathname: "/(student)/write/[assignmentId]",
            params: { assignmentId: target.assignmentId },
          });
          return;
      }
    },
    [router],
  );

  const title =
    state.status === "success" || state.status === "empty"
      ? t("studentHome.greeting", { name: state.viewModel.studentFirstName })
      : t("studentHome.title");

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t(getSubtitleKey(state.gradeBand))}
      testID="student-home-screen"
      title={title}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("studentHome.loading.accessibility")}
          description={t("studentHome.loading.description")}
          gradeBand={state.gradeBand}
          label={t("studentHome.loading.title")}
          testID="student-home-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("studentHome.error.accessibility")}
          description={t("studentHome.error.description")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="student-home-error"
          title={t("studentHome.error.title")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("studentHome.empty.action")}
          accessibilityLabel={t("studentHome.empty.accessibility")}
          description={t("studentHome.empty.description")}
          gradeBand={state.gradeBand}
          onActionPress={() => navigateToTarget({ kind: "assignmentHistory" })}
          testID="student-home-empty"
          title={t("studentHome.empty.title")}
        />
      ) : null}

      {state.status === "success" ? (
        <>
          <DashboardStatusBanner
            gradeBand={state.gradeBand}
            onRetryPress={state.refetch}
            viewModel={state.viewModel}
          />

          {state.viewModel.todayAssignment ? (
            <PageSection
              gradeBand={state.gradeBand}
              subtitle={t("studentHome.sections.todaySubtitle")}
              title={t("studentHome.sections.today")}
            >
              <TodayAssignmentCard
                assignment={state.viewModel.todayAssignment}
                gradeAdaptation={state.viewModel.gradeAdaptation}
                gradeBand={state.gradeBand}
                onOpenAssignment={() =>
                  state.viewModel.todayAssignment
                    ? navigateToTarget({
                        assignmentId: state.viewModel.todayAssignment.id,
                        kind: "assignmentDetail",
                      })
                    : undefined
                }
                onStartWriting={() =>
                  state.viewModel.todayAssignment
                    ? navigateToTarget({
                        assignmentId: state.viewModel.todayAssignment.id,
                        kind: "write",
                      })
                    : undefined
                }
              />
            </PageSection>
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("studentHome.sections.practiceSubtitle")}
            title={t("studentHome.sections.practice")}
          >
            <PracticeOverview gradeBand={state.gradeBand} viewModel={state.viewModel} />
          </PageSection>

          {state.viewModel.continueDraft ? (
            <PageSection
              gradeBand={state.gradeBand}
              subtitle={t("studentHome.sections.draftSubtitle")}
              title={t("studentHome.sections.draft")}
            >
              <ContinueDraftCard
                draft={state.viewModel.continueDraft}
                gradeBand={state.gradeBand}
                onContinuePress={() =>
                  state.viewModel.continueDraft
                    ? navigateToTarget({
                        assignmentId: state.viewModel.continueDraft.assignmentId,
                        kind: "write",
                      })
                    : undefined
                }
              />
            </PageSection>
          ) : null}

          {state.viewModel.skillProgress.length > 0 ? (
            <PageSection
              gradeBand={state.gradeBand}
              subtitle={t("studentHome.sections.skillsSubtitle")}
              title={t("studentHome.sections.skills")}
            >
              <SkillProgressPreview
                gradeBand={state.gradeBand}
                onOpenProgress={() => navigateToTarget({ kind: "progress" })}
                skills={state.viewModel.skillProgress}
              />
            </PageSection>
          ) : null}

          {state.viewModel.recentFeedback[0] ? (
            <PageSection
              gradeBand={state.gradeBand}
              subtitle={t("studentHome.sections.feedbackSubtitle")}
              title={t("studentHome.sections.feedback")}
            >
              <RecentFeedbackCard
                feedback={state.viewModel.recentFeedback[0]}
                gradeAdaptation={state.viewModel.gradeAdaptation}
                gradeBand={state.gradeBand}
                onReviewPress={() =>
                  state.viewModel.recentFeedback[0]
                    ? navigateToTarget({
                        kind: "review",
                        submissionId: state.viewModel.recentFeedback[0].submissionId,
                      })
                    : undefined
                }
              />
            </PageSection>
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("studentHome.sections.coachSubtitle")}
            title={t("studentHome.sections.coach")}
          >
            <CoachEntryCard
              actions={state.viewModel.coachActions}
              gradeBand={state.gradeBand}
              onActionPress={(action) => navigateToTarget(action.target)}
            />
          </PageSection>
        </>
      ) : null}
    </Screen>
  );
}
