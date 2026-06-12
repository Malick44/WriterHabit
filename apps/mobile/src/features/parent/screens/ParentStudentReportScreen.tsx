import { useMemo, type ReactNode } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getParentAssignmentReviewRoute } from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { colors, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { Inline, PageSection, Screen, Stack } from "@/shared/components/layout";
import { EntitlementGate } from "@/features/subscriptions";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import {
  ParentAssignmentSummaryCard,
  ParentSkillProgressCard,
  ParentWeeklySnapshotCard,
} from "../components";
import { useParentStudentReportData } from "../hooks/useParent";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function ParentStudentReportScreen() {
  const { t } = useI18n();
  const fallbackWrapper = (content: ReactNode) => (
    <Screen
      backgroundColor={colors.background.subtle}
      gradeBand="middle"
      subtitle={t("parent.report.subtitle")}
      testID="parent-student-report-screen"
      title={t("parent.reportTitle")}
    >
      {content}
    </Screen>
  );

  return (
    <EntitlementGate fallbackWrapper={fallbackWrapper} featureId="family_progress_reports">
      <ParentStudentReportContent />
    </EntitlementGate>
  );
}

function ParentStudentReportContent() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ studentId?: string | string[] }>();
  const studentId = useMemo(() => getParamValue(params.studentId), [params.studentId]);
  const state = useParentStudentReportData(studentId);
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[state.gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const title =
    state.status === "success" && state.viewModel.student
      ? t("parent.report.titleWithStudent", { name: state.viewModel.student.displayName })
      : t("parent.reportTitle");

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("parent.report.subtitle")}
      testID="parent-student-report-screen"
      title={title}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("parent.loading.reportAccessibility")}
          description={t("parent.loading.reportDescription")}
          gradeBand={state.gradeBand}
          label={t("parent.loading.reportTitle")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("parent.error.reportAccessibility")}
          description={t("parent.error.reportDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("parent.error.reportTitle")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("parent.empty.reportAction")}
          accessibilityLabel={t("parent.empty.reportAccessibility")}
          description={t("parent.empty.reportDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.push(routes.parentHome)}
          title={t("parent.empty.reportTitle")}
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
            subtitle={t("parent.weekly.subtitle")}
            title={t("parent.weekly.title")}
          >
            <ParentWeeklySnapshotCard gradeBand={state.gradeBand} viewModel={state.viewModel} />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.report.strengthsSubtitle")}
            title={t("parent.report.strengthsTitle")}
          >
            <Inline align="stretch" gap="md">
              {state.viewModel.strengths.map((strength) => (
                <View key={strength} style={{ flex: 1, minWidth: state.gradeBand === "elementary" ? "100%" : 220 }}>
                  <Card
                    accessibilityLabel={buildAccessibilityLabel([
                      t("parent.report.strengthAccessibility"),
                      strength,
                    ])}
                    gradeBand={state.gradeBand}
                    variant="success"
                  >
                    <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
                      {strength}
                    </Text>
                  </Card>
                </View>
              ))}
            </Inline>
          </PageSection>

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
            subtitle={t("parent.report.practiceSubtitle")}
            title={t("parent.report.practiceTitle")}
          >
            <Stack gap="md">
              {state.viewModel.practiceFocus.map((focus) => (
                <Card
                  accessibilityLabel={buildAccessibilityLabel([t("parent.report.practiceAccessibility"), focus])}
                  gradeBand={state.gradeBand}
                  key={focus}
                  variant="warning"
                >
                  <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
                    {focus}
                  </Text>
                </Card>
              ))}
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.report.nextStepsSubtitle")}
            title={t("parent.report.nextStepsTitle")}
          >
            <Stack gap="md">
              {state.viewModel.nextSteps.map((step, index) => (
                <Card
                  accessibilityLabel={buildAccessibilityLabel([
                    t("parent.report.nextStepAccessibility"),
                    index + 1,
                    step,
                  ])}
                  gradeBand={state.gradeBand}
                  key={step}
                >
                  <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
                    {t("parent.report.nextStepValue", { count: index + 1, step })}
                  </Text>
                </Card>
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
            </Stack>
          </PageSection>

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
      ) : null}
    </Screen>
  );
}
