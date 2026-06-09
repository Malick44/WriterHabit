import { View } from "react-native";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { Inline, PageSection, Screen, Stack } from "@/shared/components/layout";

import {
  BadgeCard,
  ProgressMetricCard,
  SkillProgressCard,
  StreakSummaryCard,
  WeeklyReviewSummaryCard,
} from "../components";
import { useProgressDashboard } from "../hooks/useProgress";

function getSubtitleKey(gradeBand: "elementary" | "middle" | "high") {
  switch (gradeBand) {
    case "elementary":
      return "progress.dashboard.subtitleElementary";
    case "high":
      return "progress.dashboard.subtitleHigh";
    case "middle":
      return "progress.dashboard.subtitleMiddle";
  }
}

export function StudentProgressScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useProgressDashboard();
  const title =
    state.status === "success" || state.status === "empty"
      ? t("progress.dashboard.greeting", { name: state.viewModel.studentFirstName })
      : t("progress.dashboard.title");

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t(getSubtitleKey(state.gradeBand))}
      testID="progress-dashboard-screen"
      title={title}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("progress.dashboard.loading.accessibility")}
          description={t("progress.dashboard.loading.description")}
          gradeBand={state.gradeBand}
          label={t("progress.dashboard.loading.title")}
          testID="progress-dashboard-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("progress.dashboard.error.accessibility")}
          description={t("progress.dashboard.error.description")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="progress-dashboard-error"
          title={t("progress.dashboard.error.title")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("progress.dashboard.empty.action")}
          accessibilityLabel={t("progress.dashboard.empty.accessibility")}
          description={t("progress.dashboard.empty.description")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.push(routes.studentAssignmentsHistory)}
          testID="progress-dashboard-empty"
          title={t("progress.dashboard.empty.title")}
        />
      ) : null}

      {state.status === "success" ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <StatusState
              actionLabel={t("common.retry")}
              accessibilityLabel={t("progress.dashboard.offline.accessibility")}
              description={t("progress.dashboard.offline.description")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              title={t("progress.dashboard.offline.title")}
              tone="warning"
            />
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("progress.dashboard.sections.streakSubtitle")}
            title={t("progress.dashboard.sections.streak")}
          >
            <StreakSummaryCard gradeBand={state.gradeBand} streak={state.viewModel.streak} />
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("progress.dashboard.sections.metricsSubtitle")}
            title={t("progress.dashboard.sections.metrics")}
          >
            <Inline align="stretch" gap="md">
              {state.viewModel.visibleMetrics.map((metric) => (
                <View
                  key={metric.id}
                  style={{ flex: 1, minWidth: state.gradeBand === "elementary" ? "100%" : 220 }}
                >
                  <ProgressMetricCard gradeBand={state.gradeBand} metric={metric} />
                </View>
              ))}
            </Inline>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("progress.dashboard.sections.skillsSubtitle")}
            title={t("progress.dashboard.sections.skills")}
          >
            <Stack gap="md">
              {state.viewModel.visibleSkills.map((skill) => (
                <SkillProgressCard
                  gradeAdaptation={state.viewModel.gradeAdaptation}
                  gradeBand={state.gradeBand}
                  key={skill.skill}
                  onPress={() =>
                    router.push({
                      pathname: "/(student)/progress/skills/[skillId]",
                      params: { skillId: skill.skill },
                    })
                  }
                  skill={skill}
                />
              ))}
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("progress.dashboard.sections.badgesSubtitle")}
            title={t("progress.dashboard.sections.badges")}
          >
            <Stack gap="md">
              <Inline align="stretch" gap="md">
                {state.viewModel.badgePreview.map((badge) => (
                  <View
                    key={badge.id}
                    style={{ flex: 1, minWidth: state.gradeBand === "elementary" ? "100%" : 220 }}
                  >
                    <BadgeCard badge={badge} gradeBand={state.gradeBand} />
                  </View>
                ))}
              </Inline>
              <Button
                accessibilityHint={t("progress.badges.openHint")}
                accessibilityLabel={t("progress.badges.openAccessibility")}
                gradeBand={state.gradeBand}
                label={t("progress.badges.openCta")}
                onPress={() => router.push(routes.studentProgressBadges)}
                size={state.gradeBand === "elementary" ? "lg" : "md"}
                variant="secondary"
              />
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("progress.dashboard.sections.weeklySubtitle")}
            title={t("progress.dashboard.sections.weekly")}
          >
            <WeeklyReviewSummaryCard
              gradeBand={state.gradeBand}
              onOpenWeeklyReview={() => router.push(routes.studentProgressWeeklyReview)}
              weeklyReview={state.viewModel.weeklyReview}
            />
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
