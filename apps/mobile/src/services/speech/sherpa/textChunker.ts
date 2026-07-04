/**
 * Sentence-aligned chunking so long read-aloud passages stream: the first
 * chunk starts playing while the rest are still being synthesized.
 */
const SENTENCE_BOUNDARY = /(?<=[.!?…])\s+/;

export function chunkTextForSynthesis(text: string, maxChars = 280): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }
  if (normalized.length <= maxChars) {
    return [normalized];
  }

  const sentences = normalized.split(SENTENCE_BOUNDARY);
  const chunks: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    if (buffer && buffer.length + sentence.length + 1 > maxChars) {
      chunks.push(buffer);
      buffer = sentence;
    } else {
      buffer = buffer ? `${buffer} ${sentence}` : sentence;
    }

    // A single sentence longer than maxChars is emitted whole rather than
    // split mid-word; the synthesis engine handles it, just less streamed.
    if (buffer.length > maxChars) {
      chunks.push(buffer);
      buffer = "";
    }
  }

  if (buffer) {
    chunks.push(buffer);
  }
  return chunks;
}
