import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors, typography } from "@/design/tokens";
import { useI18n, type TranslationKey } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { EmptyState, ErrorState, LoadingState , ProgressBar } from "@/shared/components/feedback";
import { Inline, PageSection, Screen, Stack } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useProgressSkill } from "../hooks/useProgress";

function getParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function SkillDetailScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ skillId?: string | string[] }>();
  const skillId = getParamValue(params.skillId);
  const state = useProgressSkill(skillId);
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[state.gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const headerTitleKey: TranslationKey =
    state.status === "success" ? "progress.skillDetail.titleWithSkill" : "progress.skillDetail.title";
  const headerTitleParams = state.status === "success" ? { skill: t(state.skill.labelKey) } : undefined;

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      testID="progress-skill-detail-screen"
    >
      <AppHeader
        gradeBand={state.gradeBand}
        leftAction={{
          accessibilityLabelKey: "common.back",
          type: "back",
        }}
        showSafeArea={false}
        style={styles.header}
        subtitleKey="progress.skillDetail.subtitle"
        titleKey={headerTitleKey}
        titleParams={headerTitleParams}
        variant="transparent"
      />

      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("progress.skillDetail.loading.accessibility")}
          description={t("progress.skillDetail.loading.description")}
          gradeBand={state.gradeBand}
          label={t("progress.skillDetail.loading.title")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("progress.skillDetail.error.accessibility")}
          description={t("progress.skillDetail.error.description")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("progress.skillDetail.error.title")}
        />
      ) : null}

      {state.status === "missing" ? (
        <EmptyState
          actionLabel={t("progress.skillDetail.missing.action")}
          accessibilityLabel={t("progress.skillDetail.missing.accessibility")}
          description={t("progress.skillDetail.missing.description")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.replace(routes.studentProgress)}
          title={t("progress.skillDetail.missing.title")}
        />
      ) : null}

      {state.status === "success" ? (
        <Stack gap="lg">
          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("progress.skillDetail.sections.scoreSubtitle")}
            title={t("progress.skillDetail.sections.score")}
          >
            <Card
              accessibilityLabel={buildAccessibilityLabel([
                t(state.skill.labelKey),
                t("progress.skills.scoreAccessibility"),
              ])}
              gradeBand={state.gradeBand}
            >
              <Stack gap="md">
                <Inline align="flex-start" justify="space-between">
                  <Stack gap="xs" style={{ flex: 1, minWidth: 180 }}>
                    <Text selectable style={[getAccessibleTextStyle(type.label, settings), { color: accessibleColors.mutedText }]}>
                      {t("progress.skillDetail.currentScoreLabel")}
                    </Text>
                    <Text
                      selectable
                      style={[
                        getAccessibleTextStyle(type.metric, settings),
                        { color: colors.gradeBand[state.gradeBand].accentStrong, fontVariant: ["tabular-nums"] },
                      ]}
                    >
                      {t("progress.skillDetail.scoreValue", { count: state.skill.currentScore })}
                    </Text>
                  </Stack>
                  {state.dashboard.gradeAdaptation.showDetailedSkillDeltas ? (
                    <Text
                      selectable
                      style={[
                        getAccessibleTextStyle(type.caption, settings),
                        {
                          color: state.skill.weeklyDelta > 0 ? colors.text.success : colors.text.muted,
                          fontVariant: ["tabular-nums"],
                        },
                      ]}
                    >
                      {state.skill.weeklyDelta > 0
                        ? t("progress.skills.deltaPositive", { count: state.skill.weeklyDelta })
                        : t("progress.skills.deltaFlat")}
                    </Text>
                  ) : null}
                </Inline>
                <ProgressBar
                  gradeBand={state.gradeBand}
                  label={buildAccessibilityLabel([t(state.skill.labelKey), t("progress.skills.scoreAccessibility")])}
                  showValue={state.gradeBand !== "elementary"}
                  value={state.skill.progressValue}
                />
              </Stack>
            </Card>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("progress.skillDetail.sections.practiceSubtitle")}
            title={t("progress.skillDetail.sections.practice")}
          >
            <Inline align="stretch" gap="md">
              {[
                {
                  label: t("progress.skillDetail.practice.minutes"),
                  value: t("common.minutes", { count: state.skill.minutesPracticed }),
                },
                {
                  label: t("progress.skillDetail.practice.words"),
                  value: t("progress.metrics.wordsWritten.value", { count: state.skill.wordsWritten }),
                },
                {
                  label: t("progress.skillDetail.practice.revisions"),
                  value: t("progress.metrics.revisionsCompleted.value", { count: state.skill.revisionsCompleted }),
                },
                {
                  label: t("progress.skillDetail.practice.feedback"),
                  value: t("progress.metrics.aiFeedbackApplied.value", { count: state.skill.aiFeedbackApplied }),
                },
              ].map((item) => (
                <View key={item.label} style={{ flex: 1, minWidth: state.gradeBand === "elementary" ? "100%" : 160 }}>
                  <Card accessibilityLabel={buildAccessibilityLabel([item.label, item.value])} gradeBand={state.gradeBand}>
                    <Text selectable style={[getAccessibleTextStyle(type.caption, settings), { color: accessibleColors.mutedText }]}>
                      {item.label}
                    </Text>
                    <Text
                      selectable
                      style={[
                        getAccessibleTextStyle(type.title, settings),
                        { color: accessibleColors.text, fontVariant: ["tabular-nums"] },
                      ]}
                    >
                      {item.value}
                    </Text>
                  </Card>
                </View>
              ))}
            </Inline>
          </PageSection>

          {state.dashboard.gradeAdaptation.showRubricTrend ? (
            <PageSection
              gradeBand={state.gradeBand}
              subtitle={t("progress.skillDetail.sections.rubricSubtitle")}
              title={t("progress.skillDetail.sections.rubric")}
            >
              <Card gradeBand={state.gradeBand}>
                <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
                  {t("progress.skillDetail.rubricImprovement", { count: state.skill.rubricImprovement })}
                </Text>
              </Card>
            </PageSection>
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("progress.skillDetail.sections.nextStepSubtitle")}
            title={t("progress.skillDetail.sections.nextStep")}
          >
            <Card gradeBand={state.gradeBand} variant="accent">
              <Text selectable style={[getAccessibleTextStyle(type.body, settings), { color: accessibleColors.text }]}>
                {t(state.skill.nextStepKey)}
              </Text>
            </Card>
          </PageSection>

          <Button
            accessibilityHint={t("progress.skillDetail.dashboardHint")}
            accessibilityLabel={t("progress.skillDetail.dashboardAccessibility")}
            gradeBand={state.gradeBand}
            label={t("progress.skillDetail.dashboardCta")}
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
