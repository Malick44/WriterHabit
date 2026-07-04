/**
 * Thin adapter around the react-native-sherpa-onnx TTS bridge.
 *
 * Holds one cached native engine (WriterHabit ships a single voice), builds
 * the Supertonic config, and synthesizes short coaching snippets to WAV
 * files. Ported from VoiceReader's SherpaBridge/SynthesisEngine, minus the
 * multi-model cache, provider benchmarking, and synthesis cache — with the
 * guard against implausibly short output kept, since that failure mode is
 * documented on Android.
 */
import { Platform } from "react-native";

import { toPlainPath } from "./modelRegistry";
import type { RegisteredSherpaModel } from "./types";

interface SherpaGeneratedAudio {
  samples: ArrayLike<number>;
  sampleRate: number;
}

interface SherpaTtsEngine {
  generateSpeech(
    text: string,
    options: { sid: number; speed: number },
  ): Promise<SherpaGeneratedAudio>;
  generateSpeechToFile?(
    text: string,
    filePath: string,
    options: { sid: number; speed: number },
  ): Promise<{ numSamples?: number; sampleRate?: number }>;
  destroy?(): Promise<void>;
}

interface SherpaTtsModule {
  createTTS(options: {
    modelPath: { type: "file"; path: string };
    modelType: "supertonic";
    maxNumSentences: number;
    numThreads: number;
    provider?: string;
  }): Promise<SherpaTtsEngine>;
  saveAudioToFile?(audio: SherpaGeneratedAudio, filePath: string): Promise<void>;
}

export interface SynthesisResult {
  /** Plain absolute path (no file://) of the generated WAV. */
  wavPath: string;
  durationSeconds: number;
}

function loadTtsModule(): SherpaTtsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-sherpa-onnx/tts") as SherpaTtsModule;
    return typeof mod.createTTS === "function" ? mod : null;
  } catch {
    return null;
  }
}

/** True when the native sherpa module is linked into this binary. */
export function isSherpaAvailable(): boolean {
  return loadTtsModule() !== null;
}

let engineModelDir: string | null = null;
let enginePromise: Promise<SherpaTtsEngine> | null = null;

async function getEngine(model: RegisteredSherpaModel): Promise<SherpaTtsEngine> {
  const ttsModule = loadTtsModule();
  if (!ttsModule) {
    throw new Error("sherpa-onnx native module is unavailable in this binary.");
  }

  const modelDir = toPlainPath(model.localDir).replace(/\/+$/, "");
  if (enginePromise && engineModelDir === modelDir) {
    return enginePromise;
  }

  engineModelDir = modelDir;
  enginePromise = ttsModule
    .createTTS({
      modelPath: { type: "file", path: modelDir },
      modelType: "supertonic",
      maxNumSentences: 1,
      numThreads: 2,
      // Supertonic ships int8 ONNX models: CoreML/NNAPI either fail to
      // accelerate the int8 ops or pay a graph-partitioning cost that exceeds
      // the CPU baseline, so pin CPU (mirrors the reference integration).
      provider: "cpu",
    })
    .catch((error: unknown) => {
      enginePromise = null;
      engineModelDir = null;
      throw error instanceof Error ? error : new Error(String(error));
    });
  return enginePromise;
}

/** Words-per-second floor used to reject implausibly short native output. */
function minimumPlausibleDuration(text: string): number {
  const words = text.trim().split(/\s+/).length;
  // Natural speech runs ~2.5–3 words/second; accept anything above a third.
  return Math.min(1.2, Math.max(0.3, words / 9));
}

async function runSynthesis(
  engine: SherpaTtsEngine,
  ttsModule: SherpaTtsModule,
  text: string,
  outputPath: string,
  sid: number,
  speed: number,
): Promise<number> {
  // Android (with the generateTtsToFile patch) writes the WAV natively,
  // avoiding large sample arrays crossing the bridge.
  if (Platform.OS === "android" && typeof engine.generateSpeechToFile === "function") {
    const generated = await engine.generateSpeechToFile(text, outputPath, { sid, speed });
    const sampleRate =
      typeof generated.sampleRate === "number" && generated.sampleRate > 0
        ? generated.sampleRate
        : 44100;
    return (generated.numSamples ?? 0) / sampleRate;
  }

  const generated = await engine.generateSpeech(text, { sid, speed });
  if (typeof ttsModule.saveAudioToFile !== "function") {
    throw new Error("saveAudioToFile is unavailable in react-native-sherpa-onnx/tts");
  }
  await ttsModule.saveAudioToFile(generated, outputPath);
  const sampleRate = generated.sampleRate > 0 ? generated.sampleRate : 44100;
  return generated.samples.length / sampleRate;
}

/**
 * Synthesize `text` to a WAV file at `outputPath` (plain path, no file://).
 * Throws when output is implausibly short so callers can fall back to the
 * platform speech engine instead of playing corrupted audio.
 */
export async function synthesizeToWav(
  text: string,
  model: RegisteredSherpaModel,
  outputPath: string,
  speed = 1.0,
): Promise<SynthesisResult> {
  const ttsModule = loadTtsModule();
  if (!ttsModule) {
    throw new Error("sherpa-onnx native module is unavailable in this binary.");
  }

  const engine = await getEngine(model);
  // NFC: collapse decomposed accents before the native text frontend sees them.
  const prepared = text.normalize("NFC").trim();
  const plainOutput = toPlainPath(outputPath);

  const durationSeconds = await runSynthesis(
    engine,
    ttsModule,
    prepared,
    plainOutput,
    model.speakerId,
    speed,
  );
  if (durationSeconds < minimumPlausibleDuration(prepared)) {
    throw new Error(
      `On-device voice produced implausibly short audio (${durationSeconds.toFixed(2)}s) for ${prepared.length} chars.`,
    );
  }

  return { wavPath: plainOutput, durationSeconds };
}

/** Release the cached native engine (frees the loaded ONNX model). */
export async function releaseSherpaEngine(): Promise<void> {
  const pending = enginePromise;
  enginePromise = null;
  engineModelDir = null;
  if (!pending) {
    return;
  }
  try {
    const engine = await pending;
    await engine.destroy?.();
  } catch {
    // Engine never initialized — nothing to release.
  }
}
