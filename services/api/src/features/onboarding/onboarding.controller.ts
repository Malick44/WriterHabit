export const onboardingEndpoints = [
  "GET /api/v1/students/:studentId/onboarding",
  "PUT /api/v1/students/:studentId/onboarding",
  "POST /api/v1/students/:studentId/onboarding/complete",
  "POST /api/v1/students/:studentId/personalized-plan",
] as const;

export type OnboardingEndpoint = (typeof onboardingEndpoints)[number];

// Framework-neutral placeholder for onboarding persistence and plan generation.
export class OnboardingController {}
