import { Ionicons } from "@expo/vector-icons";
import { I18nManager, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleHitSlop,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasSyncStatus } from "../types";
import { AutosavePill } from "./AutosavePill";

interface CanvasHeaderProps {
  assignmentTitle: string;
  canAttach: boolean;
  gradeBand: GradeBand;
  isAttaching: boolean;
  onAttach: () => void;
  onBack: () => void;
  pageCount: number;
  paddingTop: number;
  syncStatus: CanvasSyncStatus;
}

/**
 * Minimal canvas header: back button, a compact assignment chip, the autosave
 * confidence pill, optional page indicator, and an attach affordance that keeps
 * the canvas → writing-workspace flow intact without a heavy bottom action bar.
 */
export function CanvasHeader({
  assignmentTitle,
  canAttach,
  gradeBand,
  isAttaching,
  onAttach,
  onBack,
  pageCount,
  paddingTop,
  syncStatus,
}: CanvasHeaderProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const hitSlop = getAccessibleHitSlop(settings);
  const type = typography.gradeBands[gradeBand];

  return (
    <View style={[styles.header, { borderBottomColor: accessibleColors.border, paddingTop }]}>
      <Pressable
        accessibilityLabel={t("canvas.handwriting.backAccessibility")}
        accessibilityRole="button"
        hitSlop={hitSlop}
        onPress={onBack}
        style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        testID="canvas-header-back"
      >
        <Ionicons
          color={accessibleColors.text}
          name={I18nManager.isRTL ? "chevron-forward" : "chevron-back"}
          size={20}
        />
      </Pressable>

      <View style={styles.titleBlock}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={[getAccessibleTextStyle(styles.title, settings), { color: accessibleColors.text }]}
        >
          {assignmentTitle}
        </Text>
        <View style={styles.metaRow}>
          <AutosavePill gradeBand={gradeBand} status={syncStatus} />
          {pageCount > 1 ? (
            <Text
              accessibilityLabel={t("canvas.handwriting.pageIndicatorAccessibility", { total: pageCount })}
              selectable={false}
              style={[getAccessibleTextStyle(type.caption, settings), styles.pageIndicator]}
            >
              {t("canvas.handwriting.pageIndicator", { current: 1, total: pageCount })}
            </Text>
          ) : null}
        </View>
      </View>

      <Pressable
        accessibilityHint={canAttach ? undefined : t("canvas.handwriting.attachDisabledHint")}
        accessibilityLabel={t("canvas.handwriting.attachAccessibility")}
        accessibilityRole="button"
        accessibilityState={{ busy: isAttaching, disabled: !canAttach }}
        disabled={!canAttach || isAttaching}
        hitSlop={hitSlop}
        onPress={onAttach}
        style={({ pressed }) => [
          styles.attachButton,
          !canAttach ? styles.attachDisabled : null,
          pressed && canAttach ? styles.attachPressed : null,
        ]}
        testID="canvas-header-attach"
      >
        <Ionicons color={colors.action.primary.foreground} name="arrow-up-circle" size={16} />
        <Text selectable={false} style={getAccessibleTextStyle(styles.attachLabel, settings)}>
          {t("canvas.handwriting.attach")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  attachButton: {
    alignItems: "center",
    backgroundColor: colors.action.primary.background,
    borderRadius: radius.full,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  attachDisabled: {
    backgroundColor: colors.action.primary.disabledBackground,
  },
  attachLabel: {
    color: colors.action.primary.foreground,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  attachPressed: {
    backgroundColor: colors.action.primary.pressed,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.background.surface,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.background.subtle,
    borderRadius: radius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pageIndicator: {
    color: colors.text.muted,
  },
  pressed: {
    opacity: 0.72,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 20,
  },
  titleBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
});
