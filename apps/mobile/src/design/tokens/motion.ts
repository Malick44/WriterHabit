export const duration = {
  instant: 0,
  xs: 100,
  sm: 160,
  md: 240,
  lg: 360,
  xl: 520,
} as const;

export const easing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  decelerate: "cubic-bezier(0, 0, 0, 1)",
  accelerate: "cubic-bezier(0.3, 0, 1, 1)",
} as const;

export const spring = {
  cardPress: {
    damping: 18,
    stiffness: 220,
    mass: 0.8,
  },
  playerTransition: {
    damping: 24,
    stiffness: 180,
    mass: 0.9,
  },
} as const;

export const motion = {
  duration,
  easing,
  spring,
} as const;

export type MotionTokens = typeof motion;
