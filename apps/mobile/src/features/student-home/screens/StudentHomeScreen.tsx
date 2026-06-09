import { useCallback } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { routes } from "@/core/navigation/routeNames";
import { colors, spacing, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/feedback";
import { PageSection, Screen } from "@/shared/components/layout";
import { useGlacierThemeStore } from "@/shared/theme/glacierThemeStore";

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
  const { primaryColor, fontSizeScale } = useGlacierThemeStore();

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

  const greetingHeader = (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCLvgSHlFfdGI9SJ_vxGFGYFH_lV7whB7sK2oL4RJ8jOiPe0XrRsh4mrC2BXQv9AtamPohOXiY0neEXNQYON9plTh8dcWvdQadi9UBTXw3VWPvfW-T3SegDG744FX_DPXao2WRBkMtSes3_kULaB8ANrNW1iJq8Az-5OFYeIpuVu2QLF3n5QBA3knJY6XgQ0eHDKCpo7Gj5IprtLuzc_X1tOuLi5x15HdUV_wQxn1HP0rJoIxXKKlJobXUl66uHpuN7gFZNk_wjGZ4",
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.15)",
          }}
        />
        <View style={{ gap: spacing.xs }}>
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: Math.round(13 * fontSizeScale),
            }}
          >
            {t("studentHome.greetingPrefix")}
          </Text>
          <Text
            style={{
              color: primaryColor,
              fontSize: Math.round(20 * fontSizeScale),
              fontWeight: "700",
            }}
          >
            {state.status === "success" || state.status === "empty"
              ? `${state.viewModel.studentFirstName}! ☀️`
              : `${t("studentHome.defaultStudent")}! ☀️`}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel={t("studentHome.notifications.accessibility")}
        accessibilityRole="button"
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Ionicons name="notifications-outline" size={20} color={primaryColor} />
      </Pressable>
    </View>
  );

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t(getSubtitleKey(state.gradeBand))}
      testID="student-home-screen"
      title=""
    >
      {greetingHeader}
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
