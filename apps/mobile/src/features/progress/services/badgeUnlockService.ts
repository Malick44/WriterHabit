import type {
  ProgressBadgeDefinition,
  ProgressBadgeId,
  ProgressBadgeViewModel,
  ProgressStreakSummary,
  ProgressTotals,
} from "../types";

export const progressBadgeDefinitions: ProgressBadgeDefinition[] = [
  {
    descriptionKey: "progress.badges.definitions.firstAssignment.description",
    id: "first_assignment",
    requirementKey: "progress.badges.definitions.firstAssignment.requirement",
    target: 1,
    titleKey: "progress.badges.definitions.firstAssignment.title",
    tokenLabel: "1",
  },
  {
    descriptionKey: "progress.badges.definitions.threeDayStreak.description",
    id: "three_day_streak",
    requirementKey: "progress.badges.definitions.threeDayStreak.requirement",
    target: 3,
    titleKey: "progress.badges.definitions.threeDayStreak.title",
    tokenLabel: "3d",
  },
  {
    descriptionKey: "progress.badges.definitions.weeklyGoal.description",
    id: "weekly_goal",
    requirementKey: "progress.badges.definitions.weeklyGoal.requirement",
    target: 1,
    titleKey: "progress.badges.definitions.weeklyGoal.title",
    tokenLabel: "wk",
  },
  {
    descriptionKey: "progress.badges.definitions.revisionBuilder.description",
    id: "revision_builder",
    requirementKey: "progress.badges.definitions.revisionBuilder.requirement",
    target: 3,
    titleKey: "progress.badges.definitions.revisionBuilder.title",
    tokenLabel: "rv",
  },
  {
    descriptionKey: "progress.badges.definitions.feedbackApplier.description",
    id: "feedback_applier",
    requirementKey: "progress.badges.definitions.feedbackApplier.requirement",
    target: 5,
    titleKey: "progress.badges.definitions.feedbackApplier.title",
    tokenLabel: "fb",
  },
  {
    descriptionKey: "progress.badges.definitions.wordBuilder.description",
    id: "word_builder",
    requirementKey: "progress.badges.definitions.wordBuilder.requirement",
    target: 500,
    titleKey: "progress.badges.definitions.wordBuilder.title",
    tokenLabel: "wd",
  },
  {
    descriptionKey: "progress.badges.definitions.handwritingHelper.description",
    id: "handwriting_helper",
    requirementKey: "progress.badges.definitions.handwritingHelper.requirement",
    target: 30,
    titleKey: "progress.badges.definitions.handwritingHelper.title",
    tokenLabel: "hw",
  },
  {
    descriptionKey: "progress.badges.definitions.rubricRiser.description",
    id: "rubric_riser",
    requirementKey: "progress.badges.definitions.rubricRiser.requirement",
    target: 8,
    titleKey: "progress.badges.definitions.rubricRiser.title",
    tokenLabel: "rb",
  },
];

function getBadgeMetricValue(
  id: ProgressBadgeId,
  totals: ProgressTotals,
  streak: ProgressStreakSummary,
): number {
  switch (id) {
    case "feedback_applier":
      return totals.aiFeedbackApplied;
    case "first_assignment":
      return totals.assignmentsCompleted;
    case "handwriting_helper":
      return totals.handwritingMinutes;
    case "revision_builder":
      return totals.revisionsCompleted;
    case "rubric_riser":
      return totals.rubricImprovement;
    case "three_day_streak":
      return streak.currentDays;
    case "weekly_goal":
      return totals.minutesThisWeek >= totals.weeklyMinutesGoal ? 1 : totals.minutesThisWeek / totals.weeklyMinutesGoal;
    case "word_builder":
      return totals.wordsWritten;
  }
}

export function evaluateBadgeUnlocks(input: {
  definitions?: ProgressBadgeDefinition[];
  newBadgeIds?: ProgressBadgeId[];
  streak: ProgressStreakSummary;
  totals: ProgressTotals;
}): ProgressBadgeViewModel[] {
  const definitions = input.definitions ?? progressBadgeDefinitions;
  const newBadgeIds = new Set(input.newBadgeIds ?? []);

  return definitions.map((definition) => {
    const metricValue = getBadgeMetricValue(definition.id, input.totals, input.streak);
    const progressValue = Math.min(1, Math.max(0, metricValue / definition.target));
    const unlocked = progressValue >= 1;

    return {
      ...definition,
      progressValue,
      status: unlocked ? (newBadgeIds.has(definition.id) ? "new" : "unlocked") : "locked",
      unlocked,
    };
  });
}
