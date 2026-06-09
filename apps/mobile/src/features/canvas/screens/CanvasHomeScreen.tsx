import { useRouter } from "expo-router";

import { getCanvasDocumentRoute, getCanvasTemplatePickerRoute } from "@/core/navigation/deepLinks";
import { colors } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import { CanvasDocumentCard } from "../components";
import { useCanvasHomeData } from "../hooks/useCanvas";

export function CanvasHomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const state = useCanvasHomeData();

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      gradeBand={state.gradeBand}
      subtitle={t("canvas.home.subtitle")}
      testID="canvas-home-screen"
      title={t("canvas.home.title")}
    >
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
        <EmptyState
          actionLabel={t("canvas.home.createCta")}
          accessibilityLabel={t("canvas.home.emptyAccessibility")}
          description={t("canvas.emptyDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.push(getCanvasTemplatePickerRoute())}
          testID="canvas-home-empty"
          title={t("canvas.emptyTitle")}
        />
      ) : null}

      {state.status === "success" ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <StatusState
              actionLabel={t("canvas.home.offlineAction")}
              accessibilityLabel={t("canvas.home.offlineAccessibility")}
              description={t("canvas.home.offlineDescription")}
              gradeBand={state.gradeBand}
              onActionPress={state.refetch}
              title={t("canvas.home.offlineTitle")}
              tone="warning"
            />
          ) : null}

          <Button
            accessibilityLabel={t("canvas.home.createAccessibility")}
            gradeBand={state.gradeBand}
            label={t("canvas.home.createCta")}
            onPress={() => router.push(getCanvasTemplatePickerRoute())}
            size={state.gradeBand === "elementary" ? "lg" : "md"}
          />

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("canvas.home.recentSubtitle")}
            title={t("canvas.home.recentTitle")}
          >
            <Stack gap="md">
              {state.viewModel.documents.map((document) => (
                <CanvasDocumentCard
                  document={document}
                  gradeBand={state.gradeBand}
                  key={document.id}
                  onOpen={() => router.push(getCanvasDocumentRoute(document.id, document.assignmentId))}
                />
              ))}
            </Stack>
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
