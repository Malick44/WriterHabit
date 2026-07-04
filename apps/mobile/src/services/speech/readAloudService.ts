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

import { useReadAloudHighlightStore } from "./readAloudHighlightStore";
import {
  getPreferredSpeakerId,
  getPreferredSpeechRate,
  getWordHighlightEnabled,
} from "./readAloudVoicePreference";
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
import { estimateWordTimings, wordIndexAt, type WordTiming } from "./wordTimings";

/**
 * Compensates the ~4 Hz progress-event cadence and the engine's leading
 * silence so the highlight leads the ear slightly instead of trailing it
 * (mirrors the VoiceReader reference, which uses 0.2–0.6 s).
 */
const WORD_HIGHLIGHT_LOOKAHEAD_SEC = 0.25;

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

/**
 * How many synthesis loops are currently writing WAVs. While a loop is
 * writing, its utterance directory must NOT be deleted out from under the
 * native engine (that surfaces as "TTS: Failed to open output file") — the
 * loop notices the cancellation at its next checkpoint and deletes its own
 * directory instead.
 */
let synthesesInFlight = 0;

async function deleteDirQuietly(dirUri: string): Promise<void> {
  await FileSystem.deleteAsync(dirUri, { idempotent: true }).catch(() => {});
}

async function discardUtteranceDir(): Promise<void> {
  if (synthesesInFlight > 0) {
    return;
  }
  const dir = utteranceDirUri;
  utteranceDirUri = null;
  if (dir) {
    await deleteDirQuietly(dir);
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
  // The student's settings choices (falling back to defaults) are
  // authoritative: voice style overrides whatever speakerId the registry
  // persisted, the speed preference multiplies any per-surface rate, and the
  // highlight toggle gates the word timeline entirely.
  const [speakerId, preferredRate, highlightEnabled] = await Promise.all([
    getPreferredSpeakerId(),
    getPreferredSpeechRate(),
    getWordHighlightEnabled(),
  ]);
  const model = { ...registered, speakerId };
  const effectiveRate = (options.rate ?? 1.0) * preferredRate;

  const chunks = chunkTextForSynthesis(text);
  if (chunks.length === 0 || generation !== activeGeneration) {
    return;
  }

  // Word timeline for read-along highlighting: chunker output is already
  // whitespace-normalized, so the joined chunks ARE the utterance text that
  // ReadAloudText components match against. Per-chunk timings land as each
  // chunk's audio is synthesized.
  const chunkTimings: WordTiming[][] = chunks.map(() => []);
  const chunkWordOffsets: number[] = [];
  let wordCount = 0;
  for (const chunk of chunks) {
    chunkWordOffsets.push(wordCount);
    wordCount += chunk.split(" ").length;
  }
  if (highlightEnabled) {
    useReadAloudHighlightStore.getState().setUtterance(chunks.join(" "));
  }

  const dirUri = `${FileSystem.cacheDirectory ?? ""}sherpa/utterance-${Date.now()}/`;
  await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  utteranceDirUri = dirUri;

  // Handlers clean up THIS utterance's directory (not the module pointer,
  // which may already belong to a newer utterance by the time they fire).
  const releaseDir = () => {
    if (utteranceDirUri === dirUri) {
      utteranceDirUri = null;
    }
    return deleteDirQuietly(dirUri);
  };
  const session = await startSpeechPlayback("WriterHabit", {
    onDone: () => {
      useReadAloudHighlightStore.getState().clear();
      void releaseDir().then(options.onDone);
    },
    onError: (error) => {
      useReadAloudHighlightStore.getState().clear();
      void releaseDir().then(() => options.onError?.(error));
    },
    onProgress: (clipIndex, positionSec) => {
      const timings = chunkTimings[clipIndex];
      if (!timings || timings.length === 0) {
        return;
      }
      const local = wordIndexAt(timings, positionSec + WORD_HIGHLIGHT_LOOKAHEAD_SEC);
      if (local < 0) {
        return;
      }
      const globalIndex = chunkWordOffsets[clipIndex] + local;
      const store = useReadAloudHighlightStore.getState();
      if (store.activeWordIndex !== globalIndex) {
        store.setActiveWordIndex(globalIndex);
      }
    },
  });
  if (!session) {
    useReadAloudHighlightStore.getState().clear();
    await releaseDir();
    throw new Error("Audio playback is unavailable in this binary.");
  }

  let queuedClips = 0;
  synthesesInFlight += 1;
  try {
    for (const [index, chunk] of chunks.entries()) {
      if (generation !== activeGeneration || !session.isActive) {
        return;
      }
      const { wavPath, durationSeconds } = await synthesizeToWav(
        chunk,
        model,
        `${dirUri.replace("file://", "")}clip-${index}.wav`,
        effectiveRate,
      );
      if (generation !== activeGeneration || !session.isActive) {
        return;
      }
      if (highlightEnabled) {
        chunkTimings[index] = estimateWordTimings(chunk, durationSeconds);
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
    if (generation !== activeGeneration) {
      // The utterance was cancelled while the native engine was mid-write;
      // the failure is expected fallout, not something to report.
      return;
    }
    if (queuedClips === 0) {
      // Nothing audible happened yet — release the session and report.
      useReadAloudHighlightStore.getState().clear();
      await session.stop();
      await releaseDir();
      throw error;
    }
    // Some audio already played; finish what is queued rather than cutting off.
    console.warn(
      "[readAloud] On-device synthesis failed mid-passage; finishing queued audio.",
      error instanceof Error ? error.message : String(error),
    );
    session.finalize();
  } finally {
    synthesesInFlight -= 1;
    if (generation !== activeGeneration) {
      // Cancelled mid-loop: playback handlers will never fire for this
      // utterance, so the loop cleans up its own directory.
      void releaseDir();
    }
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
  useReadAloudHighlightStore.getState().clear();
  void stopSpeechPlayback();
  void discardUtteranceDir();
}

/** Whether the device is currently speaking. */
export function isReadingAloud(): boolean {
  return isSpeechPlaybackActive();
}
