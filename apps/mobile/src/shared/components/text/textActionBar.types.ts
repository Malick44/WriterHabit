/** The five actions the bar can render, in display order. */
export type TextActionBarAction = "like" | "dislike" | "readAloud" | "copy" | "more";

/** "Was this helpful" selection state owned by the controller. */
export type TextActionBarFeedback = "like" | "dislike" | null;

/**
 * Kind of coaching text the bar is attached to. Open-ended so new features
 * can tag their own surfaces without touching the shared layer.
 */
export type TextActionBarSourceType =
  | "coach-message"
  | "feedback"
  | "hint"
  | "revision-task"
  | "brainstorm"
  | (string & {});

/** Passed to consumer callbacks so features can submit feedback or analytics. */
export interface TextActionBarContext {
  text: string;
  textId?: string;
  sourceType?: TextActionBarSourceType;
}
