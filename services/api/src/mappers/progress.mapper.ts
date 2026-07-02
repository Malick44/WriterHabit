import type {
  BadgeRecord,
  StudentActivityDayRecord,
  StudentBadgeRecord,
  StudentProgressTotalsRecord,
  StudentProfileRecord,
  StudentSkillProgressRecord,
  WeeklyReviewRecord,
} from "../data/types";
import {
  emptyProgressTotals,
  gradeBandFor,
  mapBadgeProgress,
  mapProgressTotals,
  mapSkillProgress,
  mapStreak,
  mapWeeklyReviewSummary,
} from "./dashboards.mapper";

export interface StudentProgressApiResponse {
  activityDays: {
    activityDate: string;
    aiFeedbackApplied: number;
    assignmentsCompleted: number;
    handwritingMinutes: number;
    minutesPracticed: number;
    practicedSkills: string[];
    revisionsCompleted: number;
    rubricImprovement: number;
    wordsWritten: number;
  }[];
  badges: ReturnType<typeof mapBadgeProgress>;
  connectionStatus: "online";
  emptyState: {
    body: { fallback: string; key: string };
    title: { fallback: string; key: string };
  } | null;
  generatedAt: string;
  gradeBand: ReturnType<typeof gradeBandFor>;
  gradeLevel: number;
  skills: ReturnType<typeof mapSkillProgress>[];
  streak: ReturnType<typeof mapStreak>;
  studentId: string;
  totals: ReturnType<typeof mapProgressTotals>;
  weeklyReview: ReturnType<typeof mapWeeklyReviewSummary> | null;
}

export interface MobileProgressViewModel {
  connectionStatus: "online" | "offline_cached";
  dailyActivity: {
    aiFeedbackApplied: number;
    assignmentsCompleted: number;
    date: string;
    handwritingMinutes: number;
    minutes: number;
    revisionsCompleted: number;
    rubricImprovement: number;
    skillsPracticed: string[];
    words: number;
  }[];
  generatedAt: string;
  gradeLevel: number;
  newBadgeIds: [];
  skills: {
    aiFeedbackApplied: number;
    currentScore: number;
    handwritingMinutes: number;
    minutesPracticed: number;
    practiceCount: number;
    previousScore: number;
    recentTrend: { date: string; score: number }[];
    revisionsCompleted: number;
    rubricImprovement: number;
    skill: string;
    wordsWritten: number;
  }[];
  studentId: string;
  totals: {
    aiFeedbackApplied: number;
    assignmentsCompleted: number;
    handwritingMinutes: number;
    minutesThisWeek: number;
    revisionsCompleted: number;
    rubricImprovement: number;
    weeklyMinutesGoal: number;
    wordsWritten: number;
  };
  weeklyReview: {
    highlights: { key: string; params?: Record<string, number | string> }[];
    nextFocusSkill: string | null;
    weekEnd: string;
    weekStart: string;
  };
}

export function mapStudentProgressApiResponse(input: {
  activityDays: readonly StudentActivityDayRecord[];
  badges: readonly BadgeRecord[];
  generatedAt: string;
  profile: StudentProfileRecord;
  skills: readonly StudentSkillProgressRecord[];
  studentBadges: readonly StudentBadgeRecord[];
  totals?: StudentProgressTotalsRecord;
  weeklyReview: WeeklyReviewRecord | null;
}): StudentProgressApiResponse {
  const totals = input.totals ?? emptyProgressTotals(input.profile.id);
  const hasAnyProgress = Boolean(input.totals) || input.skills.length > 0;

  return {
    activityDays: input.activityDays.map((day) => ({
      activityDate: day.activityDate,
      aiFeedbackApplied: day.feedbackApplied,
      assignmentsCompleted: day.assignmentsCompleted,
      handwritingMinutes: day.handwritingMinutes,
      minutesPracticed: day.minutesPracticed,
      practicedSkills: day.practicedSkills,
      revisionsCompleted: day.revisionsCompleted,
      rubricImprovement: 0,
      wordsWritten: day.wordsWritten,
    })),
    badges: mapBadgeProgress([...input.badges], [...input.studentBadges]),
    connectionStatus: "online",
    emptyState: hasAnyProgress
      ? null
      : {
          body: {
            fallback: "Progress shows up here after the first writing session.",
            key: "progress.emptyState.body",
          },
          title: { fallback: "No writing activity yet", key: "progress.emptyState.title" },
        },
    generatedAt: input.generatedAt,
    gradeBand: gradeBandFor(input.profile.gradeLevel),
    gradeLevel: input.profile.gradeLevel,
    skills: input.skills.map((record) => mapSkillProgress(record)),
    streak: mapStreak(totals, input.generatedAt.slice(0, 10)),
    studentId: input.profile.id,
    totals: mapProgressTotals(totals),
    weeklyReview: input.weeklyReview ? mapWeeklyReviewSummary(input.weeklyReview) : null,
  };
}

export function mapStudentSkillDetailApiResponse(input: {
  activityDays: readonly StudentActivityDayRecord[];
  skill: StudentSkillProgressRecord;
  skillId: string;
  studentId: string;
}) {
  return {
    ...mapSkillProgress(input.skill),
    recentActivity: input.activityDays
      .filter((day) => day.practicedSkills.includes(input.skillId))
      .map((day) => ({
        date: day.activityDate,
        minutesPracticed: day.minutesPracticed,
        wordsWritten: day.wordsWritten,
      })),
    studentId: input.studentId,
    updatedAt: input.skill.updatedAt,
  };
}

export function mapStudentBadgesListApiResponse(input: {
  badges: readonly BadgeRecord[];
  studentBadges: readonly StudentBadgeRecord[];
}) {
  return {
    items: mapBadgeProgress([...input.badges], [...input.studentBadges]),
    nextCursor: null,
  };
}

export function mapWeeklyReviewDetailApiResponse(input: {
  activityDays: readonly StudentActivityDayRecord[];
  studentId: string;
  weeklyReview: WeeklyReviewRecord;
}) {
  return {
    ...mapWeeklyReviewSummary(input.weeklyReview),
    studentId: input.studentId,
    totals: {
      assignmentsCompleted: input.activityDays.reduce((sum, day) => sum + day.assignmentsCompleted, 0),
      minutesPracticed: input.activityDays.reduce((sum, day) => sum + day.minutesPracticed, 0),
      revisionsCompleted: input.activityDays.reduce((sum, day) => sum + day.revisionsCompleted, 0),
      wordsWritten: input.activityDays.reduce((sum, day) => sum + day.wordsWritten, 0),
    },
  };
}

export function mapStudentProgressToMobileViewModel(response: StudentProgressApiResponse): MobileProgressViewModel {
  const skills = response.skills.map((skill) => mapMobileProgressSkill(response, skill));
  const activityDates = response.activityDays.map((day) => day.activityDate).sort();
  const today = response.generatedAt.slice(0, 10);

  return {
    connectionStatus: response.connectionStatus,
    dailyActivity: response.activityDays.map((day) => ({
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
    generatedAt: response.generatedAt,
    gradeLevel: response.gradeLevel,
    newBadgeIds: [],
    skills,
    studentId: response.studentId,
    totals: {
      aiFeedbackApplied: response.totals.aiFeedbackApplied,
      assignmentsCompleted: response.totals.assignmentsCompleted,
      handwritingMinutes: response.totals.handwritingMinutes,
      minutesThisWeek: response.totals.minutesThisWeek,
      revisionsCompleted: response.totals.revisionsCompleted,
      rubricImprovement: Math.round(response.totals.rubricImprovement),
      weeklyMinutesGoal: Math.max(1, response.totals.weeklyMinutesGoal),
      wordsWritten: response.totals.wordsWritten,
    },
    weeklyReview: {
      highlights: response.activityDays.length > 0 ? [{ key: "progress.weeklyReview.highlights.practice" }] : [],
      nextFocusSkill: getNextFocusSkill(skills),
      weekEnd: response.weeklyReview?.weekEnd ?? activityDates.at(-1) ?? today,
      weekStart: response.weeklyReview?.weekStart ?? activityDates[0] ?? today,
    },
  };
}

function mapMobileProgressSkill(
  response: StudentProgressApiResponse,
  skill: StudentProgressApiResponse["skills"][number],
): MobileProgressViewModel["skills"][number] {
  const matchingDays = response.activityDays.filter((day) => day.practicedSkills.includes(skill.skill));
  const trendDate = matchingDays.at(-1)?.activityDate ?? response.generatedAt.slice(0, 10);

  return {
    aiFeedbackApplied: matchingDays.reduce((sum, day) => sum + day.aiFeedbackApplied, 0),
    currentScore: clampScore(skill.currentScore),
    handwritingMinutes: matchingDays.reduce((sum, day) => sum + day.handwritingMinutes, 0),
    minutesPracticed: matchingDays.reduce((sum, day) => sum + day.minutesPracticed, 0),
    practiceCount: matchingDays.length,
    previousScore: clampScore(skill.previousScore),
    recentTrend: [
      { date: trendDate, score: clampScore(skill.previousScore) },
      { date: response.generatedAt.slice(0, 10), score: clampScore(skill.currentScore) },
    ],
    revisionsCompleted: matchingDays.reduce((sum, day) => sum + day.revisionsCompleted, 0),
    rubricImprovement: matchingDays.reduce((sum, day) => sum + day.rubricImprovement, 0),
    skill: skill.skill,
    wordsWritten: matchingDays.reduce((sum, day) => sum + day.wordsWritten, 0),
  };
}

function getNextFocusSkill(skills: MobileProgressViewModel["skills"]): string | null {
  const [weakest] = [...skills].sort((left, right) => left.currentScore - right.currentScore);

  return weakest?.skill ?? null;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}
