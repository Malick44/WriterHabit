/**
 * Global read-along highlight state.
 *
 * `readAloudService` publishes which utterance is playing and which word is
 * active; `ReadAloudText` (shared/components/text) subscribes and lights up
 * the matching word wherever that text is rendered. Matching is by
 * whitespace-normalized text, and a component may render a *segment* of the
 * spoken utterance (e.g. one coach-response row out of a joined read-aloud) —
 * segments resolve to a word offset inside the utterance.
 */
import { create } from "zustand";

export interface ReadAloudHighlightState {
  /** Whitespace-normalized text of the utterance being read, or null. */
  utteranceText: string | null;
  /** Global word index (across the whole utterance) currently spoken. */
  activeWordIndex: number;
  setUtterance: (utteranceText: string) => void;
  setActiveWordIndex: (activeWordIndex: number) => void;
  clear: () => void;
}

export const useReadAloudHighlightStore = create<ReadAloudHighlightState>()((set) => ({
  utteranceText: null,
  activeWordIndex: -1,
  setUtterance: (utteranceText) => set({ utteranceText, activeWordIndex: -1 }),
  setActiveWordIndex: (activeWordIndex) => set({ activeWordIndex }),
  clear: () => set({ utteranceText: null, activeWordIndex: -1 }),
}));

export function normalizeUtteranceText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  return text.length === 0 ? 0 : text.split(" ").length;
}

/**
 * Where `segmentText` sits inside `utteranceText`, as a word offset.
 * Returns null when the segment is not part of the utterance.
 */
export function segmentWordOffset(
  utteranceText: string,
  segmentText: string,
): { offset: number; wordCount: number } | null {
  if (segmentText.length === 0) {
    return null;
  }
  if (utteranceText === segmentText) {
    return { offset: 0, wordCount: countWords(segmentText) };
  }

  const at = utteranceText.indexOf(segmentText);
  if (at === -1) {
    return null;
  }
  // Only accept word-boundary matches so "art" never matches inside "start".
  const beforeOk = at === 0 || utteranceText[at - 1] === " ";
  const end = at + segmentText.length;
  const afterOk = end === utteranceText.length || utteranceText[end] === " ";
  if (!beforeOk || !afterOk) {
    return null;
  }

  return {
    offset: countWords(utteranceText.slice(0, at).trim()),
    wordCount: countWords(segmentText),
  };
}
