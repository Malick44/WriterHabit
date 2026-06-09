import { routes } from "@/core/navigation/routeNames";

import {
  getCompletedOnboardingProfile,
  getFirstIncompleteOnboardingStep,
} from "../types";
import {
  getOnboardingPreviewProgress,
  getOnboardingPreviewTarget,
  onboardingPreviewTargets,
} from "./onboardingPreviewService";

describe("onboarding preview service", () => {
  it("defines a preview target for each onboarding screen", () => {
    expect(onboardingPreviewTargets.map((target) => target.id)).toEqual([
      "role",
      "grade",
      "goals",
      "confidence",
      "dailyPractice",
      "planSummary",
    ]);
  });

  it("falls back to the role screen for unknown preview targets", () => {
    const target = getOnboardingPreviewTarget("missing");

    expect(target.id).toBe("role");
    expect(target.route).toBe(routes.onboardingRoleSelection);
  });

  it("seeds the minimum progress needed for intermediate onboarding screens", () => {
    expect(getFirstIncompleteOnboardingStep(getOnboardingPreviewProgress("goals"))).toBe("goals");
    expect(getFirstIncompleteOnboardingStep(getOnboardingPreviewProgress("dailyPractice"))).toBe("dailyPractice");
  });

  it("seeds a complete profile for the plan summary preview", () => {
    const result = getCompletedOnboardingProfile(getOnboardingPreviewProgress("planSummary"));

    expect(result.success).toBe(true);
  });
});
