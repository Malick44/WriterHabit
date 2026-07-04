import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { copyTextToClipboard, isClipboardAvailable } from "@/services/clipboard/clipboardService";
import { readAloud, stopReadAloud } from "@/services/speech/readAloudService";

import type {
  TextActionBarAction,
  TextActionBarContext,
  TextActionBarFeedback,
  TextActionBarSourceType,
} from "./textActionBar.types";
import type { TextActionBarProps } from "./TextActionBar";

const COPIED_RESET_MS = 2000;

/** idle → loading (downloading voice / synthesizing) → playing → idle. */
export type ReadAloudStatus = "idle" | "loading" | "playing";

export interface UseTextActionBarInput {
  /** The coaching text the bar acts on (a hint, feedback note, suggestion…). */
  text: string;
  textId?: string;
  sourceType?: TextActionBarSourceType;
  /** Called once each time the student marks the text helpful / not helpful. */
  onLike?: (context: TextActionBarContext) => void;
  onDislike?: (context: TextActionBarContext) => void;
  /** Providing this surfaces the overflow button. */
  onMore?: (context: TextActionBarContext) => void;
  /** Set false to hide the thumbs (e.g. text with no feedback loop). */
  enableFeedback?: boolean;
  enableReadAloud?: boolean;
  enableCopy?: boolean;
}

export interface UseTextActionBarResult {
  feedback: TextActionBarFeedback;
  readAloudStatus: ReadAloudStatus;
  isCopied: boolean;
  /** Spread onto `TextActionBar`; only wired actions are included. */
  actionBarProps: Pick<
    TextActionBarProps,
    "onLike" | "onDislike" | "onReadAloud" | "onCopy" | "onMore" | "activeActions" | "loadingActions"
  >;
}

/**
 * Interaction logic for `TextActionBar`: optimistic was-this-helpful state,
 * read-aloud playback via the speech service, clipboard copy with a transient
 * "copied" acknowledgement, and forwarding to feature callbacks. Keeps every
 * side effect out of the presentational component so features (ai-coach,
 * feedback-review, progress) can share one behavior layer.
 */
export function useTextActionBar({
  text,
  textId,
  sourceType,
  onLike,
  onDislike,
  onMore,
  enableFeedback = true,
  enableReadAloud = true,
  enableCopy = true,
}: UseTextActionBarInput): UseTextActionBarResult {
  const [feedback, setFeedback] = useState<TextActionBarFeedback>(null);
  const [readAloudStatus, setReadAloudStatus] = useState<ReadAloudStatus>("idle");
  const [isCopied, setIsCopied] = useState(false);
  const readAloudStatusRef = useRef<ReadAloudStatus>("idle");
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    readAloudStatusRef.current = readAloudStatus;
  }, [readAloudStatus]);

  const context = useMemo<TextActionBarContext>(
    () => ({ sourceType, text, textId }),
    [sourceType, text, textId],
  );

  useEffect(
    () => () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      if (readAloudStatusRef.current !== "idle") {
        stopReadAloud();
      }
    },
    [],
  );

  const handleLike = useCallback(() => {
    if (feedback === "like") {
      setFeedback(null);
      return;
    }
    setFeedback("like");
    onLike?.(context);
  }, [context, feedback, onLike]);

  const handleDislike = useCallback(() => {
    if (feedback === "dislike") {
      setFeedback(null);
      return;
    }
    setFeedback("dislike");
    onDislike?.(context);
  }, [context, feedback, onDislike]);

  const handleReadAloud = useCallback(() => {
    // Any tap while preparing or playing cancels.
    if (readAloudStatusRef.current !== "idle") {
      stopReadAloud();
      setReadAloudStatus("idle");
      return;
    }

    setReadAloudStatus("loading");
    readAloud(text, {
      onStart: () => setReadAloudStatus("playing"),
      onDone: () => setReadAloudStatus("idle"),
      onError: () => setReadAloudStatus("idle"),
    });
  }, [text]);

  const handleCopy = useCallback(() => {
    void copyTextToClipboard(text).then((copied) => {
      if (!copied) {
        return;
      }

      setIsCopied(true);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
    });
  }, [text]);

  const handleMore = useCallback(() => {
    onMore?.(context);
  }, [context, onMore]);

  const activeActions: TextActionBarAction[] = [];
  if (feedback === "like") {
    activeActions.push("like");
  }
  if (feedback === "dislike") {
    activeActions.push("dislike");
  }
  if (readAloudStatus === "playing") {
    activeActions.push("readAloud");
  }
  if (isCopied) {
    activeActions.push("copy");
  }

  return {
    feedback,
    readAloudStatus,
    isCopied,
    actionBarProps: {
      activeActions,
      loadingActions: readAloudStatus === "loading" ? ["readAloud"] : [],
      onLike: enableFeedback ? handleLike : undefined,
      onDislike: enableFeedback ? handleDislike : undefined,
      onReadAloud: enableReadAloud ? handleReadAloud : undefined,
      onCopy: enableCopy && isClipboardAvailable() ? handleCopy : undefined,
      onMore: onMore ? handleMore : undefined,
    },
  };
}
