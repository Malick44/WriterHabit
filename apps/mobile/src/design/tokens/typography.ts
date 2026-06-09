import type { TextStyle } from "react-native";

export type GradeBand = "elementary" | "middle" | "high";

export type TextRole =
  | "display"
  | "heading"
  | "title"
  | "body"
  | "bodyStrong"
  | "bodySmall"
  | "caption"
  | "label"
  | "button"
  | "metric";

export type TypographyToken = Pick<TextStyle, "fontSize" | "lineHeight" | "fontWeight" | "letterSpacing">;

type TypographyScale = Record<TextRole, TypographyToken>;

const elementary = {
  display: { fontSize: 34, lineHeight: 42, fontWeight: "800", letterSpacing: 0 },
  heading: { fontSize: 28, lineHeight: 36, fontWeight: "800", letterSpacing: 0 },
  title: { fontSize: 22, lineHeight: 30, fontWeight: "700", letterSpacing: 0 },
  body: { fontSize: 18, lineHeight: 28, fontWeight: "400", letterSpacing: 0 },
  bodyStrong: { fontSize: 18, lineHeight: 28, fontWeight: "700", letterSpacing: 0 },
  bodySmall: { fontSize: 16, lineHeight: 24, fontWeight: "400", letterSpacing: 0 },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: "600", letterSpacing: 0 },
  label: { fontSize: 15, lineHeight: 22, fontWeight: "700", letterSpacing: 0 },
  button: { fontSize: 17, lineHeight: 24, fontWeight: "800", letterSpacing: 0 },
  metric: { fontSize: 32, lineHeight: 40, fontWeight: "800", letterSpacing: 0 },
} satisfies TypographyScale;

const middle = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: "800", letterSpacing: 0 },
  heading: { fontSize: 26, lineHeight: 34, fontWeight: "800", letterSpacing: 0 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: "700", letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400", letterSpacing: 0 },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: "700", letterSpacing: 0 },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: "400", letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: "600", letterSpacing: 0 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "700", letterSpacing: 0 },
  button: { fontSize: 16, lineHeight: 22, fontWeight: "800", letterSpacing: 0 },
  metric: { fontSize: 30, lineHeight: 38, fontWeight: "800", letterSpacing: 0 },
} satisfies TypographyScale;

const high = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: "800", letterSpacing: 0 },
  heading: { fontSize: 24, lineHeight: 32, fontWeight: "800", letterSpacing: 0 },
  title: { fontSize: 19, lineHeight: 26, fontWeight: "700", letterSpacing: 0 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400", letterSpacing: 0 },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "700", letterSpacing: 0 },
  bodySmall: { fontSize: 13, lineHeight: 19, fontWeight: "400", letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: "600", letterSpacing: 0 },
  label: { fontSize: 13, lineHeight: 19, fontWeight: "700", letterSpacing: 0 },
  button: { fontSize: 15, lineHeight: 21, fontWeight: "800", letterSpacing: 0 },
  metric: { fontSize: 28, lineHeight: 36, fontWeight: "800", letterSpacing: 0 },
} satisfies TypographyScale;

export const gradeTypography = {
  elementary,
  middle,
  high,
} as const satisfies Record<GradeBand, TypographyScale>;

export function getGradeBandForGrade(grade: number): GradeBand {
  if (grade <= 5) {
    return "elementary";
  }

  if (grade <= 8) {
    return "middle";
  }

  return "high";
}

export function getTypographyForGrade(gradeOrBand: number | GradeBand = "middle"): TypographyScale {
  const gradeBand = typeof gradeOrBand === "number" ? getGradeBandForGrade(gradeOrBand) : gradeOrBand;
  return gradeTypography[gradeBand];
}

export const typography = {
  roles: middle,
  gradeBands: gradeTypography,
  getGradeBandForGrade,
  getForGrade: getTypographyForGrade,
} as const;
