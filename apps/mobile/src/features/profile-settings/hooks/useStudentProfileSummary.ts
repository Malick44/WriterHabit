import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { useAuthSession } from "@/core/auth/useAuthSession";
import { supabase } from "@/core/supabase/supabaseClient";
import type { ProgressTotals } from "@/features/progress/types";

const studentProfileRowSchema = z.object({
  daily_goal_minutes: z.number().int().positive(),
  id: z.string().uuid(),
});

const progressTotalsRowSchema = z
  .object({
    ai_feedback_applied: z.number().int().nonnegative().catch(0),
    assignments_completed: z.number().int().nonnegative().catch(0),
    handwriting_minutes: z.number().int().nonnegative().catch(0),
    minutes_this_week: z.number().int().nonnegative().catch(0),
    revisions_completed: z.number().int().nonnegative().catch(0),
    words_written: z.number().int().nonnegative().catch(0),
  })
  .nullable();

const badgeRowSchema = z.object({
  progress_percent: z.coerce.number().min(0).max(100),
  status: z.enum(["locked", "in_progress", "unlocked"]),
});

export interface StudentProfileSummary {
  badgesEarned: number;
  badgesInReach: number;
  dailyGoalMinutes: number;
  level: number;
  levelProgress: number;
  points: number;
  xpToNext: number;
}

export type StudentProfileSummaryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty"; summary: StudentProfileSummary }
  | { status: "success"; summary: StudentProfileSummary };

const pointsPerLevel = 300;

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

export function calculateProfilePoints(
  totals?: Pick<
    ProgressTotals,
    | "aiFeedbackApplied"
    | "assignmentsCompleted"
    | "handwritingMinutes"
    | "minutesThisWeek"
    | "revisionsCompleted"
    | "wordsWritten"
  > | null,
): number {
  if (!totals) {
    return 0;
  }

  return (
    totals.assignmentsCompleted * 100 +
    totals.revisionsCompleted * 60 +
    totals.aiFeedbackApplied * 30 +
    totals.minutesThisWeek * 5 +
    totals.handwritingMinutes * 2 +
    Math.floor(totals.wordsWritten / 10)
  );
}

export function buildStudentProfileSummary(input?: {
  badgesEarned?: number;
  badgesInReach?: number;
  dailyGoalMinutes?: number;
  totals?: Pick<
    ProgressTotals,
    | "aiFeedbackApplied"
    | "assignmentsCompleted"
    | "handwritingMinutes"
    | "minutesThisWeek"
    | "revisionsCompleted"
    | "wordsWritten"
  > | null;
}): StudentProfileSummary {
  const points = calculateProfilePoints(input?.totals);
  const completedLevels = Math.floor(points / pointsPerLevel);
  const levelProgressPoints = points % pointsPerLevel;

  return {
    badgesEarned: input?.badgesEarned ?? 0,
    badgesInReach: input?.badgesInReach ?? 0,
    dailyGoalMinutes: input?.dailyGoalMinutes ?? 10,
    level: completedLevels + 1,
    levelProgress: clampProgress(levelProgressPoints / pointsPerLevel),
    points,
    xpToNext: pointsPerLevel - levelProgressPoints,
  };
}

async function fetchStudentProfileSummary(
  userId: string,
): Promise<StudentProfileSummary | null> {
  const { data: profileData, error: profileError } = await supabase
    .from("student_profiles")
    .select("id, daily_goal_minutes")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const profile = studentProfileRowSchema.nullable().parse(profileData);

  if (!profile) {
    return null;
  }

  const [totalsResult, badgesResult] = await Promise.all([
    supabase
      .from("student_progress_totals")
      .select(
        "assignments_completed, minutes_this_week, words_written, revisions_completed, ai_feedback_applied, handwriting_minutes",
      )
      .eq("student_profile_id", profile.id)
      .maybeSingle(),
    supabase
      .from("student_badges")
      .select("status, progress_percent")
      .eq("student_profile_id", profile.id),
  ]);

  if (totalsResult.error) {
    throw totalsResult.error;
  }

  if (badgesResult.error) {
    throw badgesResult.error;
  }

  const totalsRow = progressTotalsRowSchema.parse(totalsResult.data);
  const badgeRows = z.array(badgeRowSchema).parse(badgesResult.data ?? []);

  return buildStudentProfileSummary({
    badgesEarned: badgeRows.filter((badge) => badge.status === "unlocked")
      .length,
    badgesInReach: badgeRows.filter(
      (badge) =>
        badge.status === "in_progress" ||
        (badge.status === "locked" && badge.progress_percent > 0),
    ).length,
    dailyGoalMinutes: profile.daily_goal_minutes,
    totals: totalsRow
      ? {
          aiFeedbackApplied: totalsRow.ai_feedback_applied,
          assignmentsCompleted: totalsRow.assignments_completed,
          handwritingMinutes: totalsRow.handwriting_minutes,
          minutesThisWeek: totalsRow.minutes_this_week,
          revisionsCompleted: totalsRow.revisions_completed,
          wordsWritten: totalsRow.words_written,
        }
      : null,
  });
}

export function useStudentProfileSummary(
  fallbackTotals?: ProgressTotals | null,
): StudentProfileSummaryState {
  const { session } = useAuthSession();
  const userId = session?.source === "supabase" ? session.user.id : null;
  const fallbackSummary = useMemo(
    () => buildStudentProfileSummary({ totals: fallbackTotals }),
    [fallbackTotals],
  );
  const query = useQuery({
    enabled: Boolean(userId),
    queryFn: () => fetchStudentProfileSummary(userId ?? ""),
    queryKey: ["student-profile-summary", userId],
    retry: false,
    staleTime: 30_000,
  });

  if (!userId) {
    return {
      status: "empty",
      summary: fallbackSummary,
    };
  }

  if (query.isLoading && !query.data) {
    return {
      status: "loading",
    };
  }

  if (query.isError) {
    return {
      status: "error",
    };
  }

  if (!query.data) {
    return {
      status: "empty",
      summary: fallbackSummary,
    };
  }

  return {
    status: "success",
    summary: query.data,
  };
}
