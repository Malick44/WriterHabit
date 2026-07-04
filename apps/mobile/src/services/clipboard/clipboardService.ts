/**
 * Clipboard access for coaching text.
 *
 * WriterHabit only copies short coaching snippets (hints, feedback,
 * stronger-word suggestions) — never generated essays or final answers; the
 * AI coach does not produce those (docs/06_AI_COACH_ARCHITECTURE). Feature
 * code depends only on this facade, never on `expo-clipboard` directly.
 *
 * `expo-clipboard` is a native module, so it is loaded lazily: on a dev
 * client built before the module was added, importing it would crash every
 * screen that touches the shared component barrel (Metro reports a module
 * factory error as fatal even if the require is wrapped in try/catch). The
 * native module presence is probed via `requireOptionalNativeModule`, which
 * returns null instead of throwing, and the JS wrapper is only evaluated
 * when the probe succeeds. Until the dev client is rebuilt with the module,
 * the clipboard reports as unavailable and copy actions stay hidden.
 */
import { requireOptionalNativeModule } from "expo-modules-core";

type ClipboardModule = typeof import("expo-clipboard");

let clipboardModule: ClipboardModule | null | undefined;

function getClipboardModule(): ClipboardModule | null {
  if (clipboardModule === undefined) {
    clipboardModule = requireOptionalNativeModule("ExpoClipboard")
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy: only evaluated once the native module is confirmed present
        (require("expo-clipboard") as ClipboardModule)
      : null;
  }

  return clipboardModule;
}

/**
 * Copy a short piece of text to the device clipboard.
 * Resolves `true` on success, `false` when there was nothing to copy, the
 * platform rejected the write, or the native module is unavailable.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  const clipboard = getClipboardModule();
  if (!clipboard) {
    return false;
  }

  try {
    await clipboard.setStringAsync(trimmed);
    return true;
  } catch {
    return false;
  }
}

/** Whether the device clipboard is available (native module present). */
export function isClipboardAvailable(): boolean {
  return getClipboardModule() !== null;
}
