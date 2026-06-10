import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { Inline, PageSection, Screen, Stack } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { ProgressMetricCard, SkillProgressCard } from "../components";
import { useProgressWeeklyReview } from "../hooks/useProgress";

export function WeeklyReviewScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useProgressWeeklyReview();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[state.gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      testID="progress-weekly-review-screen"
    >
      <AppHeader
        gradeBand={state.gradeBand}
        leftAction={{
          accessibilityLabelKey: "common.back",
          type: "back",
        }}
        showSafeArea={false}
        style={styles.header}
        subtitleKey="progress.weeklyReview.subtitle"
        titleKey="progress.weeklyReview.title"
        variant="transparent"
      />

      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("progress.weeklyReview.loading.accessibility")}
          description={t("progress.weeklyReview.loading.description")}
          gradeBand={state.gradeBand}
          label={t("progress.weeklyReview.loading.title")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("progress.weeklyReview.error.accessibility")}
          description={t("progress.weeklyReview.error.description")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("progress.weeklyReview.error.title")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("progress.weeklyReview.emptyAction")}
          accessibilityLabel={t("progress.weeklyReview.emptyAccessibility")}
          description={t("progress.weeklyReview.emptyDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.push(routes.studentAssignmentsHistory)}
          title={t("progress.weeklyReview.emptyTitle")}
        />
      ) : null}

      {state.status === "success" ? (
        <Stack gap="lg">
          {state.dashboard.isOffline ? (
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

          <Card
            accessibilityLabel={buildAccessibilityLabel([
              t("progress.weeklyReview.summaryAccessibility"),
              state.weeklyReview.weekLabel,
            ])}
            gradeBand={state.gradeBand}
            variant="accent"
          >
            <Stack gap="xs">
              <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}>
                {state.weeklyReview.weekLabel}
              </Text>
              <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
                {t("progress.weeklyReview.summaryTitle")}
              </Text>
              <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
                {t("progress.weeklyReview.summaryDescription")}
              </Text>
            </Stack>
          </Card>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("progress.weeklyReview.sections.metricsSubtitle")}
            title={t("progress.weeklyReview.sections.metrics")}
          >
            <Inline align="stretch" gap="md">
              {state.weeklyReview.metrics.map((metric) => (
                <View key={metric.id} style={{ flex: 1, minWidth: state.gradeBand === "elementary" ? "100%" : 220 }}>
                  <ProgressMetricCard gradeBand={state.gradeBand} metric={metric} />
                </View>
              ))}
            </Inline>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("progress.weeklyReview.sections.highlightsSubtitle")}
            title={t("progress.weeklyReview.sections.highlights")}
          >
            <Stack gap="md">
              {state.weeklyReview.highlights.map((highlight) => (
                <Card
                  accessibilityLabel={buildAccessibilityLabel([t("progress.weeklyReview.highlightAccessibility"), highlight])}
                  gradeBand={state.gradeBand}
                  key={highlight}
                >
                  <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
                    {highlight}
                  </Text>
                </Card>
              ))}
            </Stack>
          </PageSection>

          {state.weeklyReview.nextFocusSkill ? (
            <PageSection
              gradeBand={state.gradeBand}
              subtitle={t("progress.weeklyReview.sections.nextFocusSubtitle")}
              title={t("progress.weeklyReview.sections.nextFocus")}
            >
              <SkillProgressCard
                gradeAdaptation={state.dashboard.gradeAdaptation}
                gradeBand={state.gradeBand}
                onPress={() =>
                  state.weeklyReview.nextFocusSkill
                    ? router.push({
                        pathname: "/(student)/progress/skills/[skillId]",
                        params: { skillId: state.weeklyReview.nextFocusSkill.skill },
                      })
                    : undefined
                }
                skill={state.weeklyReview.nextFocusSkill}
              />
            </PageSection>
          ) : null}

          <Button
            accessibilityHint={t("progress.weeklyReview.dashboardHint")}
            accessibilityLabel={t("progress.weeklyReview.dashboardAccessibility")}
            gradeBand={state.gradeBand}
            label={t("progress.weeklyReview.dashboardCta")}
            onPress={() => router.push(routes.studentProgress)}
            size={state.gradeBand === "elementary" ? "lg" : "md"}
            variant="secondary"
          />
        </Stack>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
});
