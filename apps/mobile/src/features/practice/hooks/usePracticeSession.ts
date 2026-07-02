import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/core/supabase/supabaseClient";

export interface PracticeSessionState {
  /** Streak length the student reaches after completing this task. */
  streakAfterComplete: number;
  isComplete: boolean;
  answer: string;
  setAnswer: (value: string) => void;
  complete: (evidence?: PracticeCompletionEvidence) => Promise<void>;
  reset: () => void;
}

const DEFAULT_DEMO_STREAK_AFTER_COMPLETE = 13;

type PracticeSessionInput = {
  estimatedMinutes?: number;
  skillId?: string;
  taskId?: string;
};

type PracticeSessionRow = {
  completed_on: string;
};

export type PracticeCompletionEvidence = {
  attachmentCount?: number;
  extractedText?: string;
  responseText?: string;
  usedCanvas?: boolean;
};

export const MAX_PRACTICE_EVIDENCE_TEXT_LENGTH = 1000;

export function normalizePracticeEvidenceText(value?: string): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";

  if (!normalized) {
    return null;
  }

  return normalized.length <= MAX_PRACTICE_EVIDENCE_TEXT_LENGTH
    ? normalized
    : normalized.slice(0, MAX_PRACTICE_EVIDENCE_TEXT_LENGTH).trimEnd();
}

export function normalizePracticeAttachmentCount(value?: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(12, Math.floor(value ?? 0)));
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getConsecutiveDayCount(
  rows: PracticeSessionRow[],
  today = new Date(),
): number {
  const completedDays = new Set(
    rows.map((row) => row.completed_on).filter(Boolean),
  );
  let cursor = new Date(today);
  let count = 0;

  while (completedDays.has(toDateKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return count;
}

async function getSignedInStudentProfileId(): Promise<string | null> {
  const { data: authData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const session = authData?.session;

  if (!session) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return typeof profile?.id === "string" ? profile.id : null;
}

export function usePracticeSession(
  input: PracticeSessionInput = {},
): PracticeSessionState {
  const [isComplete, setIsComplete] = useState(false);
  const [answer, setAnswer] = useState("");
  const [streakAfterComplete, setStreakAfterComplete] = useState(
    DEFAULT_DEMO_STREAK_AFTER_COMPLETE,
  );

  const loadCompletionState = useCallback(async () => {
    if (!input.skillId || !input.taskId) {
      return;
    }

    try {
      const studentProfileId = await getSignedInStudentProfileId();

      if (!studentProfileId) {
        return;
      }

      const today = toDateKey(new Date());
      const { data: todayRows, error: todayError } = await supabase
        .from("practice_sessions")
        .select("completed_on, response_text")
        .eq("student_profile_id", studentProfileId)
        .eq("skill_id", input.skillId)
        .eq("task_id", input.taskId)
        .eq("completed_on", today);

      if (todayError) {
        throw todayError;
      }

      setIsComplete((todayRows ?? []).length > 0);
      const latestTodayRow = todayRows?.[0] as
        { response_text?: string | null } | undefined;

      if (typeof latestTodayRow?.response_text === "string") {
        setAnswer(latestTodayRow.response_text);
      }

      const { data: streakRows, error: streakError } = await supabase
        .from("practice_sessions")
        .select("completed_on")
        .eq("student_profile_id", studentProfileId)
        .order("completed_on", { ascending: false })
        .limit(30);

      if (streakError) {
        throw streakError;
      }

      setStreakAfterComplete(
        Math.max(
          1,
          getConsecutiveDayCount((streakRows ?? []) as PracticeSessionRow[]),
        ),
      );
    } catch (error) {
      console.error("Failed to load practice session from Supabase:", error);
    }
  }, [input.skillId, input.taskId]);

  useEffect(() => {
    void loadCompletionState();
  }, [loadCompletionState]);

  const complete = useCallback(
    async (evidence: PracticeCompletionEvidence = {}) => {
      setIsComplete(true);
      const responseText = normalizePracticeEvidenceText(
        evidence.responseText ?? answer,
      );

      if (!input.skillId || !input.taskId) {
        return;
      }

      try {
        const studentProfileId = await getSignedInStudentProfileId();

        if (!studentProfileId) {
          return;
        }

        const today = toDateKey(new Date());
        const { error } = await supabase.from("practice_sessions").upsert(
          {
            attachment_count: normalizePracticeAttachmentCount(
              evidence.attachmentCount,
            ),
            completed_on: today,
            estimated_minutes: input.estimatedMinutes ?? 0,
            extracted_text_excerpt: normalizePracticeEvidenceText(
              evidence.extractedText,
            ),
            response_text: responseText,
            skill_id: input.skillId,
            student_profile_id: studentProfileId,
            task_id: input.taskId,
            used_canvas: Boolean(evidence.usedCanvas),
          },
          { onConflict: "student_profile_id,skill_id,task_id,completed_on" },
        );

        if (error) {
          throw error;
        }

        const { data: streakRows, error: streakError } = await supabase
          .from("practice_sessions")
          .select("completed_on")
          .eq("student_profile_id", studentProfileId)
          .order("completed_on", { ascending: false })
          .limit(30);

        if (streakError) {
          throw streakError;
        }

        setStreakAfterComplete(
          Math.max(
            1,
            getConsecutiveDayCount((streakRows ?? []) as PracticeSessionRow[]),
          ),
        );
      } catch (error) {
        console.error("Failed to save practice session to Supabase:", error);
      }
    },
    [answer, input.estimatedMinutes, input.skillId, input.taskId],
  );
  const reset = useCallback(() => {
    setIsComplete(false);
    setAnswer("");
  }, []);

  return useMemo(
    () => ({
      streakAfterComplete,
      isComplete,
      answer,
      setAnswer,
      complete,
      reset,
    }),
    [answer, complete, isComplete, reset, streakAfterComplete],
  );
}
