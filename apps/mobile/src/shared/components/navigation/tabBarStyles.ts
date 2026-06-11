import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";

import { colors, palette } from "@/design/tokens";

/**
 * Shared bottom tab bar styling for the student, parent, and teacher layouts.
 * Mirrors the polished student tab bar: safe-area aware height, surface
 * background, top border, soft shadow, and dashboard-primary active tint.
 */
export const TAB_BAR_BASE_HEIGHT = 74;
export const TAB_BAR_MIN_BOTTOM_PADDING = 18;

export const tabBarColors = {
  activeTint: colors.dashboard.primary,
  inactiveTint: palette.slate[400],
} as const;

export const tabBarStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background.surface,
    borderTopColor: palette.slate[100],
    borderTopWidth: 1,
    paddingTop: 9,
    shadowColor: palette.slate[900],
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  tabBarItem: {
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 2,
  } satisfies TextStyle,
});

export function getTabBarStyle(bottomInset: number): ViewStyle[] {
  return [
    tabBarStyles.tabBar,
    {
      height: TAB_BAR_BASE_HEIGHT + bottomInset,
      paddingBottom: Math.max(bottomInset, TAB_BAR_MIN_BOTTOM_PADDING),
    },
  ];
}
