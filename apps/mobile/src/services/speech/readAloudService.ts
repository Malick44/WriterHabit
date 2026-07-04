/**
 * Read-aloud (text-to-speech) for accessibility.
 *
 * WriterHabit reads coaching text aloud for younger students — the Grades 1–2
 * tone explicitly calls for "optional read-aloud" (docs/06_AI_COACH_ARCHITECTURE)
 * — and the shared TextActionBar exposes a read-aloud action over coach messages
 * and feedback.
 *
 * Synthesis is on-device only: the downloaded sherpa-onnx Supertonic voice
 * renders WAV clips that play through react-native-track-player. There is no
 * platform-engine fallback — when the native modules are absent (Expo Go,
 * tests), `readAloud` reports the failure through `onError`. When the voice
 * model is not installed yet, `readAloud` downloads it first (concurrent
 * calls share one download) and then speaks; callers can show a preparing
 * state until `onStart` fires. It is NOT a narration engine — do not feed
 * it whole essays. Feature code depends only on this facade, never on the
 * TTS engines directly.
 */
import * as FileSystem from "expo-file-system/legacy";

import { getPreferredSpeakerId } from "./readAloudVoicePreference";
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
  /** Fired when audio actually starts playing (after any model download). */
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: unknown) => void;
};

/** Bumped on every readAloud/stop so stale async synthesis work exits early. */
let generation = 0;
let utteranceDirUri: string | null = null;

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

function isLanguageSupported(language?: string): boolean {
  if (!language) {
    return true;
  }
  const prefix = language.toLowerCase().split("-")[0];
  return DEFAULT_SHERPA_MODEL.supportedLanguages.includes(prefix);
}

async function discardUtteranceDir(): Promise<void> {
  const dir = utteranceDirUri;
  utteranceDirUri = null;
  if (dir) {
    await FileSystem.deleteAsync(dir, { idempotent: true }).catch(() => {});
  }
}

async function speakWithOnDeviceVoice(
  text: string,
  options: ReadAloudOptions,
  activeGeneration: number,
): Promise<void> {
  // Voice not installed yet: download it now (concurrent calls share one
  // download) and keep speaking once it lands, unless the caller stopped.
  const registered =
    (await getRegisteredModel(DEFAULT_SHERPA_MODEL.id)) ??
    (await ensureSherpaModel(DEFAULT_SHERPA_MODEL));
  // The student's settings choice (falling back to the catalog default) is
  // authoritative for the voice style; the registry may hold a speakerId
  // persisted by an older catalog version.
  const model = { ...registered, speakerId: await getPreferredSpeakerId() };

  const chunks = chunkTextForSynthesis(text);
  if (chunks.length === 0 || generation !== activeGeneration) {
    return;
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
    throw new Error("Audio playback is unavailable in this binary.");
  }

  let queuedClips = 0;
  try {
    for (const [index, chunk] of chunks.entries()) {
      if (generation !== activeGeneration || !session.isActive) {
        return;
      }
      const { wavPath } = await synthesizeToWav(
        chunk,
        model,
        `${dirUri.replace("file://", "")}clip-${index}.wav`,
        options.rate ?? 1.0,
      );
      if (generation !== activeGeneration || !session.isActive) {
        return;
      }
      await session.addClip(wavPath);
      queuedClips += 1;
      if (queuedClips === 1) {
        // The first clip starts playback inside addClip.
        options.onStart?.();
      }
    }
    session.finalize();
  } catch (error) {
    if (queuedClips === 0) {
      // Nothing audible happened yet — release the session and report.
      await session.stop();
      await discardUtteranceDir();
      throw error;
    }
    // Some audio already played; finish what is queued rather than cutting off.
    console.warn(
      "[readAloud] On-device synthesis failed mid-passage; finishing queued audio.",
      error instanceof Error ? error.message : String(error),
    );
    session.finalize();
  }
}

/**
 * Speak a short piece of text. Any in-progress utterance is stopped first so
 * taps don't queue up overlapping audio. Failures (voice not downloaded yet,
 * native modules missing, unsupported language) surface through `onError`.
 */
export function readAloud(text: string, options: ReadAloudOptions = {}): void {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  generation += 1;
  const activeGeneration = generation;
  void stopSpeechPlayback();
  void discardUtteranceDir();

  if (!isSherpaAvailable() || !isTrackPlayerAvailable()) {
    options.onError?.(new Error("On-device text-to-speech is unavailable in this binary."));
    return;
  }
  if (!isLanguageSupported(options.language)) {
    options.onError?.(new Error(`Read-aloud does not support the "${options.language}" language.`));
    return;
  }

  void speakWithOnDeviceVoice(trimmed, options, activeGeneration).catch((error: unknown) => {
    if (generation === activeGeneration) {
      options.onError?.(error);
    }
  });
}

/** Stop any current read-aloud. Call on unmount, navigation away, or app background. */
export function stopReadAloud(): void {
  generation += 1;
  void stopSpeechPlayback();
  void discardUtteranceDir();
}

/** Whether the device is currently speaking. */
export function isReadingAloud(): boolean {
  return isSpeechPlaybackActive();
}
