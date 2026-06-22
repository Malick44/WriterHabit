/**
 * WriterHabit base palette, matching the docs/screens design references.
 * Scale names are historical: "slate" is the warm stone/ink neutral ramp,
 * "blue" is the forest-green primary action hue, "amber" is the brand
 * gold, "red" is the clay error hue, "teal" is the parent/teacher accent,
 * and "violet" is the deep sage used for coach moments.
 */
export const palette = {
  white: "#FFFFFF",
  black: "#000000",
  slate: {
    50: "#FBF9F5",
    100: "#F1EDE4",
    200: "#E9E3DA",
    300: "#DDD5C8",
    400: "#A89C8A",
    500: "#857C70",
    600: "#6B6258",
    700: "#57504A",
    800: "#3A352F",
    900: "#2C2825",
    950: "#1F1C19",
  },
  // Warm cream "paper" surface neutrals (distinct from the cooler slate ramp).
  paper: {
    50: "#F6F3EE",
    100: "#EFECE4",
    200: "#ECE7DF",
    300: "#ECE7DD",
    400: "#E7E1D6",
    500: "#E3DFD5",
    600: "#D6CFC2",
    700: "#D6CDBE",
  },
  blue: {
    50: "#EEF2EC",
    100: "#DFF0E3",
    200: "#D6E1D6",
    300: "#A9C4B1",
    400: "#9EC0A8",
    500: "#4D7E5D",
    600: "#3F6B4F",
    700: "#34593F",
    750: "#35583F",
    800: "#2C4A35",
    900: "#243D2C",
    950: "#1E3325",
  },
  teal: {
    50: "#EAF2EF",
    100: "#D5E0D9",
    500: "#2F9E8F",
    600: "#2C7A6E",
    700: "#25665C",
  },
  green: {
    50: "#E5F2E8",
    100: "#DFF0E3",
    600: "#3F6B4F",
    700: "#34593F",
  },
  amber: {
    50: "#FBF3E6",
    75: "#F9F0DC",
    90: "#F1ECD9",
    100: "#EFE0C4",
    300: "#D9AD5B",
    500: "#C8973F",
    700: "#8A6A2C",
  },
  red: {
    50: "#F8E8E3",
    100: "#F1D6CD",
    600: "#B3543F",
    700: "#A8412E",
  },
  violet: {
    50: "#EEF2EC",
    100: "#D6E1D6",
    600: "#3A4A3E",
    700: "#2F3D33",
  },
} as const;

/**
 * Derive an rgba() string from a palette hex so alpha overlays stay anchored to
 * a single source hue (change the palette entry, the overlay follows).
 */
const rgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Public alias for deriving alpha overlays from a palette hex in components. */
export const withAlpha = rgba;

export const colors = {
  background: {
    app: "#F6F3EE",
    canvas: "#FBF9F5",
    surface: palette.white,
    surfaceRaised: "#FDFCFA",
    subtle: palette.blue[50],
    inverse: palette.slate[950],
  },
  text: {
    primary: palette.slate[900],
    secondary: palette.slate[700],
    muted: palette.slate[500],
    inverse: palette.white,
    link: palette.blue[700],
    danger: palette.red[700],
    success: palette.green[700],
  },
  border: {
    default: palette.slate[200],
    strong: palette.slate[300],
    focus: palette.blue[500],
    danger: palette.red[600],
    success: palette.green[600],
    warning: palette.amber[500],
  },
  action: {
    primary: {
      background: palette.blue[700],
      pressed: palette.blue[800],
      foreground: palette.white,
      disabledBackground: palette.slate[300],
      disabledForeground: palette.slate[600],
    },
    secondary: {
      background: palette.white,
      pressed: palette.blue[50],
      foreground: palette.blue[800],
      border: palette.blue[200],
      disabledBackground: palette.slate[100],
      disabledForeground: palette.slate[500],
    },
    ghost: {
      background: "transparent",
      pressed: palette.slate[100],
      foreground: palette.slate[800],
      disabledForeground: palette.slate[400],
    },
    danger: {
      background: palette.red[600],
      pressed: palette.red[700],
      foreground: palette.white,
      disabledBackground: palette.red[100],
      disabledForeground: palette.red[700],
    },
  },
  feedback: {
    info: {
      background: palette.blue[50],
      border: palette.blue[100],
      pressed: palette.blue[100],
      text: palette.blue[900],
      icon: palette.blue[700],
    },
    success: {
      background: palette.green[50],
      border: palette.green[100],
      pressed: palette.green[100],
      text: palette.green[700],
      icon: palette.green[600],
    },
    warning: {
      background: palette.amber[50],
      border: palette.amber[100],
      pressed: palette.amber[100],
      text: palette.amber[700],
      icon: palette.amber[500],
    },
    error: {
      background: palette.red[50],
      border: palette.red[100],
      pressed: palette.red[100],
      text: palette.red[700],
      icon: palette.red[600],
    },
    neutral: {
      background: palette.slate[50],
      border: palette.slate[200],
      pressed: palette.slate[100],
      text: palette.slate[700],
      icon: palette.slate[500],
    },
  },
  gradeBand: {
    elementary: {
      background: palette.paper[50],
      surface: palette.white,
      accent: palette.teal[500],
      accentStrong: palette.teal[700],
      text: palette.slate[900],
    },
    middle: {
      background: palette.paper[50],
      surface: palette.white,
      accent: palette.blue[600],
      accentStrong: palette.blue[800],
      text: palette.slate[900],
    },
    high: {
      background: palette.paper[50],
      surface: palette.white,
      accent: palette.slate[800],
      accentStrong: palette.slate[950],
      text: palette.slate[900],
    },
  },
  coach: {
    background: palette.violet[50],
    border: palette.violet[100],
    accent: palette.violet[600],
    accentStrong: palette.violet[700],
  },
  /**
   * Canonical WriterHabit "paper & forest" dashboard palette, matching the
   * design references in docs/screens (warm cream surfaces, forest-green
   * primary, gold tertiary). This is the union of the near-identical
   * palettes previously redeclared by the student home, parent home,
   * teacher dashboard, profile/settings, auth, assignment detail, and
   * progress screens. Feature screens migrate to these roles instead of
   * redeclaring local copies.
   */
  dashboard: {
    background: palette.paper[50],
    backgroundOverlay: rgba(palette.paper[50], 0.95),
    card: palette.white,
    cardTranslucent: rgba(palette.white, 0.86),
    error: palette.red[600],
    errorContainer: palette.red[50],
    glass: rgba(palette.white, 0.8),
    glassFaint: rgba(palette.white, 0.12),
    inverseOnSurface: palette.paper[100],
    inverseSurface: palette.blue[750],
    inverseSurfaceHigh: palette.blue[800],
    inverseText: palette.white,
    onErrorContainer: palette.red[700],
    onPrimary: palette.white,
    onPrimaryContainer: palette.blue[300],
    onSecondary: palette.white,
    onSecondaryContainer: palette.blue[700],
    onSurface: palette.slate[900],
    onSurfaceVariant: palette.slate[600],
    outline: palette.slate[500],
    outlineFaint: rgba(palette.paper[700], 0.45),
    outlineVariant: palette.slate[200],
    primary: palette.blue[700],
    primaryContainer: palette.blue[600],
    primaryFixed: palette.blue[100],
    primaryFixedBorder: palette.blue[400],
    primaryMuted: rgba(palette.blue[700], 0.4),
    primarySoft: rgba(palette.blue[700], 0.18),
    primarySubtle: rgba(palette.blue[700], 0.05),
    secondary: palette.blue[600],
    secondaryContainer: palette.blue[100],
    secondaryContainerSoft: rgba(palette.blue[100], 0.5),
    secondaryFixed: palette.blue[100],
    secondaryFixedDim: palette.blue[400],
    secondarySoft: rgba(palette.blue[600], 0.2),
    surface: palette.paper[50],
    surfaceContainer: palette.slate[100],
    surfaceContainerHigh: palette.paper[300],
    surfaceContainerHighest: palette.paper[400],
    surfaceContainerLow: palette.slate[50],
    surfaceContainerLowest: palette.white,
    surfaceDim: palette.paper[500],
    surfaceLowest: palette.white,
    surfaceVariant: palette.paper[200],
    tertiaryContainer: palette.amber[75],
    tertiaryFixed: palette.amber[90],
    tertiaryFixedDim: palette.amber[300],
    tertiaryText: palette.amber[700],
  },
  /**
   * Onboarding flow palette, previously hardcoded across the onboarding
   * step frame and selection screens. The "navy" role now carries the
   * forest-green brand primary from the docs/screens design language.
   */
  onboarding: {
    navy: palette.blue[700],
    ink: palette.slate[950],
    subtitle: palette.slate[700],
    surface: palette.white,
    dotInactive: palette.blue[200],
    buttonShadow: palette.blue[950],
    selectedBackground: palette.blue[50],
    cardBorder: palette.slate[300],
    iconBubble: palette.blue[100],
    checkBorder: palette.paper[600],
    screenBackground: palette.paper[50],
    success: palette.blue[600],
    checkBorderSelected: palette.blue[400],
    previewCard: palette.blue[100],
    previewBorder: palette.blue[400],
    iconBubbleSoft: palette.blue[50],
    label: palette.slate[700],
    avatarBorder: palette.blue[200],
    quoteBorder: palette.slate[200],
    cardShadow: palette.slate[900],
  },
  overlay: {
    scrim: "rgba(44, 40, 37, 0.42)",
  },
} as const;

export type ColorTokens = typeof colors;
