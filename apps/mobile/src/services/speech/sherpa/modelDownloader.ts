/**
 * Download → extract → register pipeline for sherpa-onnx voice archives.
 *
 * Ports the archive branch of VoiceReader's ModelDownloader: fetch the
 * .tar.bz2 release with expo-file-system, extract it with the native
 * libarchive bridge exposed by react-native-sherpa-onnx, locate the .onnx /
 * tokens.txt / espeak-ng-data artefacts, and persist the result in the model
 * registry. Idempotent and deduplicated across concurrent callers.
 */
import * as FileSystem from "expo-file-system/legacy";

import {
  getRegisteredModel,
  registerModel,
  sherpaBaseDir,
  toFileUri,
  toPlainPath,
} from "./modelRegistry";
import type {
  RegisteredSherpaModel,
  SherpaModelDescriptor,
  SherpaModelDownloadProgress,
} from "./types";

type ExtractTarBz2 = (
  sourcePath: string,
  targetPath: string,
  force?: boolean,
) => Promise<unknown>;

function loadExtractor(): ExtractTarBz2 | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const download = require("react-native-sherpa-onnx/download") as {
      extractTarBz2?: ExtractTarBz2;
    };
    return typeof download.extractTarBz2 === "function" ? download.extractTarBz2 : null;
  } catch {
    return null;
  }
}

const inFlight = new Map<string, Promise<RegisteredSherpaModel>>();

/**
 * Ensure the given model is downloaded, extracted, and registered. Returns
 * the registered model; throws when the device is offline, extraction is
 * unavailable (Expo Go), or the archive is malformed.
 */
export function ensureSherpaModel(
  descriptor: SherpaModelDescriptor,
  onProgress?: (progress: SherpaModelDownloadProgress) => void,
): Promise<RegisteredSherpaModel> {
  const existing = inFlight.get(descriptor.id);
  if (existing) {
    return existing;
  }

  const task = installModel(descriptor, onProgress).finally(() => {
    inFlight.delete(descriptor.id);
  });
  inFlight.set(descriptor.id, task);
  return task;
}

async function installModel(
  descriptor: SherpaModelDescriptor,
  onProgress?: (progress: SherpaModelDownloadProgress) => void,
): Promise<RegisteredSherpaModel> {
  const registered = await getRegisteredModel(descriptor.id);
  if (registered) {
    return registered;
  }

  const extractTarBz2 = loadExtractor();
  if (!extractTarBz2) {
    throw new Error(
      "sherpa-onnx native module is unavailable; rebuild the dev client to enable on-device voices.",
    );
  }

  const report = (
    phase: SherpaModelDownloadProgress["phase"],
    progress: number,
    error?: string,
  ) => onProgress?.({ modelId: descriptor.id, phase, progress, error });

  const cacheBase = `${FileSystem.cacheDirectory ?? ""}sherpa/`;
  const archiveUri = `${cacheBase}${descriptor.id}.tar.bz2`;
  const scratchUri = `${cacheBase}extract-${descriptor.id}/`;
  const finalDirUri = `${sherpaBaseDir()}models/${descriptor.id}/`;

  try {
    await FileSystem.makeDirectoryAsync(cacheBase, { intermediates: true });

    report("downloading", 0);
    const download = FileSystem.createDownloadResumable(
      descriptor.archiveUrl,
      archiveUri,
      {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        const total = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : descriptor.sizeBytes;
        report("downloading", total > 0 ? Math.min(totalBytesWritten / total, 1) : 0);
      },
    );
    const result = await download.downloadAsync();
    if (!result || (result.status !== 200 && result.status !== 206)) {
      throw new Error(`Voice download failed with HTTP ${result?.status ?? "unknown"}`);
    }

    report("extracting", 0);
    await FileSystem.deleteAsync(scratchUri, { idempotent: true });
    await FileSystem.makeDirectoryAsync(scratchUri, { intermediates: true });
    // The native extractor expects plain, decoded filesystem paths.
    await extractTarBz2(toPlainPath(archiveUri), toPlainPath(scratchUri), true);

    report("registering", 0);
    const extractedDirUri = await resolveExtractedDir(scratchUri);
    await FileSystem.deleteAsync(finalDirUri, { idempotent: true });
    await FileSystem.makeDirectoryAsync(`${sherpaBaseDir()}models/`, { intermediates: true });
    await FileSystem.moveAsync({ from: extractedDirUri, to: finalDirUri });

    const model = await buildRegisteredModel(descriptor, finalDirUri);
    await registerModel(model);
    await removeStaleModelDirs(descriptor.id);

    report("done", 1);
    return model;
  } catch (error) {
    report("error", 0, error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await FileSystem.deleteAsync(archiveUri, { idempotent: true }).catch(() => {});
    await FileSystem.deleteAsync(scratchUri, { idempotent: true }).catch(() => {});
  }
}

/**
 * Delete extracted models other than the one just installed. The catalog id
 * is bumped whenever the hosted archive changes, so previous installs would
 * otherwise linger as multi-hundred-MB orphans.
 */
async function removeStaleModelDirs(keepModelId: string): Promise<void> {
  try {
    const modelsDirUri = `${sherpaBaseDir()}models/`;
    const entries = await FileSystem.readDirectoryAsync(modelsDirUri);
    for (const entry of entries) {
      if (entry !== keepModelId) {
        await FileSystem.deleteAsync(`${modelsDirUri}${entry}`, { idempotent: true });
      }
    }
  } catch {
    // Cleanup is best-effort; a leftover directory is not a functional issue.
  }
}

/** Archives wrap their content in a single top-level folder — unwrap it. */
async function resolveExtractedDir(scratchUri: string): Promise<string> {
  const entries = await FileSystem.readDirectoryAsync(scratchUri);
  if (entries.length === 1) {
    const only = `${scratchUri}${entries[0]}`;
    const info = await FileSystem.getInfoAsync(only);
    if (info.exists && info.isDirectory) {
      return `${only}/`;
    }
  }
  return scratchUri;
}

async function buildRegisteredModel(
  descriptor: SherpaModelDescriptor,
  modelDirUri: string,
): Promise<RegisteredSherpaModel> {
  // Supertonic is a multi-file pipeline (text_encoder / duration_predictor /
  // vector_estimator / vocoder .onnx plus tts.json, voice.bin and
  // unicode_indexer.bin). The native layer auto-detects the full set from the
  // directory, so any real .onnx works as the representative model path.
  const entries = await FileSystem.readDirectoryAsync(modelDirUri);
  const onnxFile = entries.find((entry) => entry.endsWith(".onnx"));
  if (!onnxFile) {
    throw new Error(`No .onnx file found in extracted voice archive for ${descriptor.id}`);
  }
  const voiceBin = entries.find((entry) => entry === "voice.bin");
  if (!voiceBin) {
    throw new Error(`No voice.bin found in extracted voice archive for ${descriptor.id}`);
  }

  const localDir = toPlainPath(modelDirUri);
  return {
    ...descriptor,
    localDir,
    modelPath: `${localDir}${onnxFile}`,
    voiceBinPath: `${localDir}${voiceBin}`,
    registeredAt: Date.now(),
  };
}

export { toFileUri };
