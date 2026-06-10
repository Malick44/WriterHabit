import type { WritingSkill } from "@writewise/shared";

import { typography } from "@/design/tokens";
import { translate, type TranslationKey } from "@/i18n";

import {
  type ProgressApiResponse,
  type ProgressBadgeViewModel,
  type ProgressDashboardViewModel,
  type ProgressGradeAdaptation,
  type ProgressMetricId,
  type ProgressMetricViewModel,
  type ProgressSkillViewModel,
  type ProgressTotals,
} from "../types";
import { evaluateBadgeUnlocks } from "./badgeUnlockService";
import { calculateWritingStreak } from "./streakService";

interface BuildProgressDashboardViewModelInput {
  dashboard: ProgressApiResponse;
  displayName: string;
}

const skillLabelKeys = {
  argument_strength: "progress.skills.labels.argumentStrength",
  clarity: "progress.skills.labels.clarity",
  creativity: "progress.skills.labels.creativity",
  evidence_usage: "progress.skills.labels.evidenceUsage",
  grammar: "progress.skills.labels.grammar",
  handwriting: "progress.skills.labels.handwriting",
  organization: "progress.skills.labels.organization",
  punctuation: "progress.skills.labels.punctuation",
  reading_response: "progress.skills.labels.readingResponse",
  revision_quality: "progress.skills.labels.revisionQuality",
  sentence_structure: "progress.skills.labels.sentenceStructure",
  spelling: "progress.skills.labels.spelling",
  vocabulary: "progress.skills.labels.vocabulary",
} satisfies Record<WritingSkill, TranslationKey>;

const skillNextStepKeys = {
  argument_strength: "progress.skills.nextSteps.argumentStrength",
  clarity: "progress.skills.nextSteps.clarity",
  creativity: "progress.skills.nextSteps.creativity",
  evidence_usage: "progress.skills.nextSteps.evidenceUsage",
  grammar: "progress.skills.nextSteps.grammar",
  handwriting: "progress.skills.nextSteps.handwriting",
  organization: "progress.skills.nextSteps.organization",
  punctuation: "progress.skills.nextSteps.punctuation",
  reading_response: "progress.skills.nextSteps.readingResponse",
  revision_quality: "progress.skills.nextSteps.revisionQuality",
  sentence_structure: "progress.skills.nextSteps.sentenceStructure",
  spelling: "progress.skills.nextSteps.spelling",
  vocabulary: "progress.skills.nextSteps.vocabulary",
} satisfies Record<WritingSkill, TranslationKey>;

const metricCopy = {
  ai_feedback_applied: {
    accessibilityLabelKey: "progress.metrics.aiFeedbackApplied.accessibility",
    descriptionKey: "progress.metrics.aiFeedbackApplied.description",
    titleKey: "progress.metrics.aiFeedbackApplied.title",
    valueKey: "progress.metrics.aiFeedbackApplied.value",
  },
  assignments_completed: {
    accessibilityLabelKey: "progress.metrics.assignmentsCompleted.accessibility",
    descriptionKey: "progress.metrics.assignmentsCompleted.description",
    titleKey: "progress.metrics.assignmentsCompleted.title",
    valueKey: "progress.metrics.assignmentsCompleted.value",
  },
  badges_unlocked: {
    accessibilityLabelKey: "progress.metrics.badgesUnlocked.accessibility",
    descriptionKey: "progress.metrics.badgesUnlocked.description",
    titleKey: "progress.metrics.badgesUnlocked.title",
    valueKey: "progress.metrics.badgesUnlocked.value",
  },
  current_streak: {
    accessibilityLabelKey: "progress.metrics.currentStreak.accessibility",
    descriptionKey: "progress.metrics.currentStreak.description",
    titleKey: "progress.metrics.currentStreak.title",
    valueKey: "progress.metrics.currentStreak.value",
  },
  handwriting_time: {
    accessibilityLabelKey: "progress.metrics.handwritingTime.accessibility",
    descriptionKey: "progress.metrics.handwritingTime.description",
    titleKey: "progress.metrics.handwritingTime.title",
    valueKey: "progress.metrics.handwritingTime.value",
  },
  revisions_completed: {
    accessibilityLabelKey: "progress.metrics.revisionsCompleted.accessibility",
    descriptionKey: "progress.metrics.revisionsCompleted.description",
    titleKey: "progress.metrics.revisionsCompleted.title",
    valueKey: "progress.metrics.revisionsCompleted.value",
  },
  rubric_improvement: {
    accessibilityLabelKey: "progress.metrics.rubricImprovement.accessibility",
    descriptionKey: "progress.metrics.rubricImprovement.description",
    titleKey: "progress.metrics.rubricImprovement.title",
    valueKey: "progress.metrics.rubricImprovement.value",
  },
  weekly_minutes: {
    accessibilityLabelKey: "progress.metrics.weeklyMinutes.accessibility",
    descriptionKey: "progress.metrics.weeklyMinutes.description",
    titleKey: "progress.metrics.weeklyMinutes.title",
    valueKey: "progress.metrics.weeklyMinutes.value",
  },
  words_written: {
    accessibilityLabelKey: "progress.metrics.wordsWritten.accessibility",
    descriptionKey: "progress.metrics.wordsWritten.description",
    titleKey: "progress.metrics.wordsWritten.title",
    valueKey: "progress.metrics.wordsWritten.value",
  },
} satisfies Record<
  ProgressMetricId,
  {
    accessibilityLabelKey: TranslationKey;
    descriptionKey: TranslationKey;
    titleKey: TranslationKey;
    valueKey: TranslationKey;
  }
>;

function getFirstName(displayName: string): string {
  const trimmed = displayName.trim();

  if (!trimmed) {
    return translate("en", "common.fallbackDisplayName");
  }

  return trimmed.split(/\s+/)[0] ?? translate("en", "common.fallbackDisplayName");
}

export function getProgressGradeAdaptation(gradeLevel: number): ProgressGradeAdaptation {
  const band = typography.getGradeBandForGrade(gradeLevel);

  switch (band) {
    case "elementary":
      return {
        badgePreviewCount: 3,
        band,
        showDetailedSkillDeltas: false,
        showHandwritingMetric: true,
        showProductivityMetrics: false,
        showRubricTrend: false,
        visibleMetricIds: [
          "assignments_completed",
          "current_streak",
          "weekly_minutes",
          "handwriting_time",
          "badges_unlocked",
        ],
        visibleSkillCount: 3,
      };
    case "high":
      return {
        badgePreviewCount: 4,
        band,
        showDetailedSkillDeltas: true,
        showHandwritingMetric: true,
        showProductivityMetrics: true,
        showRubricTrend: true,
        visibleMetricIds: [
          "assignments_completed",
          "current_streak",
          "weekly_minutes",
          "words_written",
          "revisions_completed",
          "rubric_improvement",
          "ai_feedback_applied",
          "handwriting_time",
          "badges_unlocked",
        ],
        visibleSkillCount: 5,
      };
    case "middle":
      return {
        badgePreviewCount: 4,
        band,
        showDetailedSkillDeltas: true,
        showHandwritingMetric: true,
        showProductivityMetrics: true,
        showRubricTrend: false,
        visibleMetricIds: [
          "assignments_completed",
          "current_streak",
          "weekly_minutes",
          "words_written",
          "revisions_completed",
          "ai_feedback_applied",
          "badges_unlocked",
        ],
        visibleSkillCount: 4,
      };
  }
}

function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function getMetricValue(input: {
  badges: ProgressBadgeViewModel[];
  id: ProgressMetricId;
  streakDays: number;
  totals: ProgressTotals;
}): Pick<ProgressMetricViewModel, "progressValue" | "valueParams"> {
  const unlockedBadges = input.badges.filter((badge) => badge.unlocked).length;

  switch (input.id) {
    case "ai_feedback_applied":
      return { valueParams: { count: input.totals.aiFeedbackApplied } };
    case "assignments_completed":
      return { valueParams: { count: input.totals.assignmentsCompleted } };
    case "badges_unlocked":
      return { progressValue: clampProgress(unlockedBadges / input.badges.length), valueParams: { count: unlockedBadges } };
    case "current_streak":
      return { valueParams: { count: input.streakDays } };
    case "handwriting_time":
      return { valueParams: { count: input.totals.handwritingMinutes } };
    case "revisions_completed":
      return { valueParams: { count: input.totals.revisionsCompleted } };
    case "rubric_improvement":
      return { valueParams: { count: input.totals.rubricImprovement } };
    case "weekly_minutes":
      return {
        progressValue: clampProgress(input.totals.minutesThisWeek / input.totals.weeklyMinutesGoal),
        valueParams: { completed: input.totals.minutesThisWeek, goal: input.totals.weeklyMinutesGoal },
      };
    case "words_written":
      return { valueParams: { count: input.totals.wordsWritten } };
  }
}

function buildMetric(input: {
  badges: ProgressBadgeViewModel[];
  id: ProgressMetricId;
  streakDays: number;
  totals: ProgressTotals;
}): ProgressMetricViewModel {
  const copy = metricCopy[input.id];
  const value = getMetricValue(input);

  return {
    accessibilityLabelKey: copy.accessibilityLabelKey,
    descriptionKey: copy.descriptionKey,
    id: input.id,
    progressValue: value.progressValue,
    titleKey: copy.titleKey,
    valueKey: copy.valueKey,
    valueParams: value.valueParams,
  };
}

function buildSkillViewModel(skill: ProgressApiResponse["skills"][number]): ProgressSkillViewModel {
  return {
    aiFeedbackApplied: skill.aiFeedbackApplied,
    currentScore: skill.currentScore,
    handwritingMinutes: skill.handwritingMinutes,
    labelKey: skillLabelKeys[skill.skill],
    minutesPracticed: skill.minutesPracticed,
    nextStepKey: skillNextStepKeys[skill.skill],
    practiceCount: skill.practiceCount,
    previousScore: skill.previousScore,
    progressValue: skill.currentScore / 100,
    recentTrend: skill.recentTrend,
    revisionsCompleted: skill.revisionsCompleted,
    rubricImprovement: skill.rubricImprovement,
    skill: skill.skill,
    weeklyDelta: skill.currentScore - skill.previousScore,
    wordsWritten: skill.wordsWritten,
  };
}

function hasProgressContent(dashboard: ProgressApiResponse): boolean {
  const totals = dashboard.totals;

  return Boolean(
    dashboard.skills.length > 0 ||
      totals.aiFeedbackApplied > 0 ||
      totals.assignmentsCompleted > 0 ||
      totals.handwritingMinutes > 0 ||
      totals.minutesThisWeek > 0 ||
      totals.revisionsCompleted > 0 ||
      totals.rubricImprovement > 0 ||
      totals.wordsWritten > 0,
  );
}

function sortBadgesForPreview(badges: ProgressBadgeViewModel[]): ProgressBadgeViewModel[] {
  const statusWeight = {
    new: 0,
    unlocked: 1,
    locked: 2,
  } as const;

  return [...badges].sort((a, b) => {
    const byStatus = statusWeight[a.status] - statusWeight[b.status];

    return byStatus === 0 ? b.progressValue - a.progressValue : byStatus;
  });
}

function getWeeklyMetricIds(adaptation: ProgressGradeAdaptation): ProgressMetricId[] {
  switch (adaptation.band) {
    case "elementary":
      return ["weekly_minutes", "assignments_completed", "handwriting_time"];
    case "high":
      return ["weekly_minutes", "words_written", "revisions_completed", "rubric_improvement", "ai_feedback_applied"];
    case "middle":
      return ["weekly_minutes", "words_written", "revisions_completed", "ai_feedback_applied"];
  }
}

export function buildProgressDashboardViewModel({
  dashboard,
  displayName,
}: BuildProgressDashboardViewModelInput): ProgressDashboardViewModel {
  const gradeAdaptation = getProgressGradeAdaptation(dashboard.gradeLevel);
  const streak = calculateWritingStreak({
    activity: dashboard.dailyActivity,
    referenceDate: dashboard.generatedAt.slice(0, 10),
  });
  const badges = evaluateBadgeUnlocks({
    newBadgeIds: dashboard.newBadgeIds,
    streak,
    totals: dashboard.totals,
  });
  const metrics = (Object.keys(metricCopy) as ProgressMetricId[]).map((id) =>
    buildMetric({
      badges,
      id,
      streakDays: streak.currentDays,
      totals: dashboard.totals,
    }),
  );
  const skills = dashboard.skills.map(buildSkillViewModel);
  const weeklyMetricIds = getWeeklyMetricIds(gradeAdaptation);
  const nextFocusSkill =
    dashboard.weeklyReview.nextFocusSkill === null
      ? null
      : skills.find((skill) => skill.skill === dashboard.weeklyReview.nextFocusSkill) ?? null;

  return {
    badgePreview: sortBadgesForPreview(badges).slice(0, gradeAdaptation.badgePreviewCount),
    badges,
    dailyActivity: dashboard.dailyActivity,
    gradeAdaptation,
    gradeLevel: dashboard.gradeLevel,
    isEmpty: !hasProgressContent(dashboard),
    isOffline: dashboard.connectionStatus === "offline_cached",
    metrics,
    skills,
    streak,
    studentFirstName: getFirstName(displayName),
    totals: dashboard.totals,
    visibleMetrics: gradeAdaptation.visibleMetricIds
      .map((id) => metrics.find((metric) => metric.id === id))
      .filter((metric): metric is ProgressMetricViewModel => Boolean(metric)),
    visibleSkills: skills.slice(0, gradeAdaptation.visibleSkillCount),
    weeklyReview: {
      highlights: dashboard.weeklyReview.highlights,
      isEmpty: dashboard.dailyActivity.length === 0,
      metrics: weeklyMetricIds
        .map((id) => metrics.find((metric) => metric.id === id))
        .filter((metric): metric is ProgressMetricViewModel => Boolean(metric)),
      nextFocusSkill,
      weekLabel: dashboard.weeklyReview.weekLabel,
    },
  };
}
