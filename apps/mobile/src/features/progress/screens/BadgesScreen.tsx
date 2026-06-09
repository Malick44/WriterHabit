import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { routes } from "@/core/navigation/routeNames";
import { colors, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { ErrorState, LoadingState } from "@/shared/components/feedback";
import { Inline, PageSection, Screen, Stack } from "@/shared/components/layout";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { BadgeCard } from "../components";
import { useProgressBadges } from "../hooks/useProgress";

export function BadgesScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useProgressBadges();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[state.gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("progress.badges.subtitle")}
      testID="progress-badges-screen"
      title={t("progress.badges.title")}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("progress.badges.loading.accessibility")}
          description={t("progress.badges.loading.description")}
          gradeBand={state.gradeBand}
          label={t("progress.badges.loading.title")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("progress.badges.error.accessibility")}
          description={t("progress.badges.error.description")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("progress.badges.error.title")}
        />
      ) : null}

      {state.status === "success" ? (
        <Stack gap="lg">
          <Card
            accessibilityLabel={buildAccessibilityLabel([
              t("progress.badges.summaryAccessibility"),
              state.badges.filter((badge) => badge.unlocked).length,
            ])}
            gradeBand={state.gradeBand}
            variant="accent"
          >
            <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
              {t("progress.badges.summaryTitle", {
                count: state.badges.filter((badge) => badge.unlocked).length,
                total: state.badges.length,
              })}
            </Text>
            <Text selectable style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}>
              {t("progress.badges.summaryDescription")}
            </Text>
          </Card>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("progress.badges.sections.allSubtitle")}
            title={t("progress.badges.sections.all")}
          >
            <Inline align="stretch" gap="md">
              {state.badges.map((badge) => (
                <View key={badge.id} style={{ flex: 1, minWidth: state.gradeBand === "elementary" ? "100%" : 220 }}>
                  <BadgeCard badge={badge} gradeBand={state.gradeBand} />
                </View>
              ))}
            </Inline>
          </PageSection>

          <Button
            accessibilityHint={t("progress.badges.dashboardHint")}
            accessibilityLabel={t("progress.badges.dashboardAccessibility")}
            gradeBand={state.gradeBand}
            label={t("progress.badges.dashboardCta")}
            onPress={() => router.push(routes.studentProgress)}
            size={state.gradeBand === "elementary" ? "lg" : "md"}
            variant="secondary"
          />
        </Stack>
      ) : null}
    </Screen>
  );
}
