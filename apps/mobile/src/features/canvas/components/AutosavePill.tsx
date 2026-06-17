import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography, type GradeBand } from "@/design/tokens";
import { useI18n } from "@/i18n";
import {
  getAccessibleColors,
  getAccessibleTextStyle,
  useAccessibilityContext,
} from "@/shared/utils/accessibility";

import type { CanvasSyncStatus } from "../types";

type IoniconName = ComponentProps<typeof Ionicons>["name"];
type AutosaveState = "saved" | "saving" | "unsaved" | "failed";

interface AutosavePillProps {
  gradeBand: GradeBand;
  status: CanvasSyncStatus;
}

/** Maps the canvas sync status onto the four autosave states the canvas
 * surfaces to students. */
function toAutosaveState(status: CanvasSyncStatus): AutosaveState {
  switch (status) {
    case "saved":
      return "saved";
    case "saving":
      return "saving";
    case "sync_failed":
      return "failed";
    case "local_only":
      return "unsaved";
  }
}

const stateIcon: Record<AutosaveState, IoniconName> = {
  saved: "checkmark-circle",
  saving: "sync-outline",
  unsaved: "ellipse-outline",
  failed: "alert-circle",
};

const stateTone: Record<AutosaveState, keyof typeof colors.feedback> = {
  saved: "success",
  saving: "info",
  unsaved: "neutral",
  failed: "error",
};

/**
 * Compact autosave confidence pill shown in the canvas header. Cycles through
 * Saved / Saving / Unsaved / Save failed based on the document sync status.
 */
export function AutosavePill({ gradeBand, status }: AutosavePillProps) {
  const { t } = useI18n();
  const { settings } = useAccessibilityContext();
  const accessibleColors = getAccessibleColors(settings);
  const type = typography.gradeBands[gradeBand];
  const state = toAutosaveState(status);
  const toneTokens = colors.feedback[stateTone[state]];
  const useAccessibleSurface = settings.highContrast;
  const label = t(`canvas.handwriting.autosave.${state}`);
  const textColor = useAccessibleSurface ? accessibleColors.text : toneTokens.text;
  const iconColor = useAccessibleSurface ? accessibleColors.text : toneTokens.icon;

  return (
    <View
      accessibilityLabel={t("canvas.handwriting.autosave.accessibility", { status: label })}
      accessibilityRole="text"
      style={[
        styles.pill,
        {
          backgroundColor: useAccessibleSurface ? accessibleColors.surface : toneTokens.background,
          borderColor: useAccessibleSurface ? accessibleColors.border : toneTokens.border,
        },
      ]}
      testID="canvas-autosave-pill"
    >
      <Ionicons color={iconColor} name={stateIcon[state]} size={13} />
      <Text selectable={false} style={[getAccessibleTextStyle(type.caption, settings), { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
});
