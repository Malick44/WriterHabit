/**
 * Local file cache for canvas artifacts.
 *
 * WriterHabit's canvas feature is the only part of the app that writes meaningful
 * local files: editable stroke documents, exported preview images, and shareable
 * exports (see docs/07_CANVAS_ARCHITECTURE.md). This module is the thin,
 * feature-agnostic facade over the device file system so feature code never
 * imports `expo-file-system` directly.
 *
 * Keep it memory-safe (see skills/mobile-memory-guard): never read whole files
 * into memory just to size or copy them — operate on URIs and let the native
 * file APIs stream.
 */

/** The kind of canvas artifact a cached file represents. */
export type CanvasFileKind = "stroke-document" | "preview-image" | "export";

export type LocalFileDescriptor = {
  /** Absolute `file://` URI of the cached file. */
  uri: string;
  name: string;
  kind: CanvasFileKind;
  mimeType?: string;
  sizeBytes?: number;
};

/**
 * Persist a canvas artifact into the local cache and return its descriptor.
 *
 * TODO: back this with `expo-file-system` (copy/move into the app cache
 * directory under a `canvas/` namespace, then stat for `sizeBytes`). For now it
 * passes the descriptor through so the contract is stable for callers.
 */
export async function cacheCanvasFile(file: LocalFileDescriptor): Promise<LocalFileDescriptor> {
  return file;
}

/**
 * Resolve a previously cached canvas file by id/name, or `null` when absent.
 *
 * TODO: look up under the `canvas/` cache namespace via `expo-file-system`.
 */
export async function getCachedCanvasFile(_name: string): Promise<LocalFileDescriptor | null> {
  return null;
}

/**
 * Remove a cached canvas file. Idempotent: removing a missing file is a no-op.
 *
 * TODO: delete via `expo-file-system`; safe to call during storage cleanup
 * (see the Storage & Data Management Center prompt).
 */
export async function removeCachedCanvasFile(_name: string): Promise<void> {
  return;
}
