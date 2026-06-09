import { typography, type GradeBand } from "@/design/tokens";

import type {
  WritingMetrics,
  WritingValidationResult,
  WritingWorkspaceGradeAdaptation,
} from "../types";

const wordPattern = /[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g;
const sentencePattern = /[^.!?]+[.!?]+|[^.!?]+$/g;

export function getWritingMetrics(text: string): WritingMetrics {
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      paragraphCount: 0,
      sentenceCount: 0,
      wordCount: 0,
    };
  }

  const words = trimmed.match(wordPattern) ?? [];
  const sentences = trimmed.match(sentencePattern)?.filter((sentence) => sentence.trim().length > 0) ?? [];
  const paragraphs = trimmed.split(/\n{2,}/).filter((paragraph) => paragraph.trim().length > 0);

  return {
    paragraphCount: paragraphs.length,
    sentenceCount: sentences.length,
    wordCount: words.length,
  };
}

export function getWritingValidation(text: string): WritingValidationResult {
  const metrics = getWritingMetrics(text);

  return {
    canSubmit: metrics.wordCount > 0,
    error: metrics.wordCount > 0 ? null : "empty_draft",
    metrics,
  };
}

export function getWritingWorkspaceGradeAdaptation(gradeLevel: number): WritingWorkspaceGradeAdaptation {
  const band: GradeBand = typography.getGradeBandForGrade(gradeLevel);

  switch (band) {
    case "elementary":
      return {
        band,
        editorMinHeight: 220,
        showDetailedRubric: false,
        showOutlineSupport: false,
        visibleCoachActionCount: 3,
      };
    case "high":
      return {
        band,
        editorMinHeight: 360,
        showDetailedRubric: true,
        showOutlineSupport: true,
        visibleCoachActionCount: 7,
      };
    case "middle":
      return {
        band,
        editorMinHeight: 300,
        showDetailedRubric: true,
        showOutlineSupport: true,
        visibleCoachActionCount: 5,
      };
  }
}
