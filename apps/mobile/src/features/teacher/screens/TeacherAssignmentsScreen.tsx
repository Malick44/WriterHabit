import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import { TeacherAssignmentCard } from "../components";
import { useTeacherAssignmentsData } from "../hooks/useTeacher";

export function TeacherAssignmentsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useTeacherAssignmentsData();

  return (
    <Screen
      backgroundColor={colors.background.subtle}
      gradeBand={state.gradeBand}
      subtitle={t("teacher.assignments.subtitle")}
      testID="teacher-assignments-screen"
      title={t("teacher.assignments.title")}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("teacher.loading.assignmentsAccessibility")}
          description={t("teacher.loading.assignmentsDescription")}
          gradeBand={state.gradeBand}
          label={t("teacher.loading.assignmentsTitle")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("teacher.error.assignmentsAccessibility")}
          description={t("teacher.error.assignmentsDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("teacher.error.assignmentsTitle")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("teacher.empty.assignmentsAccessibility")}
          description={t("teacher.empty.assignmentsDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("teacher.empty.assignmentsTitle")}
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

          <Button
            accessibilityHint={t("teacher.create.openHint")}
            accessibilityLabel={t("teacher.create.openAccessibility")}
            gradeBand={state.gradeBand}
            label={t("teacher.create.openCta")}
            onPress={() => router.push(routes.teacherCreateAssignment)}
          />

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.assignments.listSubtitle")}
            title={t("teacher.assignments.listTitle")}
          >
            <Stack gap="md">
              {state.viewModel.assignments.length > 0 ? (
                state.viewModel.assignments.map((assignment) => (
                  <TeacherAssignmentCard
                    assignment={assignment}
                    gradeBand={state.gradeBand}
                    key={assignment.id}
                  />
                ))
              ) : (
                <StatusState
                  accessibilityLabel={t("teacher.empty.assignmentListAccessibility")}
                  description={t("teacher.empty.assignmentListDescription")}
                  gradeBand={state.gradeBand}
                  title={t("teacher.empty.assignmentListTitle")}
                  tone="neutral"
                />
              )}
            </Stack>
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
