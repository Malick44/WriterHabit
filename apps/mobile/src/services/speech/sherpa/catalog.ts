import type { SherpaModelDescriptor } from "./types";

/**
 * The single on-device voice WriterHabit ships: Supertonic-3 (int8) from the
 * official k2-fsa releases, repacked with an 11th custom voice style. One
 * ~123 MB archive carries a multilingual model (31 languages) with its own
 * text frontend — no espeak-ng data or lexicon — and 11 voice styles in
 * voice.bin selected by speaker id: the 10 stock styles (sid 0–4 female,
 * 5–9 male) plus WriterHabit's blended custom voice at sid 10 (60% F2 +
 * 40% F5, built with scripts/tts/mix_voice_styles.py). Change `speakerId`
 * to re-voice the app without re-downloading anything. This descriptor is
 * authoritative for the voice style: the read-aloud facade applies this
 * `speakerId` at synthesis time, overriding whatever was persisted in the
 * model registry when the archive was first downloaded. The `id` is bumped
 * whenever the hosted archive contents change so installed devices
 * re-download into a fresh directory.
 */
export const DEFAULT_SHERPA_MODEL: SherpaModelDescriptor = {
  id: "sherpa-onnx-supertonic-3-tts-int8-2026-05-11-writerhabit-11v",
  family: "supertonic",
  displayName: "WriterHabit Coach (Custom Blend)",
  language: "en-US",
  speakerId: 10,
  supportedLanguages: [
    "en", "ko", "ja", "ar", "bg", "cs", "da", "de", "el", "es", "et", "fi",
    "fr", "hi", "hr", "hu", "id", "it", "lt", "lv", "nl", "pl", "pt", "ro",
    "ru", "sk", "sl", "sv", "tr", "uk", "vi",
  ],
  sampleRate: 44100,
  // WriterHabit-hosted repack of the official k2-fsa archive (10 stock
  // styles + the custom blend from scripts/tts/custom-voice-styles/).
  // Rebuild and re-host with scripts/tts/repack-supertonic-voices.sh +
  // upload-supertonic-archive.sh when changing voice styles.
  archiveUrl:
    "https://supabase.app.ai-orbit-studio.com/storage/v1/object/public/tts-models/sherpa-onnx-supertonic-3-tts-int8-2026-05-11-writerhabit-11v.tar.bz2",
  sizeBytes: 128_830_298,
};

/**
 * Every voice style packed into the shipped archive's voice.bin, in speaker-id
 * order. `key` is a stable identifier the settings UI maps to i18n labels;
 * speaker ids must match the sid table printed by
 * scripts/tts/repack-supertonic-voices.sh.
 */
export interface SherpaVoiceStyle {
  key: string;
  speakerId: number;
}

export const VOICE_STYLES: readonly SherpaVoiceStyle[] = [
  { key: "female1", speakerId: 0 },
  { key: "female2", speakerId: 1 },
  { key: "female3", speakerId: 2 },
  { key: "female4", speakerId: 3 },
  { key: "female5", speakerId: 4 },
  { key: "male1", speakerId: 5 },
  { key: "male2", speakerId: 6 },
  { key: "male3", speakerId: 7 },
  { key: "male4", speakerId: 8 },
  { key: "male5", speakerId: 9 },
  { key: "coachBlend", speakerId: 10 },
];
