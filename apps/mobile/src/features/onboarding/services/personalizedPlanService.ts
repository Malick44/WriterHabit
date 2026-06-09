import { typography } from "@/design/tokens";

import {
  MAX_WRITING_GOALS,
  personalizedPlanSchema,
  type CompletedOnboardingProfile,
  type PersonalizedPlan,
} from "../types";

function getAssignmentFocus(profile: CompletedOnboardingProfile): PersonalizedPlan["assignmentFocus"] {
  if (profile.gradeLevel <= 5) {
    return "sentence_practice";
  }

  if (profile.gradeLevel <= 8) {
    return "paragraph_practice";
  }

  return "essay_practice";
}

export function buildPersonalizedPlan(profile: CompletedOnboardingProfile): PersonalizedPlan {
  const plan: PersonalizedPlan = {
    assignmentFocus: getAssignmentFocus(profile),
    confidenceLevel: profile.confidenceLevel,
    dailyPracticeMinutes: profile.dailyPracticeMinutes,
    firstWeekGoals: profile.writingGoals.slice(0, MAX_WRITING_GOALS),
    gradeBand: typography.getGradeBandForGrade(profile.gradeLevel),
    gradeLevel: profile.gradeLevel,
    weeklyPracticeMinutes: profile.dailyPracticeMinutes * 5,
  };

  return personalizedPlanSchema.parse(plan);
}

export const personalizedPlanService = {
  async createPlan(profile: CompletedOnboardingProfile): Promise<PersonalizedPlan> {
    return buildPersonalizedPlan(profile);
  },
};
