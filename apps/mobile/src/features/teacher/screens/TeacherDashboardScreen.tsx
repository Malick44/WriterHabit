import { View } from "react-native";
import { useRouter } from "expo-router";

import { getTeacherClassProgressRoute, getTeacherSubmissionReviewRoute } from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors, spacing } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import {
  TeacherAssignmentCard,
  TeacherClassCard,
  TeacherMetricCard,
  TeacherSubmissionCard,
} from "../components";
import { useTeacherDashboardData } from "../hooks/useTeacher";

export function TeacherDashboardScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useTeacherDashboardData();

  return (
    <Screen
      backgroundColor={colors.background.subtle}
      gradeBand={state.gradeBand}
      subtitle={t("teacher.dashboard.subtitle")}
      testID="teacher-dashboard-screen"
      title={t("teacher.dashboard.title")}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("teacher.loading.dashboardAccessibility")}
          description={t("teacher.loading.dashboardDescription")}
          gradeBand={state.gradeBand}
          label={t("teacher.loading.dashboardTitle")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("teacher.error.dashboardAccessibility")}
          description={t("teacher.error.dashboardDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("teacher.error.dashboardTitle")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("teacher.empty.dashboardAccessibility")}
          description={t("teacher.empty.dashboardDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("teacher.empty.dashboardTitle")}
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

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.dashboard.metricsSubtitle")}
            title={t("teacher.dashboard.metricsTitle")}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              <View style={{ flexBasis: "47%", flexGrow: 1 }}>
                <TeacherMetricCard
                  description={t("teacher.dashboard.metrics.studentsDescription")}
                  gradeBand={state.gradeBand}
                  label={t("teacher.dashboard.metrics.studentsLabel")}
                  value={`${state.viewModel.metrics.totalStudents}`}
                />
              </View>
              <View style={{ flexBasis: "47%", flexGrow: 1 }}>
                <TeacherMetricCard
                  description={t("teacher.dashboard.metrics.reviewDescription")}
                  gradeBand={state.gradeBand}
                  label={t("teacher.dashboard.metrics.reviewLabel")}
                  value={`${state.viewModel.metrics.reviewQueue}`}
                />
              </View>
              <View style={{ flexBasis: "47%", flexGrow: 1 }}>
                <TeacherMetricCard
                  description={t("teacher.dashboard.metrics.assignmentsDescription")}
                  gradeBand={state.gradeBand}
                  label={t("teacher.dashboard.metrics.assignmentsLabel")}
                  value={`${state.viewModel.metrics.activeAssignments}`}
                />
              </View>
              <View style={{ flexBasis: "47%", flexGrow: 1 }}>
                <TeacherMetricCard
                  description={t("teacher.dashboard.metrics.completionDescription")}
                  gradeBand={state.gradeBand}
                  label={t("teacher.dashboard.metrics.completionLabel")}
                  value={`${state.viewModel.metrics.averageCompletionPercent}%`}
                />
              </View>
            </View>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.dashboard.classesSubtitle")}
            title={t("teacher.dashboard.classesTitle")}
          >
            <Stack gap="md">
              {state.viewModel.classes.map((classSummary) => (
                <TeacherClassCard
                  classSummary={classSummary}
                  gradeBand={state.gradeBand}
                  key={classSummary.id}
                  onPress={() => router.push(getTeacherClassProgressRoute(classSummary.id))}
                />
              ))}
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.dashboard.assignmentsSubtitle")}
            title={t("teacher.dashboard.assignmentsTitle")}
          >
            <Stack gap="md">
              {state.viewModel.assignments.map((assignment) => (
                <TeacherAssignmentCard
                  assignment={assignment}
                  gradeBand={state.gradeBand}
                  key={assignment.id}
                />
              ))}
              <Button
                accessibilityHint={t("teacher.create.openHint")}
                accessibilityLabel={t("teacher.create.openAccessibility")}
                gradeBand={state.gradeBand}
                label={t("teacher.create.openCta")}
                onPress={() => router.push(routes.teacherCreateAssignment)}
                variant="secondary"
              />
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.dashboard.submissionsSubtitle")}
            title={t("teacher.dashboard.submissionsTitle")}
          >
            <Stack gap="md">
              {state.viewModel.submissions.map((submission) => (
                <TeacherSubmissionCard
                  gradeBand={state.gradeBand}
                  key={submission.id}
                  onPress={() => router.push(getTeacherSubmissionReviewRoute(submission.id))}
                  submission={submission}
                />
              ))}
            </Stack>
          </PageSection>

          <StatusState
            accessibilityLabel={t("teacher.safety.accessibility")}
            description={state.viewModel.safetyNote}
            gradeBand={state.gradeBand}
            title={t("teacher.safety.title")}
            tone="info"
          />
        </Stack>
      ) : null}
    </Screen>
  );
}
