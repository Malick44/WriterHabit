import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radius, spacing } from "@/design/tokens";
import { useI18n } from "@/i18n";
import { useGlacierThemeStore } from "@/shared/theme";

import { useThemeTunerStore } from "../store/themeTunerStore";

interface ScreenRegistryViewProps {
  onOpenLegacyScreen: (screenId: string) => void;
}

export const ScreenRegistryView = memo(function ScreenRegistryView({
  onOpenLegacyScreen,
}: ScreenRegistryViewProps) {
  const { t } = useI18n();
  const activeScreenId = useThemeTunerStore((state) => state.activeScreenId);
  const overrides = useThemeTunerStore((state) => state.overrides);
  const screens = useThemeTunerStore((state) => state.screens);
  const selectScreen = useThemeTunerStore((state) => state.selectScreen);
  const legacyScreens = useGlacierThemeStore((state) => state.screenTuningRegistry);

  const sortedScreens = useMemo(
    () => Object.values(screens).sort((a, b) => a.name.localeCompare(b.name)),
    [screens],
  );
  const legacyConfigs = Object.values(legacyScreens);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t("themeTuner.inspector.screensTitle")}</Text>

      {sortedScreens.length === 0 ? (
        <Text style={styles.emptyText}>{t("themeTuner.inspector.screensEmpty")}</Text>
      ) : (
        sortedScreens.map((screen) => {
          const overrideCount = Object.keys(overrides[screen.id] ?? {}).length;
          const meta = [screen.route, screen.feature].filter(Boolean).join("  ·  ");

          return (
            <Pressable
              accessibilityLabel={t("themeTuner.inspector.selectScreenAccessibility", { name: screen.name })}
              accessibilityRole="button"
              key={screen.id}
              onPress={() => selectScreen(screen.id)}
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
            >
              <View style={styles.rowCopy}>
                <View style={styles.rowTitleLine}>
                  <Text numberOfLines={1} style={styles.rowTitle}>
                    {screen.name}
                  </Text>
                  {screen.id === activeScreenId ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>{t("themeTuner.inspector.activeBadge")}</Text>
                    </View>
                  ) : null}
                  {overrideCount > 0 ? (
                    <View style={styles.editedBadge}>
                      <Text style={styles.editedBadgeText}>
                        {t("themeTuner.inspector.editedBadge", { count: overrideCount })}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {meta ? (
                  <Text numberOfLines={1} style={styles.rowMeta}>
                    {meta}
                  </Text>
                ) : null}
              </View>
              <Ionicons color={colors.text.muted} name="chevron-forward" size={18} />
            </Pressable>
          );
        })
      )}

      {legacyConfigs.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>{t("themeTuner.inspector.legacyTitle")}</Text>
          <Text style={styles.emptyText}>{t("themeTuner.inspector.legacyHint")}</Text>
          {legacyConfigs.map((config) => (
            <Pressable
              accessibilityLabel={t("themeTuner.inspector.selectScreenAccessibility", {
                name: t(config.titleKey),
              })}
              accessibilityRole="button"
              key={config.id}
              onPress={() => onOpenLegacyScreen(config.id)}
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
            >
              <View style={styles.rowCopy}>
                <Text numberOfLines={1} style={styles.rowTitle}>
                  {t(config.titleKey)}
                </Text>
                <Text numberOfLines={1} style={styles.rowMeta}>
                  {config.routePattern}
                </Text>
              </View>
              <Ionicons color={colors.text.muted} name="open-outline" size={18} />
            </Pressable>
          ))}
        </>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  activeBadge: {
    backgroundColor: colors.feedback.success.background,
    borderColor: colors.feedback.success.border,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: colors.feedback.success.text,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  container: {
    gap: spacing.sm,
  },
  editedBadge: {
    backgroundColor: colors.feedback.info.background,
    borderColor: colors.feedback.info.border,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  editedBadgeText: {
    color: colors.feedback.info.text,
    fontSize: 10,
    fontWeight: "700",
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  rowMeta: {
    color: colors.text.muted,
    fontFamily: "Menlo",
    fontSize: 11,
  },
  rowPressed: {
    backgroundColor: colors.background.subtle,
  },
  rowTitle: {
    color: colors.text.primary,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  rowTitleLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },
});
