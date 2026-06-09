export const shadows = {
  none: {
    boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
  },
  raised: {
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.08)",
  },
  card: {
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
  },
  floating: {
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.14)",
  },
  focus: {
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.28)",
  },
} as const;

export type ShadowTokens = typeof shadows;
