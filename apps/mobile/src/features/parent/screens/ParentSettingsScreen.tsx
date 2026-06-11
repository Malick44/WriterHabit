import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { routes } from "@/core/navigation/routeNames";
import { colors, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { Card } from "@/shared/components/cards";
import { EmptyState, ErrorState, LoadingState, StatusState, SuccessState } from "@/shared/components/feedback";
import { CheckboxRow, ChoiceCard, SettingsToggleRow } from "@/shared/components/forms";
import { PageSection, Screen, Stack } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/navigation";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useParentSettingsData } from "../hooks/useParent";
import type { ParentSettings } from "../types";

const SAVED_BANNER_DURATION_MS = 2500;

export function ParentSettingsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { signOut } = useAuthSession();
  const state = useParentSettingsData();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[state.gradeBand];
  const accessibleColors = getAccessibleColors(settings);
  const isSaving = state.status === "success" && state.isSaving;
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const wasSavingRef = useRef(false);

  useEffect(() => {
    const wasSaving = wasSavingRef.current;

    wasSavingRef.current = isSaving;

    if (!wasSaving || isSaving) {
      return undefined;
    }

    setShowSavedBanner(true);
    const timeout = setTimeout(() => {
      setShowSavedBanner(false);
    }, SAVED_BANNER_DURATION_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [isSaving]);

  const handleOpenPaywall = useCallback(() => {
    router.push(routes.paywall);
  }, [router]);

  const handleSignOut = useCallback(() => {
    void signOut().then(() => {
      router.replace(routes.authWelcome);
    });
  }, [router, signOut]);

  const handleUpdateSetting = <Key extends keyof ParentSettings>(key: Key, value: ParentSettings[Key]) => {
    if (state.status === "success") {
      state.updateSetting(key, value);
    }
  };

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      testID="parent-settings-screen"
    >
      <AppHeader
        gradeBand={state.gradeBand}
        showSafeArea={false}
        style={styles.header}
        subtitleKey="parent.settings.subtitle"
        titleKey="parent.settings.title"
        variant="transparent"
      />

      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("parent.loading.settingsAccessibility")}
          description={t("parent.loading.settingsDescription")}
          gradeBand={state.gradeBand}
          label={t("parent.loading.settingsTitle")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("parent.error.settingsAccessibility")}
          description={t("parent.error.settingsDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("parent.error.settingsTitle")}
        />
      ) : null}

      {state.status === "success" ? (
        <Stack gap="lg">
          {state.viewModel.connectionStatus === "offline_cached" ? (
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

          {state.viewModel.linkedStudents.length === 0 ? (
            <EmptyState
              accessibilityLabel={t("parent.empty.settingsAccessibility")}
              description={t("parent.empty.settingsDescription")}
              gradeBand={state.gradeBand}
              title={t("parent.empty.settingsTitle")}
            />
          ) : null}

          {state.viewModel.linkedStudents.length > 0 && (state.isSaving || showSavedBanner) ? (
            <SuccessState
              accessibilityLabel={t("parent.settings.savedAccessibility")}
              description={
                state.isSaving
                  ? t("parent.settings.savingDescription")
                  : t("parent.settings.savedDescription")
              }
              gradeBand={state.gradeBand}
              title={state.isSaving ? t("parent.settings.savingTitle") : t("parent.settings.savedTitle")}
            />
          ) : null}

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.settings.aiSubtitle")}
            title={t("parent.settings.aiTitle")}
          >
            <Stack gap="md">
              <ChoiceCard
                accessibilityLabel={t("parent.settings.aiCoachAccess.allowedAccessibility")}
                description={t("parent.settings.aiCoachAccess.allowedDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.aiCoachAccess.allowed")}
                onPress={() => handleUpdateSetting("aiCoachAccess", "hints_and_revision")}
                selected={state.viewModel.settings.aiCoachAccess === "hints_and_revision"}
              />
              <ChoiceCard
                accessibilityLabel={t("parent.settings.aiCoachAccess.restrictedAccessibility")}
                description={t("parent.settings.aiCoachAccess.restrictedDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.aiCoachAccess.restricted")}
                onPress={() => handleUpdateSetting("aiCoachAccess", "restricted")}
                selected={state.viewModel.settings.aiCoachAccess === "restricted"}
              />
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.settings.notificationsSubtitle")}
            title={t("parent.settings.notificationsTitle")}
          >
            <Stack gap="sm">
              <SettingsToggleRow
                description={t("parent.settings.weeklyEmailDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.weeklyEmailLabel")}
                onValueChange={(value) => handleUpdateSetting("weeklyReportEmailEnabled", value)}
                value={state.viewModel.settings.weeklyReportEmailEnabled}
                variant="outlined"
              />
              <SettingsToggleRow
                description={t("parent.settings.assignmentAlertsDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.assignmentAlertsLabel")}
                onValueChange={(value) => handleUpdateSetting("assignmentAlertsEnabled", value)}
                value={state.viewModel.settings.assignmentAlertsEnabled}
                variant="outlined"
              />
              <SettingsToggleRow
                description={t("parent.settings.practiceReminderDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.practiceReminderLabel")}
                onValueChange={(value) => handleUpdateSetting("practiceReminderEnabled", value)}
                value={state.viewModel.settings.practiceReminderEnabled}
                variant="outlined"
              />
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.settings.digestSubtitle")}
            title={t("parent.settings.digestTitle")}
          >
            <Stack gap="md">
              <ChoiceCard
                accessibilityLabel={t("parent.settings.digestWeeklyAccessibility")}
                description={t("parent.settings.digestWeeklyDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.digestWeeklyLabel")}
                onPress={() => handleUpdateSetting("digestFrequency", "weekly")}
                selected={state.viewModel.settings.digestFrequency === "weekly"}
              />
              <ChoiceCard
                accessibilityLabel={t("parent.settings.digestTwiceWeeklyAccessibility")}
                description={t("parent.settings.digestTwiceWeeklyDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.digestTwiceWeeklyLabel")}
                onPress={() => handleUpdateSetting("digestFrequency", "twice_weekly")}
                selected={state.viewModel.settings.digestFrequency === "twice_weekly"}
              />
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.settings.sharingSubtitle")}
            title={t("parent.settings.sharingTitle")}
          >
            <Stack gap="md">
              <CheckboxRow
                accessibilityLabel={t("parent.settings.teacherShareAccessibility")}
                checked={state.viewModel.settings.shareWeeklySummaryWithTeacher}
                description={t("parent.settings.teacherShareDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.teacherShareLabel")}
                onPress={() =>
                  handleUpdateSetting(
                    "shareWeeklySummaryWithTeacher",
                    !state.viewModel.settings.shareWeeklySummaryWithTeacher,
                  )
                }
              />
              <Card
                accessibilityLabel={buildAccessibilityLabel([
                  t("parent.settings.quietHoursAccessibility"),
                  state.viewModel.settings.quietHoursLabel,
                ])}
                gradeBand={state.gradeBand}
              >
                <Stack gap="xs">
                  <Text selectable style={[getAccessibleTextStyle(type.title, settings), { color: accessibleColors.text }]}>
                    {t("parent.settings.quietHoursTitle")}
                  </Text>
                  <Text
                    selectable
                    style={[getAccessibleTextStyle(type.bodySmall, settings), { color: accessibleColors.mutedText }]}
                  >
                    {t("parent.settings.quietHoursDescription", {
                      quietHours: state.viewModel.settings.quietHoursLabel,
                    })}
                  </Text>
                </Stack>
              </Card>
            </Stack>
          </PageSection>

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("parent.settings.accountSubtitle")}
            title={t("parent.settings.accountTitle")}
          >
            <Stack gap="md">
              <Card
                accessibilityHint={t("parent.settings.upgradeHint")}
                accessibilityLabel={t("parent.settings.upgradeAccessibility")}
                gradeBand={state.gradeBand}
                onPress={handleOpenPaywall}
                subtitle={t("parent.settings.upgradeDescription")}
                testID="parent-settings-upgrade"
                title={t("parent.settings.upgradeTitle")}
              >
                <Text
                  selectable
                  style={[getAccessibleTextStyle(type.bodyStrong, settings), { color: accessibleColors.actionBackground }]}
                >
                  {t("parent.settings.upgradeCta")}
                </Text>
              </Card>
              <Button
                accessibilityLabel={t("parent.settings.signOutAccessibility")}
                fullWidth
                label={t("parent.settings.signOut")}
                onPress={handleSignOut}
                testID="parent-settings-sign-out"
                variant="danger"
              />
            </Stack>
          </PageSection>
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
