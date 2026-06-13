/**
 * WriterHabit font families, matching the docs/screens design references:
 * Newsreader (serif) for headlines and editorial moments, Hanken Grotesk
 * for UI text. Each entry names a statically weighted face loaded at app
 * start, so styles using these must not also set a conflicting fontWeight.
 */
export const fonts = {
  serif: "Newsreader_500Medium",
  serifRegular: "Newsreader_400Regular",
  serifSemiBold: "Newsreader_600SemiBold",
  sans: "HankenGrotesk_400Regular",
  sansMedium: "HankenGrotesk_500Medium",
  sansSemiBold: "HankenGrotesk_600SemiBold",
  sansBold: "HankenGrotesk_700Bold",
} as const;

export type FontTokens = typeof fonts;
