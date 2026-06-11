import { colors } from "@/design/tokens";
import {
  useTunableTokenOverrides,
  type TunableComponentConfig,
  type TunableScreenConfig,
  type TunableTokenDefinition,
} from "@/devtools/theme-tuner";

/**
 * Base palette for the student home dashboard, aliased from the canonical
 * `colors.dashboard` token group. These are the production values; the dev
 * theme tuner layers temporary overrides on top of them without mutating
 * this module.
 */
export const homeColors = {
  background: colors.dashboard.background,
  card: colors.dashboard.card,
  error: colors.dashboard.error,
  errorContainer: colors.dashboard.errorContainer,
  inverseText: colors.dashboard.inverseText,
  onSurface: colors.dashboard.onSurface,
  onSurfaceVariant: colors.dashboard.onSurfaceVariant,
  outline: colors.dashboard.outline,
  outlineVariant: colors.dashboard.outlineVariant,
  primary: colors.dashboard.primary,
  primaryContainer: colors.dashboard.primaryFixed,
  secondary: colors.dashboard.secondary,
  secondaryContainerSoft: colors.dashboard.secondaryContainerSoft,
  secondaryFixedDim: colors.dashboard.secondaryFixedDim,
  surface: colors.dashboard.surface,
  surfaceContainer: colors.dashboard.surfaceContainer,
  surfaceContainerHigh: colors.dashboard.surfaceContainerHigh,
  surfaceContainerLow: colors.dashboard.surfaceContainerLow,
  surfaceVariant: colors.dashboard.surfaceVariant,
  tertiaryFixedDim: colors.dashboard.tertiaryFixedDim,
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
  "typography.bodyLineHeight": number;
  "typography.bodySize": number;
  "typography.titleLineHeight": number;
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
  "typography.bodyLineHeight": 18,
  "typography.bodySize": 13,
  "typography.titleLineHeight": 24,
  "typography.titleSize": 18,
};

const studentHomeTokens: readonly TunableTokenDefinition<StudentHomeTokenPath>[] = [
  { defaultValue: studentHomeTokenDefaults["colors.screenBackground"], kind: "color", path: "colors.screenBackground" },
  { defaultValue: studentHomeTokenDefaults["colors.cardBackground"], kind: "color", path: "colors.cardBackground" },
  { defaultValue: studentHomeTokenDefaults["colors.cardBorder"], kind: "color", path: "colors.cardBorder" },
  { defaultValue: studentHomeTokenDefaults["radius.card"], kind: "radius", max: 32, path: "radius.card" },
  { defaultValue: studentHomeTokenDefaults["typography.titleSize"], kind: "fontSize", max: 32, min: 12, path: "typography.titleSize" },
  { defaultValue: studentHomeTokenDefaults["typography.titleLineHeight"], kind: "lineHeight", max: 44, min: 14, path: "typography.titleLineHeight" },
  { defaultValue: studentHomeTokenDefaults["typography.bodySize"], kind: "fontSize", max: 24, min: 10, path: "typography.bodySize" },
  { defaultValue: studentHomeTokenDefaults["typography.bodyLineHeight"], kind: "lineHeight", max: 36, min: 12, path: "typography.bodyLineHeight" },
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
    tokens: ["colors.screenBackground", "colors.textPrimary", "colors.textSecondary"],
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
      "typography.titleLineHeight",
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
      "typography.titleLineHeight",
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
      "spacing.cardPadding",
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
      "spacing.cardPadding",
      "typography.bodySize",
      "typography.bodyLineHeight",
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
