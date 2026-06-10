import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

import { colors, palette } from "@/design/tokens";
import type { TopAlertColorScheme, TopAlertType } from "./topAlert.types";

export interface TopAlertVariantStyle {
  actionBackground: string;
  actionBorder: string;
  actionForeground: string;
  background: string;
  border: string;
  foreground: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  iconBackground: string;
  mutedForeground: string;
  pressed: string;
}

export function getTopAlertVariantStyle(
  type: TopAlertType,
  colorScheme: TopAlertColorScheme,
): TopAlertVariantStyle {
  const dark = colorScheme === "dark";
  const neutralDark = {
    actionBackground: "rgba(255, 255, 255, 0.1)",
    actionBorder: "rgba(255, 255, 255, 0.18)",
    actionForeground: colors.text.inverse,
    background: colors.background.inverse,
    border: palette.slate[700],
    foreground: colors.text.inverse,
    iconBackground: "rgba(255, 255, 255, 0.12)",
    mutedForeground: palette.slate[200],
    pressed: "rgba(255, 255, 255, 0.12)",
  };
  const neutralLight = {
    actionBackground: colors.background.surface,
    actionBorder: colors.border.default,
    actionForeground: colors.text.primary,
    background: colors.background.surface,
    border: colors.border.default,
    foreground: colors.text.primary,
    iconBackground: colors.feedback.neutral.background,
    mutedForeground: colors.text.secondary,
    pressed: colors.action.ghost.pressed,
  };
  const base = dark ? neutralDark : neutralLight;

  switch (type) {
    case "success":
      return {
        ...base,
        background: dark ? palette.green[700] : colors.feedback.success.background,
        border: colors.feedback.success.border,
        foreground: dark ? colors.text.inverse : colors.feedback.success.text,
        icon: "checkmark-circle",
        iconBackground: dark ? "rgba(255, 255, 255, 0.16)" : palette.green[100],
      };
    case "error":
      return {
        ...base,
        background: dark ? palette.red[700] : colors.feedback.error.background,
        border: colors.feedback.error.border,
        foreground: dark ? colors.text.inverse : colors.feedback.error.text,
        icon: "alert-circle",
        iconBackground: dark ? "rgba(255, 255, 255, 0.16)" : palette.red[100],
      };
    case "warning":
      return {
        ...base,
        background: dark ? palette.amber[700] : colors.feedback.warning.background,
        border: colors.feedback.warning.border,
        foreground: dark ? colors.text.inverse : colors.feedback.warning.text,
        icon: "warning",
        iconBackground: dark ? "rgba(255, 255, 255, 0.16)" : palette.amber[100],
      };
    case "info":
      return {
        ...base,
        background: dark ? palette.blue[800] : colors.feedback.info.background,
        border: colors.feedback.info.border,
        foreground: dark ? colors.text.inverse : colors.feedback.info.text,
        icon: "information-circle",
        iconBackground: dark ? "rgba(255, 255, 255, 0.16)" : palette.blue[100],
      };
    case "offline":
      return {
        ...base,
        background: dark ? palette.slate[800] : colors.feedback.neutral.background,
        border: colors.border.warning,
        foreground: dark ? colors.text.inverse : colors.text.primary,
        icon: "cloud-offline",
        iconBackground: dark ? "rgba(255, 255, 255, 0.16)" : palette.amber[100],
      };
    case "loading":
      return {
        ...base,
        background: dark ? palette.blue[900] : colors.feedback.info.background,
        border: colors.feedback.info.border,
        foreground: dark ? colors.text.inverse : colors.feedback.info.text,
        icon: "sync",
        iconBackground: dark ? "rgba(255, 255, 255, 0.16)" : palette.blue[100],
      };
    case "neutral":
      return {
        ...base,
        icon: "notifications",
      };
  }
}
