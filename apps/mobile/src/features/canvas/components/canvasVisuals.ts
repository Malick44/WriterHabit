import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

import { colors } from "@/design/tokens";

import type { CanvasSyncStatus, CanvasTemplate, CanvasTool } from "../types";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Shared visual configuration for canvas templates, tools, and sync states.
 * Co-locating these mappings keeps the cards, pills, previews, and toolbar
 * visually consistent and avoids repeating icon/label lookups per component.
 */

export const templateIcon: Record<CanvasTemplate, IoniconName> = {
  blank_page: "document-outline",
  lined_paper: "reader-outline",
  storyboard: "grid-outline",
  mind_map: "git-network-outline",
  essay_plan: "list-outline",
  vocabulary_web: "share-social-outline",
  handwriting_practice: "pencil-outline",
  annotate_passage: "brush-outline",
};

export const templateLabelKey = {
  blank_page: "canvas.templates.blankPage.label",
  lined_paper: "canvas.templates.linedPaper.label",
  storyboard: "canvas.templates.storyboard.label",
  mind_map: "canvas.templates.mindMap.label",
  essay_plan: "canvas.templates.essayPlan.label",
  vocabulary_web: "canvas.templates.vocabularyWeb.label",
  handwriting_practice: "canvas.templates.handwritingPractice.label",
  annotate_passage: "canvas.templates.annotatePassage.label",
} as const satisfies Record<CanvasTemplate, string>;

export const toolIcon: Record<CanvasTool, IoniconName> = {
  pen: "pencil",
  highlighter: "brush",
  eraser: "backspace-outline",
};

export const syncStatusIcon: Record<CanvasSyncStatus, IoniconName> = {
  local_only: "phone-portrait-outline",
  saving: "sync-outline",
  saved: "checkmark-circle",
  sync_failed: "alert-circle",
};

export const syncStatusTone: Record<CanvasSyncStatus, keyof typeof colors.feedback> = {
  local_only: "neutral",
  saving: "info",
  saved: "success",
  sync_failed: "error",
};
