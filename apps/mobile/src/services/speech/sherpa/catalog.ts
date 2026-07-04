import type { SherpaModelDescriptor } from "./types";

/**
 * The single on-device voice WriterHabit ships: Supertonic-3 (int8) from the
 * official k2-fsa releases. One ~123 MB archive carries a multilingual model
 * (31 languages) with its own text frontend — no espeak-ng data or lexicon —
 * and 10 preset voice styles in voice.bin selected by speaker id. We default
 * to the "Female 1" style (sid 0); change `speakerId` (0–4 female, 5–9 male)
 * to re-voice the app without re-downloading anything.
 */
export const DEFAULT_SHERPA_MODEL: SherpaModelDescriptor = {
  id: "sherpa-onnx-supertonic-3-tts-int8-2026-05-11",
  family: "supertonic",
  displayName: "Supertonic (Female 1)",
  language: "en-US",
  speakerId: 0,
  supportedLanguages: [
    "en", "ko", "ja", "ar", "bg", "cs", "da", "de", "el", "es", "et", "fi",
    "fr", "hi", "hr", "hu", "id", "it", "lt", "lv", "nl", "pl", "pt", "ro",
    "ru", "sk", "sl", "sv", "tr", "uk", "vi",
  ],
  sampleRate: 44100,
  archiveUrl:
    "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2",
  sizeBytes: 128_774_318,
};
