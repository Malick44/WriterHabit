import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";

import { getAssignmentDetailRoute } from "@/core/navigation/deepLinks";
import { routes } from "@/core/navigation/routeNames";
import { spacing } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineBanner,
} from "@/shared/components/feedback";
import { ComposerSurface, Screen, Stack } from "@/shared/components/layout";
import {
  AppHeader,
  BOTTOM_MENU_SCROLL_EVENT_THROTTLE,
  useBottomMenuScrollHandler,
} from "@/shared/components/navigation";
import { getResponsiveColumnCount } from "@/shared/utils/responsive";

import {
  AssignmentFilterChips,
  AssignmentSummaryCard,
  type AssignmentListFilter,
} from "../components";
import { useAssignmentHistoryData } from "../hooks/useAssignments";
import type { AssignmentRecord, AssignmentStatus } from "../types";

function matchesFilter(
  status: AssignmentStatus,
  filter: AssignmentListFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "active":
      return (
        status === "not_started" ||
        status === "in_progress" ||
        status === "revision_in_progress" ||
        status === "submitted" ||
        status === "reviewing"
      );
    case "feedback":
      return status === "feedback_ready";
    case "completed":
      return status === "completed";
  }
}

export function AssignmentHistoryScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const [selectedFilter, setSelectedFilter] =
    useState<AssignmentListFilter>("all");
  const state = useAssignmentHistoryData("all");
  const handleBottomMenuScroll = useBottomMenuScrollHandler();
  const columnCount = getResponsiveColumnCount(width, { maxColumns: 2, minColumnWidth: 400 });
  const handleStartPractice = useCallback(() => {
    router.navigate(routes.studentPractice);
  }, [router]);

  const assignments =
    state.status === "success" || state.status === "empty"
      ? state.viewModel.assignments
      : null;
  const filteredAssignments = useMemo(
    () =>
      assignments
        ? assignments.filter((assignment) =>
            matchesFilter(assignment.status, selectedFilter),
          )
        : [],
    [assignments, selectedFilter],
  );

  const renderAssignment = useCallback(
    ({ item }: { item: AssignmentRecord }) => (
      <View style={styles.gridItem}>
        <AssignmentSummaryCard
          assignment={item}
          gradeBand={state.gradeBand}
          onPress={() => router.push(getAssignmentDetailRoute(item.id))}
        />
      </View>
    ),
    [router, state.gradeBand],
  );

  return (
    <ComposerSurface>
      <Screen
        backgroundColor="transparent"
        gradeBand={state.gradeBand}
        scroll={false}
        testID="assignment-history-screen"
      >
        <AppHeader
          gradeBand={state.gradeBand}
          leftAction={{
            accessibilityLabelKey: "assignments.history.backAccessibility",
            type: "back",
          }}
          showSafeArea={false}
          style={styles.header}
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
            key={`assignment-history-${columnCount}`}
            data={filteredAssignments}
            keyExtractor={(assignment) => assignment.id}
            renderItem={renderAssignment}
            numColumns={columnCount}
            columnWrapperStyle={columnCount > 1 ? styles.columnWrapper : undefined}
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
                    accessibilityLabel={t(
                      "assignments.history.offlineAccessibility",
                    )}
                    description={t("assignments.history.offlineDescription")}
                    gradeBand={state.gradeBand}
                    isRetrying={state.isRefreshing}
                    onRetry={state.refetch}
                    title={t("assignments.history.offlineTitle")}
                  />
                ) : null}

                <AssignmentFilterChips
                  gradeBand={state.gradeBand}
                  onSelect={setSelectedFilter}
                  selected={selectedFilter}
                />
              </Stack>
            }
            ListEmptyComponent={
              <EmptyState
                actionLabel={
                  selectedFilter === "all"
                    ? t("assignments.history.emptyActionLabel")
                    : undefined
                }
                accessibilityLabel={t("assignments.history.emptyAccessibility")}
                description={
                  selectedFilter === "all"
                    ? t("assignments.history.emptyDescription")
                    : t("assignments.history.emptyTabDescription", {
                        tab: t(`assignments.history.filters.${selectedFilter}`),
                      })
                }
                gradeBand={state.gradeBand}
                onActionPress={
                  selectedFilter === "all" ? handleStartPractice : undefined
                }
                title={
                  selectedFilter === "all"
                    ? t("assignments.history.emptyTitle")
                    : t("assignments.history.emptyTabTitle", {
                        tab: t(`assignments.history.filters.${selectedFilter}`),
                      })
                }
              />
            }
          />
        ) : null}
      </Screen>
    </ComposerSurface>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  columnWrapper: {
    gap: spacing.md,
  },
  gridItem: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
  },
  listHeader: {
    paddingBottom: spacing.md,
  },
  separator: {
    height: spacing.md,
  },
});
