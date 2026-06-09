import { useState } from "react";
import { useRouter } from "expo-router";

import { getAssignmentDetailRoute } from "@/core/navigation/deepLinks";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, OfflineBanner, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import { AssignmentHistoryTabs, AssignmentListCard } from "../components";
import { useAssignmentHistoryData } from "../hooks/useAssignments";
import type { AssignmentHistoryTab } from "../types";

export function AssignmentHistoryScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState<AssignmentHistoryTab>("all");
  const state = useAssignmentHistoryData(selectedTab);

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("assignments.history.subtitle")}
      testID="assignment-history-screen"
      title={t("assignments.history.title")}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("assignments.history.loadingAccessibility")}
          description={t("assignments.history.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("assignments.history.loadingTitle")}
          testID="assignment-history-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("assignments.history.errorAccessibility")}
          description={t("assignments.history.errorDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="assignment-history-error"
          title={t("assignments.history.errorTitle")}
        />
      ) : null}

      {state.status === "empty" || state.status === "success" ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <OfflineBanner
              actionLabel={t("assignments.history.offlineAction")}
              accessibilityLabel={t("assignments.history.offlineAccessibility")}
              description={t("assignments.history.offlineDescription")}
              gradeBand={state.gradeBand}
              isRetrying={state.isRefreshing}
              onRetry={state.refetch}
              title={t("assignments.history.offlineTitle")}
            />
          ) : null}

          <AssignmentHistoryTabs
            counts={state.viewModel.counts}
            gradeBand={state.gradeBand}
            onSelectTab={setSelectedTab}
            selectedTab={selectedTab}
          />

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("assignments.history.listSubtitle")}
            title={t("assignments.history.listTitle")}
          >
            {state.viewModel.assignments.length === 0 ? (
              <EmptyState
                actionLabel={selectedTab === "all" ? t("common.retry") : undefined}
                accessibilityLabel={t("assignments.history.emptyAccessibility")}
                description={
                  selectedTab === "all"
                    ? t("assignments.history.emptyDescription")
                    : t("assignments.history.emptyTabDescription", {
                        tab: t(`assignments.history.tabs.${selectedTab}`),
                      })
                }
                gradeBand={state.gradeBand}
                onActionPress={selectedTab === "all" ? state.refetch : undefined}
                title={
                  selectedTab === "all"
                    ? t("assignments.history.emptyTitle")
                    : t("assignments.history.emptyTabTitle", {
                        tab: t(`assignments.history.tabs.${selectedTab}`),
                      })
                }
              />
            ) : (
              <Stack gap="md">
                {state.viewModel.assignments.map((assignment) => (
                  <AssignmentListCard
                    assignment={assignment}
                    gradeBand={state.gradeBand}
                    key={assignment.id}
                    onPress={() => router.push(getAssignmentDetailRoute(assignment.id))}
                  />
                ))}
                <StatusState
                  accessibilityLabel={t("assignments.history.paginationAccessibility")}
                  description={t("assignments.history.paginationDescription")}
                  gradeBand={state.gradeBand}
                  title={t("assignments.history.paginationTitle")}
                  tone="neutral"
                />
              </Stack>
            )}
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
