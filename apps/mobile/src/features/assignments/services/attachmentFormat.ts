const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * 1024;

/**
 * Formats an attachment byte size into a short human label (e.g. "240 KB").
 * Returns null when the size is unknown so callers can omit it.
 */
export function formatAttachmentSize(sizeBytes?: number): string | null {
  if (sizeBytes === undefined || !Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return null;
  }

  if (sizeBytes < KILOBYTE) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < MEGABYTE) {
    return `${Math.round(sizeBytes / KILOBYTE)} KB`;
  }

  return `${(sizeBytes / MEGABYTE).toFixed(1)} MB`;
}
