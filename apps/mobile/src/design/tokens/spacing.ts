export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

export const layout = {
  screenPadding: {
    phone: 20,
    tablet: 32,
  },
  maxContentWidth: 760,
  maxReadableWidth: 640,
  touchTarget: 44,
  touchTargetLarge: 52,
  hitSlop: {
    top: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    left: spacing.sm,
  },
} as const;

export type SpacingTokens = typeof spacing;
