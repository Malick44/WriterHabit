/**
 * Read-aloud (text-to-speech) for accessibility.
 *
 * WriteWise reads coaching text aloud for younger students — the Grades 1–2
 * tone explicitly calls for "optional read-aloud" (docs/06_AI_COACH_ARCHITECTURE)
 * — and the shared TextActionBar exposes a read-aloud action over coach messages
 * and feedback.
 *
 * This uses `expo-speech` (the device's built-in TTS): lightweight, no model
 * download, and appropriate for short coaching snippets. It is NOT a narration
 * engine — do not feed it whole essays. Feature code depends only on this
 * facade, never on `expo-speech` directly.
 */
import * as Speech from "expo-speech";

export type ReadAloudOptions = {
  /** BCP-47 language tag, e.g. "en-US". Defaults to the device locale. */
  language?: string;
  /** 0.1 (slow) .. 2.0 (fast). Younger grades benefit from a slower rate. */
  rate?: number;
  /** 0.5 .. 2.0 voice pitch. */
  pitch?: number;
  onDone?: () => void;
  onError?: (error: unknown) => void;
};

/**
 * Speak a short piece of text. Any in-progress utterance is stopped first so
 * taps don't queue up overlapping audio.
 */
export function readAloud(text: string, options: ReadAloudOptions = {}): void {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  Speech.stop();
  Speech.speak(trimmed, {
    language: options.language,
    rate: options.rate,
    pitch: options.pitch,
    onDone: options.onDone,
    onError: options.onError,
  });
}

/** Stop any current read-aloud. Call on unmount, navigation away, or app background. */
export function stopReadAloud(): void {
  Speech.stop();
}

/** Whether the device is currently speaking. */
export function isReadingAloud(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
