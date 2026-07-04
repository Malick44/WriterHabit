/**
 * Persisted read-aloud voice choice.
 *
 * The shipped Supertonic archive packs several voice styles (see
 * sherpa/catalog.ts VOICE_STYLES); this module stores which speaker id the
 * student picked in settings. The read-aloud facade consults it on every
 * utterance, so changing the voice takes effect immediately — no re-download,
 * the styles all live in the installed voice.bin.
 */
import { preferencesStorage } from "@/services/storage/preferencesStorage";
import { storageKeys } from "@/services/storage/storageKeys";

import { DEFAULT_SHERPA_MODEL, VOICE_STYLES } from "./sherpa/catalog";

let cached: number | null = null;

function isKnownSpeakerId(speakerId: number): boolean {
  return VOICE_STYLES.some((style) => style.speakerId === speakerId);
}

/** The speaker id to synthesize with: the saved choice, else the catalog default. */
export async function getPreferredSpeakerId(): Promise<number> {
  if (cached !== null) {
    return cached;
  }

  const stored = await preferencesStorage.getPreference<number | null>(
    storageKeys.readAloudVoice,
    null,
  );
  cached =
    typeof stored === "number" && isKnownSpeakerId(stored)
      ? stored
      : DEFAULT_SHERPA_MODEL.speakerId;
  return cached;
}

export async function setPreferredSpeakerId(speakerId: number): Promise<void> {
  if (!isKnownSpeakerId(speakerId)) {
    throw new Error(`Unknown read-aloud speaker id: ${speakerId}`);
  }
  cached = speakerId;
  await preferencesStorage.setPreference(storageKeys.readAloudVoice, speakerId);
}
