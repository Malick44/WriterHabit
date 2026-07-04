/**
 * Read-aloud (text-to-speech) for accessibility.
 *
 * WriterHabit reads coaching text aloud for younger students — the Grades 1–2
 * tone explicitly calls for "optional read-aloud" (docs/06_AI_COACH_ARCHITECTURE)
 * — and the shared TextActionBar exposes a read-aloud action over coach messages
 * and feedback.
 *
 * Synthesis is on-device-first: a downloaded sherpa-onnx Supertonic voice
 * renders WAV clips that play through react-native-track-player. When the
 * native modules are absent (Expo Go, tests), the voice model has not been
 * downloaded yet, or a non-English language is requested, it falls back to
 * the platform engine via `expo-speech`. It is NOT a narration engine — do
 * not feed it whole essays. Feature code depends only on this facade, never
 * on the TTS engines directly.
 */
import * as FileSystem from "expo-file-system/legacy";
import * as Speech from "expo-speech";

import { DEFAULT_SHERPA_MODEL } from "./sherpa/catalog";
import { ensureSherpaModel } from "./sherpa/modelDownloader";
import { getRegisteredModel } from "./sherpa/modelRegistry";
import { isSherpaAvailable, synthesizeToWav } from "./sherpa/synthesisEngine";
import { chunkTextForSynthesis } from "./sherpa/textChunker";
import type { SherpaModelDownloadProgress } from "./sherpa/types";
import {
  isSpeechPlaybackActive,
  isTrackPlayerAvailable,
  startSpeechPlayback,
  stopSpeechPlayback,
} from "./trackPlayback";

export type ReadAloudOptions = {
  /** BCP-47 language tag, e.g. "en-US". Defaults to the device locale. */
  language?: string;
  /** 0.1 (slow) .. 2.0 (fast). Younger grades benefit from a slower rate. */
  rate?: number;
  /** 0.5 .. 2.0 voice pitch. Only honored by the platform fallback engine. */
  pitch?: number;
  onDone?: () => void;
  onError?: (error: unknown) => void;
};

/** Bumped on every readAloud/stop so stale async synthesis work exits early. */
let generation = 0;
let utteranceDirUri: string | null = null;
let bootstrapStarted = false;

/**
 * Download and register the on-device voice ahead of first use. Safe to call
 * repeatedly; concurrent calls share one download. Resolves false when the
 * native module is unavailable (Expo Go) or the download failed.
 */
export async function prepareOnDeviceReadAloudVoice(
  onProgress?: (progress: SherpaModelDownloadProgress) => void,
): Promise<boolean> {
  if (!isSherpaAvailable() || !isTrackPlayerAvailable()) {
    return false;
  }
  try {
    await ensureSherpaModel(DEFAULT_SHERPA_MODEL, onProgress);
    return true;
  } catch {
    return false;
  }
}

function canUseOnDeviceVoice(language?: string): boolean {
  if (language) {
    // Supertonic is multilingual but not universal; the platform engine
    // handles any locale outside its supported set.
    const prefix = language.toLowerCase().split("-")[0];
    if (!DEFAULT_SHERPA_MODEL.supportedLanguages.includes(prefix)) {
      return false;
    }
  }
  return isSherpaAvailable() && isTrackPlayerAvailable();
}

async function discardUtteranceDir(): Promise<void> {
  const dir = utteranceDirUri;
  utteranceDirUri = null;
  if (dir) {
    await FileSystem.deleteAsync(dir, { idempotent: true }).catch(() => {});
  }
}

function speakWithPlatformEngine(text: string, options: ReadAloudOptions): void {
  Speech.stop();
  Speech.speak(text, {
    language: options.language,
    rate: options.rate,
    pitch: options.pitch,
    onDone: options.onDone,
    onError: options.onError,
  });
}

async function speakWithOnDeviceVoice(
  text: string,
  options: ReadAloudOptions,
  activeGeneration: number,
): Promise<boolean> {
  const model = await getRegisteredModel(DEFAULT_SHERPA_MODEL.id);
  if (!model) {
    // Voice not installed yet: start the download once in the background so
    // future read-alouds are on-device, and let the caller fall back now.
    if (!bootstrapStarted) {
      bootstrapStarted = true;
      void prepareOnDeviceReadAloudVoice();
    }
    return false;
  }

  const chunks = chunkTextForSynthesis(text);
  if (chunks.length === 0 || generation !== activeGeneration) {
    return generation !== activeGeneration;
  }

  const dirUri = `${FileSystem.cacheDirectory ?? ""}sherpa/utterance-${Date.now()}/`;
  await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  utteranceDirUri = dirUri;

  const finish = (callback?: () => void) => {
    void discardUtteranceDir().then(callback);
  };
  const session = await startSpeechPlayback("WriterHabit", {
    onDone: () => finish(options.onDone),
    onError: (error) => {
      void discardUtteranceDir().then(() => options.onError?.(error));
    },
  });
  if (!session) {
    await discardUtteranceDir();
    return false;
  }

  let queuedClips = 0;
  try {
    for (const [index, chunk] of chunks.entries()) {
      if (generation !== activeGeneration || !session.isActive) {
        return true;
      }
      const { wavPath } = await synthesizeToWav(
        chunk,
        model,
        `${dirUri.replace("file://", "")}clip-${index}.wav`,
        options.rate ?? 1.0,
      );
      if (generation !== activeGeneration || !session.isActive) {
        return true;
      }
      await session.addClip(wavPath);
      queuedClips += 1;
    }
    session.finalize();
    return true;
  } catch (error) {
    if (queuedClips === 0) {
      // Nothing audible happened yet — let the platform engine take over.
      await session.stop();
      await discardUtteranceDir();
      return false;
    }
    // Some audio already played; finish what is queued rather than cutting off.
    console.warn(
      "[readAloud] On-device synthesis failed mid-passage; finishing queued audio.",
      error instanceof Error ? error.message : String(error),
    );
    session.finalize();
    return true;
  }
}

/**
 * Speak a short piece of text. Any in-progress utterance is stopped first so
 * taps don't queue up overlapping audio.
 */
export function readAloud(text: string, options: ReadAloudOptions = {}): void {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  generation += 1;
  const activeGeneration = generation;
  Speech.stop();
  void stopSpeechPlayback();
  void discardUtteranceDir();

  if (!canUseOnDeviceVoice(options.language)) {
    speakWithPlatformEngine(trimmed, options);
    return;
  }

  void speakWithOnDeviceVoice(trimmed, options, activeGeneration)
    .then((handled) => {
      if (!handled && generation === activeGeneration) {
        speakWithPlatformEngine(trimmed, options);
      }
    })
    .catch((error: unknown) => {
      if (generation === activeGeneration) {
        console.warn(
          "[readAloud] On-device voice failed; falling back to platform engine.",
          error instanceof Error ? error.message : String(error),
        );
        speakWithPlatformEngine(trimmed, options);
      }
    });
}

/** Stop any current read-aloud. Call on unmount, navigation away, or app background. */
export function stopReadAloud(): void {
  generation += 1;
  Speech.stop();
  void stopSpeechPlayback();
  void discardUtteranceDir();
}

/** Whether the device is currently speaking. */
export async function isReadingAloud(): Promise<boolean> {
  if (isSpeechPlaybackActive()) {
    return true;
  }
  return Speech.isSpeakingAsync();
}
