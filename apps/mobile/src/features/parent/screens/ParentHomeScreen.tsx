import { Text } from "react-native";
import { useRouter } from "expo-router";

import {
  getParentAssignmentReviewRoute,
  getParentStudentReportRoute,
} from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import {
  ParentAssignmentSummaryCard,
  ParentSettingsSummaryCard,
  ParentSkillProgressCard,
  ParentStudentSelector,
  ParentWeeklySnapshotCard,
} from "../components";
import { useParentDashboardData } from "../hooks/useParent";

export function ParentHomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useParentDashboardData();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[state.gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const title =
    state.status === "success" && state.viewModel.selectedStudent
      ? t("parent.homeTitleWithStudent", { name: state.viewModel.selectedStudent.displayName })
      : t("parent.homeTitle");

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("parent.homeSubtitle")}
      testID="parent-home-screen"
      title={title}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("parent.loading.homeAccessibility")}
          description={t("parent.loading.homeDescription")}
          gradeBand={state.gradeBand}
          label={t("parent.loading.homeTitle")}
          testID="parent-home-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("parent.error.homeAccessibility")}
          description={t("parent.error.homeDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="parent-home-error"
          title={t("parent.error.homeTitle")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("parent.empty.homeAccessibility")}
          description={t("parent.empty.homeDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="parent-home-empty"
          title={t("parent.empty.homeTitle")}
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

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.selector.subtitle")}
            title={t("parent.selector.title")}
          >
            <ParentStudentSelector
              gradeBand={state.gradeBand}
              onSelectStudent={state.selectStudent}
              selectedStudentId={state.selectedStudentId}
              students={state.viewModel.students}
            />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.weekly.subtitle")}
            title={t("parent.weekly.title")}
          >
            <ParentWeeklySnapshotCard gradeBand={state.gradeBand} viewModel={state.viewModel} />
          </PageSection>

          {state.viewModel.weeklyProgress ? (
            <PageSection
              gradeBand={state.gradeBand}
              subtitle={t("parent.practice.subtitle")}
              title={t("parent.practice.title")}
            >
              <Card
                accessibilityLabel={t("parent.practice.accessibility")}
                gradeBand={state.gradeBand}
                variant="warning"
              >
                <Stack gap="xs">
                  <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
                    {state.viewModel.weeklyProgress.areaToPracticeLabel}
                  </Text>
                  <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
                    {state.viewModel.weeklyProgress.areaToPracticeDescription}
                  </Text>
                </Stack>
              </Card>
            </PageSection>
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.skills.subtitle")}
            title={t("parent.skills.title")}
          >
            <Stack gap="md">
              {state.viewModel.skillProgress.map((skill) => (
                <ParentSkillProgressCard gradeBand={state.gradeBand} key={skill.skill} skill={skill} />
              ))}
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.assignments.subtitle")}
            title={t("parent.assignments.title")}
          >
            <Stack gap="md">
              {state.viewModel.assignments.map((assignment) => (
                <ParentAssignmentSummaryCard
                  assignment={assignment}
                  gradeBand={state.gradeBand}
                  key={assignment.submissionId}
                  onPress={() => router.push(getParentAssignmentReviewRoute(assignment.submissionId))}
                />
              ))}
              <Button
                accessibilityHint={t("parent.assignments.openAllHint")}
                accessibilityLabel={t("parent.assignments.openAllAccessibility")}
                gradeBand={state.gradeBand}
                label={t("parent.assignments.openAllCta")}
                onPress={() => router.push(routes.parentAssignments)}
                size={state.gradeBand === "elementary" ? "lg" : "md"}
                variant="secondary"
              />
            </Stack>
          </PageSection>

          {state.viewModel.selectedStudent ? (
            <Button
              accessibilityHint={t("parent.report.openHint")}
              accessibilityLabel={t("parent.report.openAccessibility", {
                name: state.viewModel.selectedStudent.displayName,
              })}
              gradeBand={state.gradeBand}
              label={t("parent.report.openCta")}
              onPress={() =>
                state.viewModel.selectedStudent
                  ? router.push(getParentStudentReportRoute(state.viewModel.selectedStudent.id))
                  : undefined
              }
              size={state.gradeBand === "elementary" ? "lg" : "md"}
            />
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.settings.homeSubtitle")}
            title={t("parent.settings.homeTitle")}
          >
            <ParentSettingsSummaryCard
              gradeBand={state.gradeBand}
              onPress={() => router.push(routes.parentSettings)}
              settingsSummary={state.viewModel.settingsSummary}
            />
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
