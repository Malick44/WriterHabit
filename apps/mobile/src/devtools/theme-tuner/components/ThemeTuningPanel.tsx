import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { Button } from "@/shared/components/buttons";
import { ThemeTuningPanel as GlacierThemeTuningPanel } from "./GlacierThemeTuningPanel";
import { Modal } from "@/shared/components/modals";
import { useGlacierThemeStore } from "@/shared/theme";

import { useScreenComponents } from "../registry/componentRegistry";
import { hydrateThemeTunerStore, useThemeTunerStore } from "../store/themeTunerStore";
import type { TokenValue } from "../types";
import { ComponentInspector } from "./ComponentInspector";
import { ScreenRegistryView } from "./ScreenRegistryView";
import { TokenEditor } from "./TokenEditor";

function ThemeTuningPanelImpl() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const closePanel = useThemeTunerStore((state) => state.closePanel);
  const isPanelOpen = useThemeTunerStore((state) => state.isPanelOpen);
  const openPanel = useThemeTunerStore((state) => state.openPanel);
  const overrides = useThemeTunerStore((state) => state.overrides);
  const resetAllOverrides = useThemeTunerStore((state) => state.resetAllOverrides);
  const resetScreenOverrides = useThemeTunerStore((state) => state.resetScreenOverrides);
  const resetTokenOverride = useThemeTunerStore((state) => state.resetTokenOverride);
  const screens = useThemeTunerStore((state) => state.screens);
  const selectComponent = useThemeTunerStore((state) => state.selectComponent);
  const selectScreen = useThemeTunerStore((state) => state.selectScreen);
  const selectedComponentId = useThemeTunerStore((state) => state.selectedComponentId);
  const selectedScreenId = useThemeTunerStore((state) => state.selectedScreenId);
  const setTokenOverride = useThemeTunerStore((state) => state.setTokenOverride);
  const [isExportVisible, setIsExportVisible] = useState(false);

  useEffect(() => {
    void hydrateThemeTunerStore();
  }, []);

  const selectedScreen = selectedScreenId ? (screens[selectedScreenId] ?? null) : null;
  const components = useScreenComponents(selectedScreen?.id ?? null);
  const selectedComponent =
    selectedComponentId !== null
      ? (components.find((component) => component.id === selectedComponentId) ?? null)
      : null;
  const screenOverrides = selectedScreen ? (overrides[selectedScreen.id] ?? {}) : {};
  const hasAnyOverrides = Object.keys(overrides).length > 0;

  const visibleTokens = useMemo(() => {
    if (!selectedScreen) {
      return [];
    }

    if (!selectedComponent) {
      return selectedScreen.tokens;
    }

    return selectedScreen.tokens.filter((definition) =>
      (selectedComponent.tokens as readonly string[]).includes(definition.path),
    );
  }, [selectedComponent, selectedScreen]);

  const exportJson = useMemo(
    () => (hasAnyOverrides ? JSON.stringify(overrides, null, 2) : null),
    [hasAnyOverrides, overrides],
  );

  const handleToggleExport = useCallback(() => {
    setIsExportVisible((visible) => {
      if (!visible && exportJson) {
        // Mirrors the JSON to the Metro console so it can be copied from a desktop terminal.
        console.log("[theme-tuner] overrides JSON:\n", exportJson);
      }

      return !visible;
    });
  }, [exportJson]);

  const handleShareExport = useCallback(() => {
    if (exportJson) {
      void Share.share({ message: exportJson });
    }
  }, [exportJson]);

  const handleSetToken = useCallback(
    (path: string, value: TokenValue) => {
      if (selectedScreen) {
        setTokenOverride(selectedScreen.id, path, value);
      }
    },
    [selectedScreen, setTokenOverride],
  );

  const handleOpenLegacyScreen = useCallback(
    (screenId: string) => {
      const glacier = useGlacierThemeStore.getState();

      glacier.setActiveTuningScreen(screenId);

      if (!glacier.isTuningPanelOpen) {
        glacier.toggleTuningPanel();
      }

      closePanel();
    },
    [closePanel],
  );

  const handleClose = useCallback(() => {
    closePanel();
  }, [closePanel]);

  const footer = (
    <View style={styles.footerRow}>
      <Button
        accessibilityLabel={t("themeTuner.inspector.exportAccessibility")}
        label={t(isExportVisible ? "themeTuner.inspector.exportClose" : "themeTuner.inspector.exportLabel")}
        leftAccessory={<Ionicons color={colors.text.primary} name="code-download-outline" size={16} />}
        onPress={handleToggleExport}
        size="sm"
        style={styles.footerButton}
        variant="secondary"
      />
      {selectedScreen && Object.keys(screenOverrides).length > 0 ? (
        <Button
          accessibilityLabel={t("themeTuner.inspector.resetScreenAccessibility")}
          label={t("themeTuner.inspector.resetScreenLabel")}
          onPress={() => resetScreenOverrides(selectedScreen.id)}
          size="sm"
          style={styles.footerButton}
          variant="danger"
        />
      ) : null}
      {hasAnyOverrides ? (
        <Button
          accessibilityLabel={t("themeTuner.inspector.resetAllAccessibility")}
          label={t("themeTuner.inspector.resetAllLabel")}
          onPress={resetAllOverrides}
          size="sm"
          style={styles.footerButton}
          variant="danger"
        />
      ) : null}
    </View>
  );

  return (
    <>
      <Pressable
        accessibilityLabel={t("themeTuner.openAccessibility")}
        accessibilityRole="button"
        onPress={openPanel}
        style={({ pressed }) => [
          styles.floatingTrigger,
          {
            bottom: Math.max(insets.bottom, spacing.lg) + spacing.lg + 64,
            opacity: pressed ? 0.76 : 1,
          },
        ]}
        testID="theme-tuner-floating-button"
      >
        <Ionicons color={colors.text.inverse} name="color-palette" size={22} />
      </Pressable>

      <Modal
        closeAccessibilityLabelKey="themeTuner.closeAccessibility"
        contentContainerStyle={styles.modalContent}
        footer={footer}
        mode="bottomSheet"
        onClose={handleClose}
        panelStyle={styles.modalPanel}
        subtitleKey="themeTuner.inspector.subtitle"
        testID="theme-tuner-modal"
        titleKey="themeTuner.inspector.title"
        visible={isPanelOpen}
      >
        {selectedScreen ? (
          <>
            <Pressable
              accessibilityLabel={t("themeTuner.inspector.backAccessibility")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => selectScreen(null)}
              style={styles.backRow}
            >
              <Ionicons color={colors.text.link} name="chevron-back" size={16} />
              <Text style={styles.backText}>{t("themeTuner.inspector.backLabel")}</Text>
            </Pressable>

            <View style={styles.screenHeading}>
              <Text style={styles.screenName}>{selectedScreen.name}</Text>
              {selectedScreen.route ? (
                <Text selectable style={styles.screenMeta}>
                  {selectedScreen.route}
                </Text>
              ) : null}
            </View>

            <ComponentInspector
              components={components}
              onSelect={selectComponent}
              selectedComponentId={selectedComponentId}
            />

            <Text style={styles.tokensTitle}>{t("themeTuner.inspector.tokensTitle")}</Text>
            {visibleTokens.length === 0 ? (
              <Text style={styles.emptyText}>{t("themeTuner.inspector.noTokens")}</Text>
            ) : (
              visibleTokens.map((definition) => (
                <TokenEditor
                  definition={definition}
                  isOverridden={definition.path in screenOverrides}
                  key={definition.path}
                  onChange={(value) => handleSetToken(definition.path, value)}
                  onReset={() => resetTokenOverride(selectedScreen.id, definition.path)}
                  value={screenOverrides[definition.path] ?? definition.defaultValue}
                />
              ))
            )}
          </>
        ) : (
          <ScreenRegistryView onOpenLegacyScreen={handleOpenLegacyScreen} />
        )}

        {isExportVisible ? (
          <View style={styles.exportBlock}>
            <View style={styles.exportHeader}>
              <Text style={styles.exportTitle}>{t("themeTuner.inspector.exportTitle")}</Text>
              {exportJson ? (
                <Pressable
                  accessibilityLabel={t("themeTuner.inspector.exportShareAccessibility")}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={handleShareExport}
                  style={styles.shareButton}
                >
                  <Ionicons color={colors.text.link} name="share-outline" size={16} />
                  <Text style={styles.shareText}>{t("themeTuner.inspector.exportShare")}</Text>
                </Pressable>
              ) : null}
            </View>
            <Text selectable style={styles.exportJson}>
              {exportJson ?? t("themeTuner.inspector.exportEmpty")}
            </Text>
          </View>
        ) : null}
      </Modal>

      <GlacierThemeTuningPanel showFloatingTrigger={false} />
    </>
  );
}

/**
 * Dev-only floating theme tuner. Renders nothing in production builds even if
 * accidentally mounted without a `__DEV__` guard.
 */
export function ThemeTuningPanel() {
  if (!__DEV__) {
    return null;
  }

  return <ThemeTuningPanelImpl />;
}

const styles = StyleSheet.create({
  backRow: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.xxs,
    minHeight: 28,
  },
  backText: {
    color: colors.text.link,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  exportBlock: {
    backgroundColor: colors.background.subtle,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  exportHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exportJson: {
    color: colors.text.primary,
    fontFamily: "Menlo",
    fontSize: 11,
    lineHeight: 16,
  },
  exportTitle: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  floatingTrigger: {
    alignItems: "center",
    backgroundColor: colors.background.inverse,
    borderRadius: radius.full,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: spacing.lg,
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    width: 48,
    zIndex: 60,
  },
  footerButton: {
    flexBasis: "30%",
    flexGrow: 1,
  },
  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  modalContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  modalPanel: {
    maxHeight: "88%",
  },
  screenHeading: {
    gap: 2,
  },
  screenMeta: {
    color: colors.text.muted,
    fontFamily: "Menlo",
    fontSize: 11,
  },
  screenName: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: "800",
  },
  shareButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxs,
  },
  shareText: {
    color: colors.text.link,
    fontSize: 12,
    fontWeight: "700",
  },
  tokensTitle: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },
});
