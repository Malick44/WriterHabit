import { Text } from "react-native";

import { colors, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Card } from "@/shared/components/cards";
import { EmptyState, ErrorState, LoadingState, StatusState, SuccessState } from "@/shared/components/feedback";
import { CheckboxRow, ChoiceCard } from "@/shared/components/forms";
import { PageSection, Screen, Stack } from "@/shared/components/layout";
import {
  buildAccessibilityLabel,
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import { useParentSettingsData } from "../hooks/useParent";

export function ParentSettingsScreen() {
  const { t } = useI18n();
  const state = useParentSettingsData();
  const { settings } = useAccessibilityContext();
  const type = typography.gradeBands[state.gradeBand];
  const accessibleColors = getAccessibleColors(settings);

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("parent.settings.subtitle")}
      testID="parent-settings-screen"
      title={t("parent.settings.title")}
    >
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
          ) : (
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
          )}

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
                onPress={() => state.updateSetting("aiCoachAccess", "hints_and_revision")}
                selected={state.viewModel.settings.aiCoachAccess === "hints_and_revision"}
              />
              <ChoiceCard
                accessibilityLabel={t("parent.settings.aiCoachAccess.restrictedAccessibility")}
                description={t("parent.settings.aiCoachAccess.restrictedDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.aiCoachAccess.restricted")}
                onPress={() => state.updateSetting("aiCoachAccess", "restricted")}
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
              <CheckboxRow
                accessibilityLabel={t("parent.settings.weeklyEmailAccessibility")}
                checked={state.viewModel.settings.weeklyReportEmailEnabled}
                description={t("parent.settings.weeklyEmailDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.weeklyEmailLabel")}
                onPress={() =>
                  state.updateSetting(
                    "weeklyReportEmailEnabled",
                    !state.viewModel.settings.weeklyReportEmailEnabled,
                  )
                }
              />
              <CheckboxRow
                accessibilityLabel={t("parent.settings.assignmentAlertsAccessibility")}
                checked={state.viewModel.settings.assignmentAlertsEnabled}
                description={t("parent.settings.assignmentAlertsDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.assignmentAlertsLabel")}
                onPress={() =>
                  state.updateSetting(
                    "assignmentAlertsEnabled",
                    !state.viewModel.settings.assignmentAlertsEnabled,
                  )
                }
              />
              <CheckboxRow
                accessibilityLabel={t("parent.settings.practiceReminderAccessibility")}
                checked={state.viewModel.settings.practiceReminderEnabled}
                description={t("parent.settings.practiceReminderDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.practiceReminderLabel")}
                onPress={() =>
                  state.updateSetting(
                    "practiceReminderEnabled",
                    !state.viewModel.settings.practiceReminderEnabled,
                  )
                }
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
                onPress={() => state.updateSetting("digestFrequency", "weekly")}
                selected={state.viewModel.settings.digestFrequency === "weekly"}
              />
              <ChoiceCard
                accessibilityLabel={t("parent.settings.digestTwiceWeeklyAccessibility")}
                description={t("parent.settings.digestTwiceWeeklyDescription")}
                gradeBand={state.gradeBand}
                label={t("parent.settings.digestTwiceWeeklyLabel")}
                onPress={() => state.updateSetting("digestFrequency", "twice_weekly")}
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
                  state.updateSetting(
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
        </Stack>
      ) : null}
    </Screen>
  );
}
