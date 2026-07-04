/**
 * Word-timing estimation for read-aloud highlighting.
 *
 * Each synthesized chunk has an exact audio duration (reported by the native
 * engine), so per-word times are estimated by distributing that duration
 * across the chunk's words proportionally to their visible length. For short
 * coaching snippets spoken at an even TTS cadence this tracks closely enough
 * for karaoke-style highlighting without shipping the ~wav2vec2 forced
 * alignment model the VoiceReader reference uses; the shape mirrors that
 * reference so an accurate aligner can slot in later.
 */

export interface WordTiming {
  /** Word text without surrounding whitespace. */
  word: string;
  /** Seconds from the start of the chunk's audio. */
  startSec: number;
  endSec: number;
}

/**
 * Split a chunk into words and estimate each word's window inside the
 * chunk's audio. Weighting uses word length + 1 (the trailing pause), which
 * approximates how evenly TTS voices pace short sentences.
 */
export function estimateWordTimings(chunkText: string, durationSeconds: number): WordTiming[] {
  const words = chunkText.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0 || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return [];
  }

  const weights = words.map((word) => word.length + 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  const timings: WordTiming[] = [];
  let cursor = 0;
  for (const [index, word] of words.entries()) {
    const slice = (weights[index] / totalWeight) * durationSeconds;
    timings.push({ word, startSec: cursor, endSec: cursor + slice });
    cursor += slice;
  }
  return timings;
}

/** Index of the word active at `positionSec`, or -1 when out of range. */
export function wordIndexAt(timings: readonly WordTiming[], positionSec: number): number {
  if (timings.length === 0 || positionSec < 0) {
    return -1;
  }

  let low = 0;
  let high = timings.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const timing = timings[mid];
    if (positionSec < timing.startSec) {
      high = mid - 1;
    } else if (positionSec >= timing.endSec) {
      low = mid + 1;
    } else {
      return mid;
    }
  }
  // Past the final word (e.g. trailing silence): keep the last word lit.
  return positionSec >= timings[timings.length - 1].endSec ? timings.length - 1 : -1;
}
