import {
  useTunableTokenOverrides,
  type TunableComponentConfig,
  type TunableScreenConfig,
  type TunableTokenDefinition,
} from "@/devtools/theme-tuner";

/**
 * Base palette for the student home dashboard. These are the production
 * values; the dev theme tuner layers temporary overrides on top of them
 * without mutating this module.
 */
export const homeColors = {
  background: "#f8f9ff",
  card: "#ffffff",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  inverseText: "#ffffff",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#434653",
  outline: "#737784",
  outlineVariant: "#c3c6d5",
  primary: "#00327d",
  primaryContainer: "#dae2ff",
  secondary: "#006c49",
  secondaryContainerSoft: "rgba(108, 248, 187, 0.3)",
  secondaryFixedDim: "#4edea3",
  surface: "#f8f9ff",
  surfaceContainer: "#e5eeff",
  surfaceContainerHigh: "#dce9ff",
  surfaceContainerLow: "#eff4ff",
  surfaceVariant: "#d3e4fe",
  tertiaryFixedDim: "#ffb95f",
} as const;

export const homeRadius = {
  sm: 4,
  lg: 8,
  xl: 12,
  full: 999,
} as const;

export const homeSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  section: 32,
} as const;

export const STUDENT_HOME_SCREEN_ID = "student-home";

/** Tunable token values for the student home screen, keyed by token path. */
export interface StudentHomeTokenValues {
  "bottomNav.activeTint": string;
  "bottomNav.background": string;
  "bottomNav.inactiveTint": string;
  "colors.accentCyan": string;
  "colors.achievementGold": string;
  "colors.buttonPrimary": string;
  "colors.cardBackground": string;
  "colors.cardBorder": string;
  "colors.progressGreen": string;
  "colors.screenBackground": string;
  "colors.textPrimary": string;
  "colors.textSecondary": string;
  "radius.card": number;
  "spacing.cardPadding": number;
  "spacing.section": number;
  "typography.bodySize": number;
  "typography.titleSize": number;
}

export type StudentHomeTokenPath = keyof StudentHomeTokenValues;
export type StudentHomeTokenOverrides = Partial<StudentHomeTokenValues>;

export const studentHomeTokenDefaults: StudentHomeTokenValues = {
  "bottomNav.activeTint": "#6D28D9",
  "bottomNav.background": "#FFFFFF",
  "bottomNav.inactiveTint": "#94A3B8",
  "colors.accentCyan": homeColors.surfaceContainerHigh,
  "colors.achievementGold": homeColors.tertiaryFixedDim,
  "colors.buttonPrimary": homeColors.primary,
  "colors.cardBackground": homeColors.card,
  "colors.cardBorder": homeColors.outlineVariant,
  "colors.progressGreen": homeColors.secondaryFixedDim,
  "colors.screenBackground": homeColors.background,
  "colors.textPrimary": homeColors.onSurface,
  "colors.textSecondary": homeColors.onSurfaceVariant,
  "radius.card": homeRadius.xl,
  "spacing.cardPadding": homeSpacing.lg,
  "spacing.section": homeSpacing.section,
  "typography.bodySize": 13,
  "typography.titleSize": 18,
};

const studentHomeTokens: readonly TunableTokenDefinition<StudentHomeTokenPath>[] = [
  { defaultValue: studentHomeTokenDefaults["colors.screenBackground"], kind: "color", path: "colors.screenBackground" },
  { defaultValue: studentHomeTokenDefaults["colors.cardBackground"], kind: "color", path: "colors.cardBackground" },
  { defaultValue: studentHomeTokenDefaults["colors.cardBorder"], kind: "color", path: "colors.cardBorder" },
  { defaultValue: studentHomeTokenDefaults["radius.card"], kind: "radius", max: 32, path: "radius.card" },
  { defaultValue: studentHomeTokenDefaults["typography.titleSize"], kind: "fontSize", max: 32, min: 12, path: "typography.titleSize" },
  { defaultValue: studentHomeTokenDefaults["typography.bodySize"], kind: "fontSize", max: 24, min: 10, path: "typography.bodySize" },
  { defaultValue: studentHomeTokenDefaults["colors.textPrimary"], kind: "color", path: "colors.textPrimary" },
  { defaultValue: studentHomeTokenDefaults["colors.textSecondary"], kind: "color", path: "colors.textSecondary" },
  { defaultValue: studentHomeTokenDefaults["colors.buttonPrimary"], kind: "color", path: "colors.buttonPrimary" },
  { defaultValue: studentHomeTokenDefaults["colors.accentCyan"], kind: "color", path: "colors.accentCyan" },
  { defaultValue: studentHomeTokenDefaults["colors.achievementGold"], kind: "color", path: "colors.achievementGold" },
  { defaultValue: studentHomeTokenDefaults["colors.progressGreen"], kind: "color", path: "colors.progressGreen" },
  { defaultValue: studentHomeTokenDefaults["spacing.cardPadding"], kind: "spacing", max: 32, min: 4, path: "spacing.cardPadding" },
  { defaultValue: studentHomeTokenDefaults["spacing.section"], kind: "spacing", max: 48, min: 8, path: "spacing.section" },
  { defaultValue: studentHomeTokenDefaults["bottomNav.background"], kind: "color", path: "bottomNav.background" },
  { defaultValue: studentHomeTokenDefaults["bottomNav.activeTint"], kind: "color", path: "bottomNav.activeTint" },
  { defaultValue: studentHomeTokenDefaults["bottomNav.inactiveTint"], kind: "color", path: "bottomNav.inactiveTint" },
];

export const studentHomeScreenConfig: TunableScreenConfig<StudentHomeTokenPath> = {
  feature: "student-home",
  id: STUDENT_HOME_SCREEN_ID,
  name: "Student Home",
  route: "/(student)/home",
  tokens: studentHomeTokens,
};

export const studentHomeComponentConfigs: readonly TunableComponentConfig<StudentHomeTokenPath>[] = [
  {
    id: "student-home-header",
    name: "Header",
    screenId: STUDENT_HOME_SCREEN_ID,
    tokens: ["colors.screenBackground", "colors.textPrimary"],
  },
  {
    id: "student-home-today-assignment-card",
    name: "Today's Assignment Card",
    screenId: STUDENT_HOME_SCREEN_ID,
    tokens: [
      "colors.cardBackground",
      "colors.cardBorder",
      "radius.card",
      "spacing.cardPadding",
      "typography.titleSize",
      "colors.buttonPrimary",
      "colors.textSecondary",
    ],
  },
  {
    id: "student-home-weekly-progress-cards",
    name: "Weekly Progress Cards",
    screenId: STUDENT_HOME_SCREEN_ID,
    tokens: [
      "colors.cardBackground",
      "colors.cardBorder",
      "radius.card",
      "spacing.cardPadding",
      "typography.titleSize",
      "colors.accentCyan",
      "colors.textSecondary",
    ],
  },
  {
    id: "student-home-skill-progress-preview",
    name: "Skill Progress Preview",
    screenId: STUDENT_HOME_SCREEN_ID,
    tokens: [
      "colors.cardBackground",
      "colors.cardBorder",
      "radius.card",
      "spacing.cardPadding",
      "colors.progressGreen",
      "colors.achievementGold",
      "colors.textSecondary",
    ],
  },
  {
    id: "student-home-continue-draft-card",
    name: "Continue Draft Card",
    screenId: STUDENT_HOME_SCREEN_ID,
    tokens: [
      "colors.cardBackground",
      "colors.cardBorder",
      "radius.card",
      "colors.accentCyan",
      "colors.buttonPrimary",
      "colors.textSecondary",
    ],
  },
  {
    id: "student-home-recent-feedback-card",
    name: "Recent Feedback Card",
    screenId: STUDENT_HOME_SCREEN_ID,
    tokens: [
      "colors.cardBackground",
      "colors.cardBorder",
      "radius.card",
      "typography.bodySize",
      "colors.textPrimary",
      "colors.progressGreen",
    ],
  },
  {
    id: "student-home-bottom-navigation",
    name: "Bottom Navigation",
    screenId: STUDENT_HOME_SCREEN_ID,
    tokens: ["bottomNav.background", "bottomNav.activeTint", "bottomNav.inactiveTint"],
  },
];

/**
 * Typed dev overrides for the student home screen. Returns a stable empty
 * object in production and whenever nothing is tuned.
 */
export function useStudentHomeTokenOverrides(): StudentHomeTokenOverrides {
  return useTunableTokenOverrides<StudentHomeTokenPath>(STUDENT_HOME_SCREEN_ID) as StudentHomeTokenOverrides;
}
