import { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { getCanvasDocumentRoute, getCanvasTemplatePickerRoute } from "@/core/navigation/deepLinks";
import { useAuthSession } from "@/core/auth/useAuthSession";
import { colors, spacing, typography, type GradeBand } from "@/design/tokens";
import { EntitlementGate } from "@/features/subscriptions";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, OfflineBanner, useTopAlert } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";
import { BOTTOM_MENU_SCROLL_EVENT_THROTTLE, useBottomMenuScrollHandler } from "@/shared/components/navigation";

import { CanvasDocumentCard } from "../components";
import { useCanvasHomeData } from "../hooks/useCanvas";
import type { CanvasDocumentSummary } from "../types";

function getFallbackGradeBand(gradeLevel?: number): GradeBand {
  return gradeLevel ? typography.getGradeBandForGrade(gradeLevel) : "middle";
}

export function CanvasHomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session } = useAuthSession();
  const topAlert = useTopAlert();
  const gradeBand = getFallbackGradeBand(session?.user.gradeLevel);

  const handleCreate = useCallback(() => {
    topAlert.show({
      descriptionKey: "canvas.home.subtitle",
      titleKey: "canvas.home.title",
      type: "info",
    });
    router.push(getCanvasTemplatePickerRoute());
  }, [router, topAlert]);

  const createButton = (
    <Button
      accessibilityLabel={t("canvas.home.createAccessibility")}
      fullWidth
      gradeBand={gradeBand}
      label={t("canvas.home.createCta")}
      leftAccessory={<Ionicons color={colors.action.primary.foreground} name="add" size={20} />}
      onPress={handleCreate}
      size={gradeBand === "elementary" ? "lg" : "md"}
      testID="canvas-home-create"
    />
  );

  return (
    <Screen
      backgroundColor={colors.gradeBand[gradeBand].background}
      contentStyle={styles.screenContent}
      gradeBand={gradeBand}
      scroll={false}
      subtitle={t("canvas.home.subtitle")}
      testID="canvas-home-screen"
      title={t("canvas.home.title")}
    >
      <Stack gap="lg" style={styles.archiveShell}>
        {createButton}
        <EntitlementGate
          featureId="canvas_archive"
          onContinueFreePress={() => router.push(getCanvasTemplatePickerRoute())}
        >
          <CanvasArchiveList />
        </EntitlementGate>
      </Stack>
    </Screen>
  );
}

function CanvasArchiveList() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useCanvasHomeData();
  const handleBottomMenuScroll = useBottomMenuScrollHandler();

  const renderDocument = useCallback(
    ({ item }: { item: CanvasDocumentSummary }) => (
      <CanvasDocumentCard
        document={item}
        gradeBand={state.gradeBand}
        onOpen={() => router.push(getCanvasDocumentRoute(item.id, item.assignmentId))}
      />
    ),
    [router, state.gradeBand],
  );

  return (
    <Stack gap="lg" style={styles.archiveShell}>
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("canvas.home.loadingAccessibility")}
          description={t("canvas.home.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("canvas.home.loadingTitle")}
          testID="canvas-home-loading"
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("canvas.home.errorAccessibility")}
          description={t("canvas.home.errorDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          testID="canvas-home-error"
          title={t("canvas.home.errorTitle")}
        />
      ) : null}

      {state.status === "empty" ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <OfflineBanner
              actionLabel={t("canvas.home.offlineAction")}
              accessibilityLabel={t("canvas.home.offlineAccessibility")}
              description={t("canvas.home.offlineDescription")}
              gradeBand={state.gradeBand}
              isRetrying={state.isRefreshing}
              onRetry={state.refetch}
              title={t("canvas.home.offlineTitle")}
            />
          ) : null}

          <EmptyState
            actionLabel={t("canvas.home.createCta")}
            accessibilityLabel={t("canvas.home.emptyAccessibility")}
            description={t("canvas.emptyDescription")}
            gradeBand={state.gradeBand}
            onActionPress={() => router.push(getCanvasTemplatePickerRoute())}
            testID="canvas-home-empty"
            title={t("canvas.emptyTitle")}
          />
        </Stack>
      ) : null}

      {state.status === "success" ? (
        <FlatList
          data={state.viewModel.documents}
          keyExtractor={(document) => document.id}
          renderItem={renderDocument}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={styles.listContent}
          onScroll={handleBottomMenuScroll}
          scrollEventThrottle={BOTTOM_MENU_SCROLL_EVENT_THROTTLE}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Stack gap="lg" style={styles.listHeader}>
              {state.viewModel.isOffline ? (
                <OfflineBanner
                  actionLabel={t("canvas.home.offlineAction")}
                  accessibilityLabel={t("canvas.home.offlineAccessibility")}
                  description={t("canvas.home.offlineDescription")}
                  gradeBand={state.gradeBand}
                  isRetrying={state.isRefreshing}
                  onRetry={state.refetch}
                  title={t("canvas.home.offlineTitle")}
                />
              ) : null}

              <PageSection
                gradeBand={state.gradeBand}
                subtitle={t("canvas.home.recentSubtitle")}
                title={t("canvas.home.recentTitle")}
              >
                {null}
              </PageSection>
            </Stack>
          }
          style={styles.archiveList}
        />
      ) : null}
    </Stack>
  );
}

function ItemSeparator() {
  return <View style={styles.itemSeparator} />;
}

const styles = StyleSheet.create({
  archiveList: {
    flex: 1,
  },
  archiveShell: {
    flex: 1,
  },
  itemSeparator: {
    height: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  listHeader: {
    paddingBottom: spacing.md,
  },
  screenContent: {
    flex: 1,
  },
});
