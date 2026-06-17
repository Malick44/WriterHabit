import { z } from "zod";

import type { AssignmentAttachment } from "./attachmentTypes";

export type TextExtractionErrorCode = "offline" | "unreadable" | "failed";

export class TextExtractionError extends Error {
  code: TextExtractionErrorCode;

  constructor(code: TextExtractionErrorCode, message: string) {
    super(message);
    this.name = "TextExtractionError";
    this.code = code;
  }
}

export interface TextExtractionResult {
  text: string;
}

const textExtractionScenarioSchema = z.enum([
  "success",
  "unreadable",
  "error",
  "offline",
]);

type TextExtractionScenario = z.infer<typeof textExtractionScenarioSchema>;

function readScenario(): TextExtractionScenario {
  const parsed = textExtractionScenarioSchema.safeParse(
    process.env.EXPO_PUBLIC_WriterHabit_OCR_SCENARIO,
  );

  return parsed.success ? parsed.data : "success";
}

const SIMULATED_DELAY_MS = 1100;

// Simulated handwriting transcriptions. A real provider (on-device OCR or a
// vision model) would replace `runExtraction` below; the rest of the flow is
// provider-agnostic. Mirrors the simulated approach used by aiCoachApi.
const SAMPLE_TRANSCRIPTIONS: readonly string[] = [
  "The old forest felt darker than Alex expected, but she kept walking. Every branch seemed to reach for her, yet she did not turn back. She wanted to find the hidden gate before the sun went down.",
  "My summer was full of small adventures. We hiked past the river, built a fort from fallen logs, and watched the stars blink awake one by one. I never wanted those long evenings to end.",
  "Reading every day has changed how I write. I notice new words, and I borrow the way my favorite authors build their sentences. Now my own paragraphs feel a little braver.",
  "When the storm finally passed, the whole street smelled like rain and fresh grass. Puddles held tiny reflections of the clouds, and I jumped through every one on my way home.",
];

function pickTranscription(seed: string): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }

  const safeIndex = Math.abs(hash) % SAMPLE_TRANSCRIPTIONS.length;

  return SAMPLE_TRANSCRIPTIONS[safeIndex] ?? SAMPLE_TRANSCRIPTIONS[0];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extracts text from an uploaded photo or file. Currently simulated; swap the
 * body for an on-device OCR or vision-model call to make it real. Resolves with
 * the recognized text or throws a {@link TextExtractionError}.
 */
export async function extractTextFromAttachment(
  attachment: AssignmentAttachment,
): Promise<TextExtractionResult> {
  await delay(SIMULATED_DELAY_MS);

  const scenario = readScenario();

  if (scenario === "offline") {
    throw new TextExtractionError("offline", "Text extraction is offline.");
  }

  if (scenario === "error") {
    throw new TextExtractionError("failed", "Text extraction failed.");
  }

  if (scenario === "unreadable") {
    throw new TextExtractionError("unreadable", "No readable text was found.");
  }

  return { text: pickTranscription(attachment.id) };
}

/**
 * Joins the recognized text from all successfully-extracted attachments, in
 * order, into a single response body. Pure and deterministic.
 */
export function composeExtractedText(
  attachments: readonly AssignmentAttachment[],
): string {
  return attachments
    .filter((attachment) => attachment.extraction.status === "done")
    .map((attachment) => attachment.extraction.text.trim())
    .filter((text) => text.length > 0)
    .join("\n\n");
}
