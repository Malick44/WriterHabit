import { useRouter } from "expo-router";

import { getParentAssignmentReviewRoute } from "@/core/navigation/deepLinks";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import {
  ParentAssignmentSummaryCard,
  ParentStudentSelector,
} from "../components";
import { useParentAssignmentsData } from "../hooks/useParent";

export function ParentAssignmentsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useParentAssignmentsData();

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("parent.assignments.screenSubtitle")}
      testID="parent-assignments-screen"
      title={t("parent.assignments.screenTitle")}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("parent.loading.assignmentsAccessibility")}
          description={t("parent.loading.assignmentsDescription")}
          gradeBand={state.gradeBand}
          label={t("parent.loading.assignmentsTitle")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("parent.error.assignmentsAccessibility")}
          description={t("parent.error.assignmentsDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("parent.error.assignmentsTitle")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("parent.empty.assignmentsAccessibility")}
          description={t("parent.empty.assignmentsDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("parent.empty.assignmentsTitle")}
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
            subtitle={t("parent.assignments.listSubtitle")}
            title={t("parent.assignments.listTitle")}
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
        </Stack>
      ) : null}
    </Screen>
  );
}
