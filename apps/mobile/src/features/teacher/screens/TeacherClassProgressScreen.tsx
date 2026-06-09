import { useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import {
  TeacherInstructionalGroupCard,
  TeacherMetricCard,
  TeacherSkillTrendCard,
  TeacherStudentProgressRow,
} from "../components";
import { useTeacherClassProgressData } from "../hooks/useTeacher";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function TeacherClassProgressScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ classId?: string | string[] }>();
  const classId = useMemo(() => getParamValue(params.classId), [params.classId]);
  const state = useTeacherClassProgressData(classId);
  const title =
    state.status === "success"
      ? t("teacher.classProgress.titleWithClass", { name: state.viewModel.classSummary.name })
      : t("teacher.classProgress.title");

  return (
    <Screen
      backgroundColor={colors.background.subtle}
      gradeBand={state.gradeBand}
      subtitle={t("teacher.classProgress.subtitle")}
      testID="teacher-class-progress-screen"
      title={title}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("teacher.loading.classProgressAccessibility")}
          description={t("teacher.loading.classProgressDescription")}
          gradeBand={state.gradeBand}
          label={t("teacher.loading.classProgressTitle")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("teacher.error.classProgressAccessibility")}
          description={t("teacher.error.classProgressDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("teacher.error.classProgressTitle")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("teacher.dashboard.backCta")}
          accessibilityLabel={t("teacher.missing.classProgressAccessibility")}
          description={t("teacher.missing.classProgressDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.back()}
          title={t("teacher.missing.classProgressTitle")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("teacher.empty.classProgressAccessibility")}
          description={t("teacher.empty.classProgressDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("teacher.empty.classProgressTitle")}
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
            subtitle={t("teacher.classProgress.summarySubtitle")}
            title={t("teacher.classProgress.summaryTitle")}
          >
            <Stack gap="md">
              <TeacherMetricCard
                description={state.viewModel.classSummary.trendLabel}
                gradeBand={state.gradeBand}
                label={t("teacher.classProgress.summaryCompletionLabel")}
                value={`${state.viewModel.classSummary.averageCompletionPercent}%`}
              />
              <TeacherMetricCard
                description={t("teacher.classProgress.summaryReviewDescription")}
                gradeBand={state.gradeBand}
                label={t("teacher.classProgress.summaryReviewLabel")}
                value={`${state.viewModel.classSummary.submissionsNeedingReview}`}
              />
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.classProgress.skillsSubtitle")}
            title={t("teacher.classProgress.skillsTitle")}
          >
            <Stack gap="md">
              {state.viewModel.skillTrends.map((trend) => (
                <TeacherSkillTrendCard gradeBand={state.gradeBand} key={trend.skill} trend={trend} />
              ))}
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.classProgress.groupsSubtitle")}
            title={t("teacher.classProgress.groupsTitle")}
          >
            <Stack gap="md">
              {state.viewModel.instructionalGroups.map((group) => (
                <TeacherInstructionalGroupCard gradeBand={state.gradeBand} group={group} key={group.id} />
              ))}
            </Stack>
          </PageSection>

          {state.viewModel.supportStudents.length > 0 ? (
            <PageSection
              gradeBand={state.gradeBand}
              subtitle={t("teacher.classProgress.supportSubtitle")}
              title={t("teacher.classProgress.supportTitle")}
            >
              <Stack gap="md">
                {state.viewModel.supportStudents.map((student) => (
                  <TeacherStudentProgressRow gradeBand={state.gradeBand} key={student.id} student={student} />
                ))}
              </Stack>
            </PageSection>
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("teacher.classProgress.studentsSubtitle")}
            title={t("teacher.classProgress.studentsTitle")}
          >
            <Stack gap="md">
              {state.viewModel.students.map((student) => (
                <TeacherStudentProgressRow gradeBand={state.gradeBand} key={student.id} student={student} />
              ))}
            </Stack>
          </PageSection>

          <Button
            accessibilityHint={t("teacher.dashboard.backHint")}
            accessibilityLabel={t("teacher.dashboard.backAccessibility")}
            gradeBand={state.gradeBand}
            label={t("teacher.dashboard.backCta")}
            onPress={() => router.back()}
            variant="secondary"
          />
        </Stack>
      ) : null}
    </Screen>
  );
}
