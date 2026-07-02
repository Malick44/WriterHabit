/**
 * Grade 3 Writing Adventure palette.
 *
 * The adventure intentionally uses a warmer, more playful ramp than the core
 * "paper & forest" tokens (sunshine yellows, mint, peach, sky, and a lavender
 * accent) so the kids' section feels like its own storybook world. Every color
 * the feature paints lives here — components must not hardcode hex values, so
 * the whole section can be re-tuned (or contrast-audited) in one place.
 */
export const grade3Theme = {
  /** Warm cream backdrop shared by every Grade 3 screen and the bottom bar. */
  screen: {
    background: "#FFF8E9",
    barBorder: "#E8CFA2",
  },
  /** Storybook card variants used by Grade3AdventureCard. */
  card: {
    cream: { background: "#FFF8E9", border: "#EBCB8B" },
    mint: { background: "#ECF8F0", border: "#A6D6B5" },
    peach: { background: "#FFF0E8", border: "#F0B493" },
    sky: { background: "#EEF7FF", border: "#A8CBE8" },
  },
  /** Sunshine chips: word-bank words, sentence starters, celebration cards. */
  chip: {
    background: "#FFF5D7",
    border: "#E1B858",
    pressedBackground: "#F7E4A8",
  },
  /** Lavender accent for the lesson step tracker and read-mode next button. */
  accent: {
    lavender: "#5F3DC4",
    lavenderBright: "#6D4AD9",
    lavenderBorder: "#D9D0E9",
    lavenderSoft: "#EEE9F6",
  },
  /** Paper-worksheet preview (notebook holes, dashed picture frame, ruled lines). */
  worksheet: {
    paper: "#FFFDF8",
    paperBorder: "#E3C79A",
    frameBorder: "#D7C2A4",
    hole: "#F4E7D0",
    holeBorder: "#D8B986",
    emojiBox: "#FFF4D6",
    writingLine: "#7EA4B8",
  },
  /** Illustrated reading-scene backdrop in ReadStep. */
  scene: {
    background: "#F6E9CF",
    border: "#E1D3B8",
    sky: "#CFEBDD",
    ground: "#E9D6B4",
    bush: "#93C98E",
    sun: "#9BC4D7",
    table: "#D9A96D",
    cardBorder: "#E7DED3",
  },
} as const;

export type Grade3Theme = typeof grade3Theme;
