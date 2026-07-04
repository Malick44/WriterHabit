import { StyleSheet } from "react-native";

import { layout, spacing } from "@/design/tokens";

export const APP_HEADER_AVATAR_SIZE = layout.touchTarget - spacing.md;
export const APP_HEADER_BORDER_WIDTH = StyleSheet.hairlineWidth;
export const APP_HEADER_ICON_SIZE = spacing.xl - spacing.xs;
export const APP_HEADER_MAX_ACTIONS = 4;
export const APP_HEADER_PROGRESS_HEIGHT = spacing.sm - spacing.xxs;
export const APP_HEADER_TEST_IDS = {
  action: "app-header-action",
  avatar: "app-header-avatar",
  progress: "app-header-progress",
  root: "app-header",
  title: "app-header-title",
} as const;
