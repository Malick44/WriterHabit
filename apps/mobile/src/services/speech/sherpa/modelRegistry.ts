/**
 * File-backed registry of extracted sherpa-onnx models.
 *
 * A single JSON file under the app's document directory records where each
 * model was extracted. Validation is existence-only (mirroring the reference
 * integration): if any registered file went missing — app container moved,
 * user cleared storage — the entry is dropped so the downloader re-installs.
 */
import * as FileSystem from "expo-file-system/legacy";

import type { RegisteredSherpaModel } from "./types";

const REGISTRY_VERSION = 1;

interface RegistryFile {
  version: number;
  models: Record<string, RegisteredSherpaModel>;
}

/** Strip the file:// scheme so paths can be handed to the native module. */
export function toPlainPath(uri: string): string {
  const stripped = uri.startsWith("file://") ? uri.slice("file://".length) : uri;
  try {
    return decodeURIComponent(stripped);
  } catch {
    return stripped;
  }
}

/** Add the file:// scheme expected by expo-file-system and track-player. */
export function toFileUri(path: string): string {
  return path.startsWith("file://") ? path : `file://${path}`;
}

export function sherpaBaseDir(): string {
  return `${FileSystem.documentDirectory ?? ""}sherpa/`;
}

function registryPath(): string {
  return `${sherpaBaseDir()}registry.json`;
}

let cache: RegistryFile | null = null;

async function loadRegistry(): Promise<RegistryFile> {
  if (cache) {
    return cache;
  }

  try {
    const info = await FileSystem.getInfoAsync(registryPath());
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(registryPath());
      const parsed = JSON.parse(raw) as RegistryFile;
      if (parsed.version === REGISTRY_VERSION && parsed.models) {
        cache = parsed;
        return parsed;
      }
    }
  } catch {
    // Corrupt or unreadable registry — start fresh; models re-register on use.
  }

  cache = { version: REGISTRY_VERSION, models: {} };
  return cache;
}

async function persist(registry: RegistryFile): Promise<void> {
  cache = registry;
  await FileSystem.makeDirectoryAsync(sherpaBaseDir(), { intermediates: true });
  await FileSystem.writeAsStringAsync(registryPath(), JSON.stringify(registry));
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(toFileUri(path));
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Return the registered model when every recorded file still exists on disk;
 * otherwise drop the stale entry and return null so callers re-download.
 */
export async function getRegisteredModel(
  modelId: string,
): Promise<RegisteredSherpaModel | null> {
  const registry = await loadRegistry();
  const model = registry.models[modelId];
  if (!model) {
    return null;
  }

  const valid =
    (await fileExists(model.modelPath)) && (await fileExists(model.voiceBinPath));
  if (!valid) {
    delete registry.models[modelId];
    await persist(registry).catch(() => {});
    return null;
  }

  return model;
}

export async function registerModel(model: RegisteredSherpaModel): Promise<void> {
  const registry = await loadRegistry();
  registry.models[model.id] = model;
  await persist(registry);
}
