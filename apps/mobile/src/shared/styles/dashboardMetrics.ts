/**
 * Shared spacing and radius metrics for the parent and teacher dashboard
 * screens. Both screens previously redeclared byte-identical local copies.
 */
export const dashboardSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  section: 32,
} as const;

export const dashboardRadius = {
  sm: 4,
  lg: 8,
  xl: 12,
  full: 999,
} as const;
