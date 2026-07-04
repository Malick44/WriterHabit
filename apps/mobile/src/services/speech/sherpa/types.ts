/**
 * On-device TTS model types for the sherpa-onnx read-aloud engine.
 *
 * WriterHabit ships a single Supertonic-3 voice for reading short coaching
 * snippets aloud (docs/06_AI_COACH_ARCHITECTURE, Grades 1–2 optional
 * read-aloud). The structure mirrors the VoiceReader reference integration
 * but is deliberately trimmed to one model family and one default voice.
 */

export type SherpaModelFamily = "supertonic";

export interface SherpaModelDescriptor {
  id: string;
  family: SherpaModelFamily;
  displayName: string;
  /** BCP-47 tag of the voice's primary language, e.g. "en-US". */
  language: string;
  /**
   * Supertonic packs 10 preset voice styles into one archive, selected by
   * speaker id: sid 0–4 → Female 1–5, sid 5–9 → Male 1–5.
   */
  speakerId: number;
  /** ISO-639-1 prefixes the model can speak (Supertonic-3 covers 31). */
  supportedLanguages: readonly string[];
  sampleRate: number;
  archiveUrl: string;
  /** Approximate archive size, used for download progress. */
  sizeBytes: number;
}

/** A descriptor plus the on-disk paths resolved after extraction. */
export interface RegisteredSherpaModel extends SherpaModelDescriptor {
  /** Absolute directory (no file:// prefix) holding the extracted model. */
  localDir: string;
  /**
   * Absolute path to a representative .onnx file. Supertonic is a multi-file
   * pipeline; the native layer auto-detects the full set from the directory
   * this path lives in.
   */
  modelPath: string;
  /** Absolute path to voice.bin (the 10 packed voice styles). */
  voiceBinPath: string;
  registeredAt: number;
}

export type SherpaModelDownloadPhase =
  | "downloading"
  | "extracting"
  | "registering"
  | "done"
  | "error";

export interface SherpaModelDownloadProgress {
  modelId: string;
  phase: SherpaModelDownloadPhase;
  /** 0..1 within the current phase (download bytes; extraction entries). */
  progress: number;
  error?: string;
}
