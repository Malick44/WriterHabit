/**
 * Persisted read-aloud playback preferences: voice style, speech speed, and
 * the word-highlight toggle.
 *
 * The shipped Supertonic archive packs several voice styles (see
 * sherpa/catalog.ts VOICE_STYLES); this module stores which speaker id the
 * student picked in settings, how fast the coach speaks, and whether words
 * light up while read. The read-aloud facade consults these on every
 * utterance, so changes take effect immediately — no re-download, no reload.
 */
import { preferencesStorage } from "@/services/storage/preferencesStorage";
import { storageKeys } from "@/services/storage/storageKeys";

import { DEFAULT_SHERPA_MODEL, VOICE_STYLES } from "./sherpa/catalog";

/** Selectable speech speeds; multiplies any caller-provided per-surface rate. */
export const SPEECH_RATE_OPTIONS = [
  { key: "slow", rate: 0.8 },
  { key: "normal", rate: 1.0 },
  { key: "fast", rate: 1.25 },
] as const;

export type SpeechRateKey = (typeof SPEECH_RATE_OPTIONS)[number]["key"];

const DEFAULT_RATE = 1.0;

let cachedSpeakerId: number | null = null;
let cachedRate: number | null = null;
let cachedWordHighlight: boolean | null = null;

function isKnownSpeakerId(speakerId: number): boolean {
  return VOICE_STYLES.some((style) => style.speakerId === speakerId);
}

function isKnownRate(rate: number): boolean {
  return SPEECH_RATE_OPTIONS.some((option) => option.rate === rate);
}

/** The speaker id to synthesize with: the saved choice, else the catalog default. */
export async function getPreferredSpeakerId(): Promise<number> {
  if (cachedSpeakerId !== null) {
    return cachedSpeakerId;
  }

  const stored = await preferencesStorage.getPreference<number | null>(
    storageKeys.readAloudVoice,
    null,
  );
  cachedSpeakerId =
    typeof stored === "number" && isKnownSpeakerId(stored)
      ? stored
      : DEFAULT_SHERPA_MODEL.speakerId;
  return cachedSpeakerId;
}

export async function setPreferredSpeakerId(speakerId: number): Promise<void> {
  if (!isKnownSpeakerId(speakerId)) {
    throw new Error(`Unknown read-aloud speaker id: ${speakerId}`);
  }
  cachedSpeakerId = speakerId;
  await preferencesStorage.setPreference(storageKeys.readAloudVoice, speakerId);
}

/** Global speech-speed multiplier chosen in settings (1.0 = normal). */
export async function getPreferredSpeechRate(): Promise<number> {
  if (cachedRate !== null) {
    return cachedRate;
  }

  const stored = await preferencesStorage.getPreference<number | null>(
    storageKeys.readAloudRate,
    null,
  );
  cachedRate = typeof stored === "number" && isKnownRate(stored) ? stored : DEFAULT_RATE;
  return cachedRate;
}

export async function setPreferredSpeechRate(rate: number): Promise<void> {
  if (!isKnownRate(rate)) {
    throw new Error(`Unknown read-aloud speech rate: ${rate}`);
  }
  cachedRate = rate;
  await preferencesStorage.setPreference(storageKeys.readAloudRate, rate);
}

/** Whether words light up while the coach reads (on by default). */
export async function getWordHighlightEnabled(): Promise<boolean> {
  if (cachedWordHighlight !== null) {
    return cachedWordHighlight;
  }

  const stored = await preferencesStorage.getPreference<boolean | null>(
    storageKeys.readAloudWordHighlight,
    null,
  );
  cachedWordHighlight = typeof stored === "boolean" ? stored : true;
  return cachedWordHighlight;
}

export async function setWordHighlightEnabled(enabled: boolean): Promise<void> {
  cachedWordHighlight = enabled;
  await preferencesStorage.setPreference(storageKeys.readAloudWordHighlight, enabled);
}
