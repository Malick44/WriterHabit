import { Platform, StyleSheet } from "react-native";

import { colors, layout, palette, radius, shadows, spacing } from "@/design/tokens";

import { APP_HEADER_AVATAR_SIZE, APP_HEADER_BORDER_WIDTH, APP_HEADER_PROGRESS_HEIGHT } from "./appHeader.constants";
import type { AppHeaderColorScheme, AppHeaderResolvedColors, AppHeaderVariant } from "./appHeader.types";

export function getAppHeaderColors(
  variant: AppHeaderVariant,
  colorScheme: AppHeaderColorScheme,
  highContrast: boolean,
): AppHeaderResolvedColors {
  if (highContrast) {
    return {
      actionBackground: palette.white,
      actionBorder: palette.black,
      actionDisabledBackground: palette.white,
      actionDisabledBorder: palette.black,
      actionDisabledForeground: palette.black,
      actionForeground: palette.black,
      actionPressed: palette.slate[200],
      background: variant === "transparent" ? colors.action.ghost.background : palette.white,
      border: palette.black,
      mutedText: palette.black,
      progressBackground: palette.slate[200],
      progressFill: palette.black,
      text: palette.black,
    };
  }

  if (colorScheme === "dark") {
    return {
      actionBackground: palette.slate[900],
      actionBorder: palette.slate[700],
      actionDisabledBackground: palette.slate[800],
      actionDisabledBorder: palette.slate[700],
      actionDisabledForeground: palette.slate[500],
      actionForeground: colors.text.inverse,
      actionPressed: palette.slate[800],
      background: variant === "transparent" ? colors.action.ghost.background : colors.background.inverse,
      border: palette.slate[800],
      mutedText: palette.slate[300],
      progressBackground: palette.slate[800],
      progressFill: palette.blue[200],
      text: colors.text.inverse,
    };
  }

  return {
    actionBackground: colors.background.surface,
    actionBorder: colors.border.default,
    actionDisabledBackground: colors.action.secondary.disabledBackground,
    actionDisabledBorder: colors.border.default,
    actionDisabledForeground: colors.action.secondary.disabledForeground,
    actionForeground: colors.text.primary,
    actionPressed: colors.action.ghost.pressed,
    background:
      variant === "transparent"
        ? colors.action.ghost.background
        : variant === "blurred"
          ? colors.background.surfaceRaised
          : colors.background.surface,
    border: variant === "transparent" ? colors.action.ghost.background : colors.border.default,
    mutedText: colors.text.secondary,
    progressBackground: colors.border.default,
    progressFill: colors.action.primary.background,
    text: colors.text.primary,
  };
}

export function getAppHeaderVariantStyle(variant: AppHeaderVariant) {
  switch (variant) {
    case "large":
      return {
        container: styles.largeContainer,
        content: styles.largeContent,
        topPadding: spacing.lg,
        titleRole: "display" as const,
      };
    case "compact":
      return {
        container: styles.compactContainer,
        content: styles.compactContent,
        topPadding: spacing.sm,
        titleRole: "bodyStrong" as const,
      };
    case "centered":
      return {
        container: styles.defaultContainer,
        content: styles.centeredContent,
        topPadding: spacing.md,
        titleRole: "title" as const,
      };
    case "floating":
      return {
        container: styles.floatingContainer,
        content: styles.defaultContent,
        topPadding: spacing.md,
        titleRole: "title" as const,
      };
    case "transparent":
    case "blurred":
    case "default":
      return {
        container: styles.defaultContainer,
        content: styles.defaultContent,
        topPadding: spacing.md,
        titleRole: "title" as const,
      };
  }
}

export const styles = StyleSheet.create({
  actionGroup: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: spacing.xs,
    minWidth: layout.touchTarget,
  },
  actionGroupRtl: {
    flexDirection: "row-reverse",
  },
  actionText: {
    flexShrink: 1,
    textAlign: "center",
  },
  avatarImage: {
    borderRadius: radius.full,
    height: APP_HEADER_AVATAR_SIZE,
    width: APP_HEADER_AVATAR_SIZE,
  },
  avatarFallbackText: {
    fontWeight: "800",
    textAlign: "center",
  },
  centeredContent: {
    justifyContent: "center",
  },
  compactContainer: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  compactContent: {
    minHeight: layout.touchTarget,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  contentRtl: {
    flexDirection: "row-reverse",
  },
  defaultContainer: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  defaultContent: {
    minHeight: layout.touchTargetLarge,
  },
  floatingContainer: {
    borderRadius: radius.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    ...shadows.floating,
  },
  largeContainer: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  largeContent: {
    alignItems: "flex-start",
    minHeight: layout.touchTargetLarge + spacing.md,
  },
  progressContainer: {
    marginTop: spacing.md,
  },
  progressTrack: {
    borderRadius: radius.full,
    height: APP_HEADER_PROGRESS_HEIGHT,
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: radius.full,
    height: "100%",
  },
  progressMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  root: {
    borderBottomWidth: APP_HEADER_BORDER_WIDTH,
  },
  rootSticky: {
    zIndex: 20,
  },
  sideSlot: {
    alignItems: "center",
    flexShrink: 0,
    justifyContent: "center",
    minWidth: layout.touchTarget,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  titleBlockCentered: {
    alignItems: "center",
  },
  titleBlockRtl: {
    alignItems: "flex-end",
  },
  titleText: {
    alignSelf: "stretch",
    flexShrink: 1,
    fontFamily: Platform.select({
      android: "sans-serif-condensed",
      ios: "AvenirNextCondensed-DemiBold",
      default: undefined,
    }),
    fontWeight: "700",
    letterSpacing: 0,
  },
  subtitleText: {
    flexShrink: 1,
  },
});
