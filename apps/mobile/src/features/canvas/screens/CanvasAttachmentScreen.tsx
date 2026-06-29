import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getCanvasDocumentRoute, getCanvasCreateRoute } from "@/core/navigation/deepLinks";
import { colors, shadows, spacing, typography } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { EmptyState, ErrorState, LoadingState, StatusState } from "@/shared/components/feedback";
import { PageSection, Screen, Stack } from "@/shared/components/layout";

import { CanvasSelectableDocumentCard } from "../components";
import { useCanvasHomeData } from "../hooks/useCanvas";

export function CanvasAttachmentScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const state = useCanvasHomeData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const documents = state.status === "success" ? state.viewModel.documents : [];
  const effectiveSelectedId = selectedId ?? documents[0]?.id ?? null;
  const selectedDocument = documents.find((document) => document.id === effectiveSelectedId) ?? null;
  const type = typography.gradeBands[state.gradeBand];

  const footer =
    state.status === "success" && selectedDocument ? (
      <View
        style={{
          backgroundColor: colors.background.surface,
          borderTopColor: colors.border.default,
          borderTopWidth: 1,
          gap: spacing.sm,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          ...shadows.floating,
        }}
      >
        <Text selectable style={[type.caption, { color: colors.text.muted, textAlign: "center" }]}>
          {t("canvas.attachment.selectedCount", { count: 1 })}
        </Text>
        <Button
          accessibilityLabel={t("canvas.attachment.openSelectedCta")}
          fullWidth
          gradeBand={state.gradeBand}
          label={t("canvas.attachment.openSelectedCta")}
          onPress={() => router.push(getCanvasDocumentRoute(selectedDocument.id, selectedDocument.assignmentId))}
          size={state.gradeBand === "elementary" ? "lg" : "md"}
          testID="canvas-attachment-confirm"
        />
      </View>
    ) : undefined;

  return (
    <Screen
      backgroundColor={colors.gradeBand[state.gradeBand].background}
      footer={footer}
      gradeBand={state.gradeBand}
      subtitle={t("canvas.attachment.subtitle")}
      testID="canvas-attachment-screen"
      title={t("canvas.attachment.title")}
    >
      {state.status === "loading" ? (
        <LoadingState
          accessibilityLabel={t("canvas.attachment.loadingAccessibility")}
          description={t("canvas.home.loadingDescription")}
          gradeBand={state.gradeBand}
          label={t("canvas.home.loadingTitle")}
        />
      ) : null}

      {state.status === "error" ? (
        <ErrorState
          actionLabel={t("common.retry")}
          accessibilityLabel={t("canvas.attachment.errorAccessibility")}
          description={t("canvas.home.errorDescription")}
          gradeBand={state.gradeBand}
          onActionPress={state.refetch}
          title={t("canvas.home.errorTitle")}
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          actionLabel={t("canvas.home.createCta")}
          accessibilityLabel={t("canvas.attachment.emptyAccessibility")}
          description={t("canvas.attachment.emptyDescription")}
          gradeBand={state.gradeBand}
          onActionPress={() => router.push(getCanvasCreateRoute())}
          title={t("canvas.emptyTitle")}
        />
      ) : null}

      {state.status === "success" ? (
        <Stack gap="lg">
          {state.viewModel.isOffline ? (
            <StatusState
              accessibilityLabel={t("canvas.home.offlineAccessibility")}
              description={t("canvas.home.offlineDescription")}
              gradeBand={state.gradeBand}
              title={t("canvas.home.offlineTitle")}
              tone="warning"
            />
          ) : null}

          <StatusState
            accessibilityLabel={t("canvas.attachment.infoTitle")}
            description={t("canvas.attachment.infoDescription")}
            gradeBand={state.gradeBand}
            title={t("canvas.attachment.infoTitle")}
            tone="info"
          />

          <PageSection
            gradeBand={state.gradeBand}
            subtitle={t("canvas.attachment.sectionSubtitle")}
            title={t("canvas.attachment.sectionTitle")}
          >
            <Stack gap="md">
              {documents.map((document) => (
                <CanvasSelectableDocumentCard
                  document={document}
                  gradeBand={state.gradeBand}
                  key={document.id}
                  onSelect={() => setSelectedId(document.id)}
                  selected={document.id === effectiveSelectedId}
                />
              ))}
            </Stack>
          </PageSection>
        </Stack>
      ) : null}
    </Screen>
  );
}
