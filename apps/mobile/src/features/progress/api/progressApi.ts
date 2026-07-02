import type { GradeLevel } from "@WriterHabit/shared";
import { z } from "zod";

import { apiClient } from "@/core/api/apiClient";
import { supabase } from "@/core/supabase/supabaseClient";
import {
  progressApiResponseSchema,
  progressScenarioSchema,
  type ProgressApiResponse,
  type ProgressDailyActivity,
  type ProgressScenario,
  type ProgressSkill,
  type ProgressTotals,
  type ProgressWeeklyHighlight,
  writingSkillSchema,
} from "../types";

interface GetProgressDashboardInput {
  gradeLevel?: GradeLevel;
  studentId: string;
}

const localizedCopySchema = z.object({
  fallback: z.string().min(1),
  key: z.string().min(1),
});

const backendActivityDaySchema = z.object({
  activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  aiFeedbackApplied: z.number().int().nonnegative(),
  assignmentsCompleted: z.number().int().nonnegative(),
  handwritingMinutes: z.number().int().nonnegative(),
  minutesPracticed: z.number().int().nonnegative(),
  practicedSkills: z.array(writingSkillSchema),
  revisionsCompleted: z.number().int().nonnegative(),
  rubricImprovement: z.number().int().nonnegative(),
  wordsWritten: z.number().int().nonnegative(),
});

const backendProgressResponseSchema = z.object({
  activityDays: z.array(backendActivityDaySchema).default([]),
  connectionStatus: z.literal("online"),
  generatedAt: z.string().datetime(),
  gradeLevel: z.number().int().min(1).max(12),
  skills: z.array(
    z.object({
      currentScore: z.number(),
      label: localizedCopySchema,
      level: z.number().int().nonnegative(),
      previousScore: z.number(),
      skill: writingSkillSchema,
    }),
  ),
  streak: z.object({
    bestDays: z.number().int().nonnegative(),
    currentDays: z.number().int().nonnegative(),
    practicedToday: z.boolean(),
    status: z.string().min(1),
  }),
  studentId: z.string().min(1),
  totals: z.object({
    aiFeedbackApplied: z.number().int().nonnegative(),
    assignmentsCompleted: z.number().int().nonnegative(),
    handwritingMinutes: z.number().int().nonnegative(),
    minutesThisWeek: z.number().int().nonnegative(),
    revisionsCompleted: z.number().int().nonnegative(),
    rubricImprovement: z.number().nonnegative(),
    weeklyMinutesGoal: z.number().int().nonnegative(),
    wordsWritten: z.number().int().nonnegative(),
  }),
  weeklyReview: z
    .object({
      celebration: localizedCopySchema,
      focusForNextWeek: localizedCopySchema,
      weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .nullable(),
});

type BackendProgressResponse = z.infer<typeof backendProgressResponseSchema>;

function readScenario(): ProgressScenario {
  const parsed = progressScenarioSchema.safeParse(process.env.EXPO_PUBLIC_WriterHabit_PROGRESS_SCENARIO);

  return parsed.success ? parsed.data : "success";
}

function getGradeLevel(input: GetProgressDashboardInput): GradeLevel {
  return input.gradeLevel ?? 7;
}

function getWeeklyMinutesGoal(gradeLevel: GradeLevel): number {
  if (gradeLevel <= 5) {
    return 50;
  }

  if (gradeLevel <= 8) {
    return 75;
  }

  return 125;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function mapBackendSkill(input: {
  activityDays: BackendProgressResponse["activityDays"];
  generatedAt: string;
  skill: BackendProgressResponse["skills"][number];
}): ProgressSkill {
  const matchingDays = input.activityDays.filter((day) => day.practicedSkills.includes(input.skill.skill));
  const trendDate = matchingDays.at(-1)?.activityDate ?? input.generatedAt.slice(0, 10);

  return {
    aiFeedbackApplied: matchingDays.reduce((sum, day) => sum + day.aiFeedbackApplied, 0),
    currentScore: clampScore(input.skill.currentScore),
    handwritingMinutes: matchingDays.reduce((sum, day) => sum + day.handwritingMinutes, 0),
    minutesPracticed: matchingDays.reduce((sum, day) => sum + day.minutesPracticed, 0),
    practiceCount: matchingDays.length,
    previousScore: clampScore(input.skill.previousScore),
    recentTrend: [
      { date: trendDate, score: clampScore(input.skill.previousScore) },
      { date: input.generatedAt.slice(0, 10), score: clampScore(input.skill.currentScore) },
    ],
    revisionsCompleted: matchingDays.reduce((sum, day) => sum + day.revisionsCompleted, 0),
    rubricImprovement: matchingDays.reduce((sum, day) => sum + day.rubricImprovement, 0),
    skill: input.skill.skill,
    wordsWritten: matchingDays.reduce((sum, day) => sum + day.wordsWritten, 0),
  };
}

function getNextFocusSkill(skills: ProgressSkill[]): ProgressSkill["skill"] | null {
  const [weakest] = [...skills].sort((left, right) => left.currentScore - right.currentScore);

  return weakest?.skill ?? null;
}

function mapBackendProgress(input: BackendProgressResponse): ProgressApiResponse {
  const gradeLevel = input.gradeLevel as GradeLevel;
  const skills = input.skills.map((skill) =>
    mapBackendSkill({ activityDays: input.activityDays, generatedAt: input.generatedAt, skill }),
  );
  const weeklyMinutesGoal =
    input.totals.weeklyMinutesGoal > 0 ? input.totals.weeklyMinutesGoal : getWeeklyMinutesGoal(gradeLevel);
  const weeklyHighlights: ProgressWeeklyHighlight[] =
    input.activityDays.length > 0 || input.weeklyReview
      ? createWeeklyHighlights(gradeLevel, "success").slice(0, input.weeklyReview ? 2 : 1)
      : [];
  const today = input.generatedAt.slice(0, 10);
  const activityDates = input.activityDays.map((day) => day.activityDate).sort();
  const weekStart = input.weeklyReview?.weekStart ?? activityDates[0] ?? today;
  const weekEnd = input.weeklyReview?.weekEnd ?? activityDates.at(-1) ?? today;

  const response: ProgressApiResponse = {
    connectionStatus: input.connectionStatus,
    dailyActivity: input.activityDays.map((day) => ({
      aiFeedbackApplied: day.aiFeedbackApplied,
      assignmentsCompleted: day.assignmentsCompleted,
      date: day.activityDate,
      handwritingMinutes: day.handwritingMinutes,
      minutes: day.minutesPracticed,
      revisionsCompleted: day.revisionsCompleted,
      rubricImprovement: day.rubricImprovement,
      skillsPracticed: day.practicedSkills,
      words: day.wordsWritten,
    })),
    generatedAt: input.generatedAt,
    gradeLevel,
    newBadgeIds: [],
    skills,
    studentId: input.studentId,
    totals: {
      aiFeedbackApplied: input.totals.aiFeedbackApplied,
      assignmentsCompleted: input.totals.assignmentsCompleted,
      handwritingMinutes: input.totals.handwritingMinutes,
      minutesThisWeek: input.totals.minutesThisWeek,
      revisionsCompleted: input.totals.revisionsCompleted,
      rubricImprovement: Math.round(input.totals.rubricImprovement),
      weeklyMinutesGoal,
      wordsWritten: input.totals.wordsWritten,
    },
    weeklyReview: {
      highlights: weeklyHighlights,
      nextFocusSkill: getNextFocusSkill(skills),
      weekEnd,
      weekStart,
    },
  };

  return progressApiResponseSchema.parse(response) as ProgressApiResponse;
}

function createElementaryActivity(): ProgressDailyActivity[] {
  return [
    {
      aiFeedbackApplied: 1,
      assignmentsCompleted: 1,
      date: "2026-06-04",
      handwritingMinutes: 4,
      minutes: 8,
      revisionsCompleted: 0,
      rubricImprovement: 1,
      skillsPracticed: ["sentence_structure", "vocabulary"],
      words: 32,
    },
    {
      aiFeedbackApplied: 0,
      assignmentsCompleted: 1,
      date: "2026-06-06",
      handwritingMinutes: 6,
      minutes: 10,
      revisionsCompleted: 1,
      rubricImprovement: 2,
      skillsPracticed: ["handwriting", "sentence_structure"],
      words: 44,
    },
    {
      aiFeedbackApplied: 1,
      assignmentsCompleted: 1,
      date: "2026-06-07",
      handwritingMinutes: 8,
      minutes: 12,
      revisionsCompleted: 1,
      rubricImprovement: 2,
      skillsPracticed: ["vocabulary", "handwriting"],
      words: 52,
    },
    {
      aiFeedbackApplied: 1,
      assignmentsCompleted: 0,
      date: "2026-06-08",
      handwritingMinutes: 5,
      minutes: 9,
      revisionsCompleted: 1,
      rubricImprovement: 1,
      skillsPracticed: ["sentence_structure"],
      words: 38,
    },
    {
      aiFeedbackApplied: 0,
      assignmentsCompleted: 1,
      date: "2026-06-09",
      handwritingMinutes: 7,
      minutes: 11,
      revisionsCompleted: 0,
      rubricImprovement: 1,
      skillsPracticed: ["handwriting", "vocabulary"],
      words: 46,
    },
  ];
}

function createMiddleActivity(): ProgressDailyActivity[] {
  return [
    {
      aiFeedbackApplied: 1,
      assignmentsCompleted: 1,
      date: "2026-06-03",
      handwritingMinutes: 0,
      minutes: 15,
      revisionsCompleted: 1,
      rubricImprovement: 2,
      skillsPracticed: ["organization", "clarity"],
      words: 138,
    },
    {
      aiFeedbackApplied: 2,
      assignmentsCompleted: 1,
      date: "2026-06-05",
      handwritingMinutes: 4,
      minutes: 18,
      revisionsCompleted: 1,
      rubricImprovement: 3,
      skillsPracticed: ["revision_quality", "grammar"],
      words: 166,
    },
    {
      aiFeedbackApplied: 1,
      assignmentsCompleted: 0,
      date: "2026-06-06",
      handwritingMinutes: 0,
      minutes: 16,
      revisionsCompleted: 1,
      rubricImprovement: 2,
      skillsPracticed: ["clarity"],
      words: 122,
    },
    {
      aiFeedbackApplied: 1,
      assignmentsCompleted: 1,
      date: "2026-06-07",
      handwritingMinutes: 6,
      minutes: 19,
      revisionsCompleted: 1,
      rubricImprovement: 2,
      skillsPracticed: ["organization", "revision_quality"],
      words: 174,
    },
    {
      aiFeedbackApplied: 2,
      assignmentsCompleted: 1,
      date: "2026-06-08",
      handwritingMinutes: 0,
      minutes: 17,
      revisionsCompleted: 1,
      rubricImprovement: 3,
      skillsPracticed: ["clarity", "grammar"],
      words: 148,
    },
    {
      aiFeedbackApplied: 1,
      assignmentsCompleted: 0,
      date: "2026-06-09",
      handwritingMinutes: 5,
      minutes: 14,
      revisionsCompleted: 0,
      rubricImprovement: 1,
      skillsPracticed: ["revision_quality"],
      words: 96,
    },
  ];
}

function createHighActivity(): ProgressDailyActivity[] {
  return [
    {
      aiFeedbackApplied: 2,
      assignmentsCompleted: 1,
      date: "2026-06-02",
      handwritingMinutes: 0,
      minutes: 24,
      revisionsCompleted: 1,
      rubricImprovement: 2,
      skillsPracticed: ["evidence_usage", "argument_strength"],
      words: 318,
    },
    {
      aiFeedbackApplied: 2,
      assignmentsCompleted: 1,
      date: "2026-06-04",
      handwritingMinutes: 0,
      minutes: 28,
      revisionsCompleted: 1,
      rubricImprovement: 3,
      skillsPracticed: ["organization", "clarity"],
      words: 372,
    },
    {
      aiFeedbackApplied: 1,
      assignmentsCompleted: 0,
      date: "2026-06-06",
      handwritingMinutes: 5,
      minutes: 22,
      revisionsCompleted: 1,
      rubricImprovement: 2,
      skillsPracticed: ["revision_quality", "evidence_usage"],
      words: 276,
    },
    {
      aiFeedbackApplied: 2,
      assignmentsCompleted: 1,
      date: "2026-06-07",
      handwritingMinutes: 0,
      minutes: 31,
      revisionsCompleted: 1,
      rubricImprovement: 4,
      skillsPracticed: ["argument_strength", "organization"],
      words: 421,
    },
    {
      aiFeedbackApplied: 2,
      assignmentsCompleted: 1,
      date: "2026-06-08",
      handwritingMinutes: 0,
      minutes: 27,
      revisionsCompleted: 1,
      rubricImprovement: 3,
      skillsPracticed: ["evidence_usage", "clarity"],
      words: 354,
    },
    {
      aiFeedbackApplied: 1,
      assignmentsCompleted: 0,
      date: "2026-06-09",
      handwritingMinutes: 0,
      minutes: 20,
      revisionsCompleted: 0,
      rubricImprovement: 1,
      skillsPracticed: ["revision_quality"],
      words: 208,
    },
  ];
}

function createActivityForGrade(gradeLevel: GradeLevel, scenario: ProgressScenario): ProgressDailyActivity[] {
  if (scenario === "empty") {
    return [];
  }

  if (gradeLevel <= 5) {
    return createElementaryActivity();
  }

  if (gradeLevel <= 8) {
    return createMiddleActivity();
  }

  return createHighActivity();
}

function createElementarySkills(): ProgressSkill[] {
  return [
    {
      aiFeedbackApplied: 2,
      currentScore: 70,
      handwritingMinutes: 12,
      minutesPracticed: 24,
      practiceCount: 3,
      previousScore: 63,
      recentTrend: [
        { date: "2026-06-04", score: 63 },
        { date: "2026-06-07", score: 67 },
        { date: "2026-06-09", score: 70 },
      ],
      revisionsCompleted: 1,
      rubricImprovement: 4,
      skill: "sentence_structure",
      wordsWritten: 114,
    },
    {
      aiFeedbackApplied: 2,
      currentScore: 64,
      handwritingMinutes: 10,
      minutesPracticed: 23,
      practiceCount: 3,
      previousScore: 58,
      recentTrend: [
        { date: "2026-06-04", score: 58 },
        { date: "2026-06-07", score: 61 },
        { date: "2026-06-09", score: 64 },
      ],
      revisionsCompleted: 1,
      rubricImprovement: 4,
      skill: "vocabulary",
      wordsWritten: 130,
    },
    {
      aiFeedbackApplied: 1,
      currentScore: 61,
      handwritingMinutes: 26,
      minutesPracticed: 28,
      practiceCount: 3,
      previousScore: 55,
      recentTrend: [
        { date: "2026-06-06", score: 55 },
        { date: "2026-06-07", score: 59 },
        { date: "2026-06-09", score: 61 },
      ],
      revisionsCompleted: 1,
      rubricImprovement: 3,
      skill: "handwriting",
      wordsWritten: 142,
    },
  ];
}

function createMiddleSkills(): ProgressSkill[] {
  return [
    {
      aiFeedbackApplied: 2,
      currentScore: 75,
      handwritingMinutes: 6,
      minutesPracticed: 34,
      practiceCount: 3,
      previousScore: 68,
      recentTrend: [
        { date: "2026-06-03", score: 68 },
        { date: "2026-06-07", score: 72 },
        { date: "2026-06-09", score: 75 },
      ],
      revisionsCompleted: 2,
      rubricImprovement: 5,
      skill: "organization",
      wordsWritten: 312,
    },
    {
      aiFeedbackApplied: 3,
      currentScore: 69,
      handwritingMinutes: 0,
      minutesPracticed: 31,
      practiceCount: 3,
      previousScore: 63,
      recentTrend: [
        { date: "2026-06-03", score: 63 },
        { date: "2026-06-06", score: 66 },
        { date: "2026-06-08", score: 69 },
      ],
      revisionsCompleted: 2,
      rubricImprovement: 6,
      skill: "clarity",
      wordsWritten: 408,
    },
    {
      aiFeedbackApplied: 2,
      currentScore: 66,
      handwritingMinutes: 5,
      minutesPracticed: 35,
      practiceCount: 3,
      previousScore: 58,
      recentTrend: [
        { date: "2026-06-05", score: 58 },
        { date: "2026-06-07", score: 63 },
        { date: "2026-06-09", score: 66 },
      ],
      revisionsCompleted: 3,
      rubricImprovement: 5,
      skill: "revision_quality",
      wordsWritten: 436,
    },
    {
      aiFeedbackApplied: 3,
      currentScore: 62,
      handwritingMinutes: 0,
      minutesPracticed: 30,
      practiceCount: 2,
      previousScore: 58,
      recentTrend: [
        { date: "2026-06-05", score: 58 },
        { date: "2026-06-08", score: 62 },
      ],
      revisionsCompleted: 2,
      rubricImprovement: 4,
      skill: "grammar",
      wordsWritten: 314,
    },
  ];
}

function createHighSkills(): ProgressSkill[] {
  return [
    {
      aiFeedbackApplied: 4,
      currentScore: 79,
      handwritingMinutes: 0,
      minutesPracticed: 56,
      practiceCount: 4,
      previousScore: 71,
      recentTrend: [
        { date: "2026-06-02", score: 71 },
        { date: "2026-06-06", score: 75 },
        { date: "2026-06-08", score: 79 },
      ],
      revisionsCompleted: 2,
      rubricImprovement: 7,
      skill: "evidence_usage",
      wordsWritten: 948,
    },
    {
      aiFeedbackApplied: 4,
      currentScore: 73,
      handwritingMinutes: 0,
      minutesPracticed: 55,
      practiceCount: 3,
      previousScore: 66,
      recentTrend: [
        { date: "2026-06-02", score: 66 },
        { date: "2026-06-07", score: 70 },
        { date: "2026-06-09", score: 73 },
      ],
      revisionsCompleted: 2,
      rubricImprovement: 6,
      skill: "argument_strength",
      wordsWritten: 947,
    },
    {
      aiFeedbackApplied: 4,
      currentScore: 76,
      handwritingMinutes: 0,
      minutesPracticed: 59,
      practiceCount: 3,
      previousScore: 70,
      recentTrend: [
        { date: "2026-06-04", score: 70 },
        { date: "2026-06-07", score: 74 },
        { date: "2026-06-09", score: 76 },
      ],
      revisionsCompleted: 2,
      rubricImprovement: 7,
      skill: "organization",
      wordsWritten: 1147,
    },
    {
      aiFeedbackApplied: 2,
      currentScore: 70,
      handwritingMinutes: 5,
      minutesPracticed: 42,
      practiceCount: 2,
      previousScore: 64,
      recentTrend: [
        { date: "2026-06-06", score: 64 },
        { date: "2026-06-09", score: 70 },
      ],
      revisionsCompleted: 2,
      rubricImprovement: 5,
      skill: "revision_quality",
      wordsWritten: 484,
    },
    {
      aiFeedbackApplied: 4,
      currentScore: 68,
      handwritingMinutes: 0,
      minutesPracticed: 55,
      practiceCount: 2,
      previousScore: 64,
      recentTrend: [
        { date: "2026-06-04", score: 64 },
        { date: "2026-06-08", score: 68 },
      ],
      revisionsCompleted: 2,
      rubricImprovement: 4,
      skill: "clarity",
      wordsWritten: 726,
    },
  ];
}

function createSkillsForGrade(gradeLevel: GradeLevel, scenario: ProgressScenario): ProgressSkill[] {
  if (scenario === "empty") {
    return [];
  }

  if (gradeLevel <= 5) {
    return createElementarySkills();
  }

  if (gradeLevel <= 8) {
    return createMiddleSkills();
  }

  return createHighSkills();
}

function getTotals(activity: ProgressDailyActivity[], gradeLevel: GradeLevel): ProgressTotals {
  return {
    aiFeedbackApplied: activity.reduce((total, day) => total + day.aiFeedbackApplied, 0),
    assignmentsCompleted: activity.reduce((total, day) => total + day.assignmentsCompleted, 0),
    handwritingMinutes: activity.reduce((total, day) => total + day.handwritingMinutes, 0),
    minutesThisWeek: activity.reduce((total, day) => total + day.minutes, 0),
    revisionsCompleted: activity.reduce((total, day) => total + day.revisionsCompleted, 0),
    rubricImprovement: activity.reduce((total, day) => total + day.rubricImprovement, 0),
    weeklyMinutesGoal: getWeeklyMinutesGoal(gradeLevel),
    wordsWritten: activity.reduce((total, day) => total + day.words, 0),
  };
}

function createWeeklyHighlights(gradeLevel: GradeLevel, scenario: ProgressScenario): ProgressWeeklyHighlight[] {
  if (scenario === "empty") {
    return [];
  }

  if (gradeLevel <= 5) {
    return [
      { key: "progress.weeklyReview.highlights.elementarySentenceDetails", params: { count: 4 } },
      { key: "progress.weeklyReview.highlights.elementaryHandwritingRoutine" },
    ];
  }

  if (gradeLevel <= 8) {
    return [
      { key: "progress.weeklyReview.highlights.middleRevisedAfterFeedback", params: { count: 5 } },
      { key: "progress.weeklyReview.highlights.middleOrganizationClarity" },
      { key: "progress.weeklyReview.highlights.middleAiCoachingNotes" },
    ];
  }

  return [
    { key: "progress.weeklyReview.highlights.highFocusedBlocks", params: { count: 4 } },
    { key: "progress.weeklyReview.highlights.highEvidenceOrganization" },
    { key: "progress.weeklyReview.highlights.highRevisionReasoning" },
  ];
}

function createDashboard(input: GetProgressDashboardInput, scenario: ProgressScenario): ProgressApiResponse {
  const gradeLevel = getGradeLevel(input);
  const dailyActivity = createActivityForGrade(gradeLevel, scenario);
  const skills = createSkillsForGrade(gradeLevel, scenario);
  const response: ProgressApiResponse = {
    connectionStatus: scenario === "offline" ? "offline_cached" : "online",
    dailyActivity,
    generatedAt: new Date("2026-06-09T09:00:00.000Z").toISOString(),
    gradeLevel,
    newBadgeIds: scenario === "empty" ? [] : ["three_day_streak"],
    skills,
    studentId: input.studentId,
    totals: getTotals(dailyActivity, gradeLevel),
    weeklyReview: {
      highlights: createWeeklyHighlights(gradeLevel, scenario),
      nextFocusSkill:
        scenario === "empty"
          ? null
          : gradeLevel <= 5
            ? "sentence_structure"
            : gradeLevel <= 8
              ? "revision_quality"
              : "evidence_usage",
      weekEnd: "2026-06-09",
      weekStart: "2026-06-03",
    },
  };

  // Zod widens the highlight translation keys back to plain strings, so
  // restore the narrowed type carried by the validated input.
  return progressApiResponseSchema.parse(response) as ProgressApiResponse;
}

export const progressApi = {
  async getDashboard(input: GetProgressDashboardInput): Promise<ProgressApiResponse> {
    const scenario = readScenario();

    if (scenario === "error") {
      throw new Error("Progress dashboard mock error");
    }

    const { data: authData } = await supabase.auth.getSession();
    const session = authData?.session;

    if (session) {
      const backendResponse = await apiClient.get(`/students/${encodeURIComponent(input.studentId)}/progress`, {
        schema: backendProgressResponseSchema,
      });

      return mapBackendProgress(backendResponse);
    }

    return createDashboard(input, scenario);
  },
};
