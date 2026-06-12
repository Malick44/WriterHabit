import { useCallback, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { getAssignmentDetailRoute } from "@/core/navigation/deepLinks";
import { colors, spacing } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { EmptyState, ErrorState, LoadingState, OfflineBanner, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";
import {
  AppHeader,
  BOTTOM_MENU_SCROLL_EVENT_THROTTLE,
  useBottomMenuScrollHandler,
} from "@/shared/components/navigation";

import { AssignmentHistoryTabs, AssignmentListCard } from "../components";
import { useAssignmentHistoryData } from "../hooks/useAssignments";
import type { AssignmentHistoryTab, AssignmentRecord } from "../types";

export function AssignmentHistoryScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState<AssignmentHistoryTab>("all");
  const state = useAssignmentHistoryData(selectedTab);
  const handleBottomMenuScroll = useBottomMenuScrollHandler();

  const renderAssignment = useCallback(
    ({ item }: { item: AssignmentRecord }) => (
      <AssignmentListCard
        assignment={item}
        gradeBand={state.gradeBand}
        onPress={() => router.push(getAssignmentDetailRoute(item.id))}
      />
    ),
    [router, state.gradeBand],
  );

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      scroll={false}
      testID="assignment-history-screen"
    >
      <AppHeader
        gradeBand={state.gradeBand}
        showSafeArea={false}
        style={styles.header}
        subtitleKey="assignments.history.subtitle"
        titleKey="assignments.history.title"
        variant="transparent"
      />

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
        <FlatList
          data={state.viewModel.assignments}
          keyExtractor={(assignment) => assignment.id}
          renderItem={renderAssignment}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={styles.listContent}
          onScroll={handleBottomMenuScroll}
          scrollEventThrottle={BOTTOM_MENU_SCROLL_EVENT_THROTTLE}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Stack gap="lg" style={styles.listHeader}>
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
                {null}
              </PageSection>
            </Stack>
          }
          ListEmptyComponent={
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
          }
          ListFooterComponent={
            state.viewModel.assignments.length > 0 ? (
              <View style={styles.listFooter}>
                <StatusState
                  accessibilityLabel={t("assignments.history.paginationAccessibility")}
                  description={t("assignments.history.paginationDescription")}
                  gradeBand={state.gradeBand}
                  title={t("assignments.history.paginationTitle")}
                  tone="neutral"
                />
              </View>
            ) : null
          }
        />
      ) : null}
    </Screen>
  );
}

function ItemSeparator() {
  return <View style={styles.itemSeparator} />;
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  itemSeparator: {
    height: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  listFooter: {
    paddingTop: spacing.md,
  },
  listHeader: {
    paddingBottom: spacing.md,
  },
});
