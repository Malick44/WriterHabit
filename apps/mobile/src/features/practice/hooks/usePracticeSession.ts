import { useCallback, useMemo, useState } from "react";

export interface PracticeSessionState {
  /** Streak length the student reaches after completing this task. */
  streakAfterComplete: number;
  isComplete: boolean;
  answer: string;
  setAnswer: (value: string) => void;
  complete: () => void;
  reset: () => void;
}

// UI-first session state. A real implementation would persist the answer and
// update the streak from a practice service.
const MOCK_STREAK_AFTER_COMPLETE = 13;

export function usePracticeSession(): PracticeSessionState {
  const [isComplete, setIsComplete] = useState(false);
  const [answer, setAnswer] = useState("");

  const complete = useCallback(() => setIsComplete(true), []);
  const reset = useCallback(() => {
    setIsComplete(false);
    setAnswer("");
  }, []);

  return useMemo(
    () => ({
      streakAfterComplete: MOCK_STREAK_AFTER_COMPLETE,
      isComplete,
      answer,
      setAnswer,
      complete,
      reset,
    }),
    [answer, complete, isComplete, reset],
  );
}
