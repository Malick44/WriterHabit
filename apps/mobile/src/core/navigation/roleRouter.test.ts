import { createMockSession } from "@/core/auth/authStore";

import { getLaunchRoute, getPostLoginRoute, getRouteAccessDecision } from "./roleRouter";
import { routes } from "./routeNames";

describe("roleRouter", () => {
  it("routes signed-out users to auth", () => {
    expect(getLaunchRoute(null)).toBe(routes.authWelcome);
  });

  it("routes incomplete users to onboarding", () => {
    expect(getLaunchRoute(createMockSession("student", false))).toBe(routes.onboardingRoleSelection);
  });

  it("routes authenticated roles to their home areas", () => {
    expect(getLaunchRoute(createMockSession("student", true))).toBe(routes.studentHome);
    expect(getLaunchRoute(createMockSession("parent", true))).toBe(routes.parentHome);
    expect(getLaunchRoute(createMockSession("teacher", true))).toBe(routes.teacherDashboard);
  });

  it("routes dev post-login sessions to onboarding", () => {
    expect(getPostLoginRoute(createMockSession("student", true))).toBe(
      __DEV__ ? routes.onboardingRoleSelection : routes.studentHome,
    );
  });

  it("blocks role mismatches and returns the role home redirect", () => {
    expect(getRouteAccessDecision(createMockSession("parent", true), "student")).toEqual({
      allowed: false,
      redirectTo: routes.parentHome,
      reason: "role_mismatch",
    });
  });

  it("keeps auth routes signed-out only", () => {
    expect(getRouteAccessDecision(null, "auth")).toEqual({ allowed: true });
    expect(getRouteAccessDecision(createMockSession("student", true), "auth")).toEqual({
      allowed: false,
      redirectTo: __DEV__ ? routes.onboardingRoleSelection : routes.studentHome,
      reason: "already_authenticated",
    });
  });

  it("allows completed users to revisit onboarding in dev mode", () => {
    expect(getRouteAccessDecision(createMockSession("student", true), "onboarding")).toEqual(
      __DEV__
        ? { allowed: true }
        : {
            allowed: false,
            redirectTo: routes.studentHome,
            reason: "already_authenticated",
          },
    );
  });

  it("requires onboarding before role-specific and paywall routes", () => {
    expect(getRouteAccessDecision(createMockSession("student", false), "student")).toEqual({
      allowed: false,
      redirectTo: routes.onboardingRoleSelection,
      reason: "onboarding_incomplete",
    });
    expect(getRouteAccessDecision(createMockSession("student", false), "paywall")).toEqual({
      allowed: false,
      redirectTo: routes.onboardingRoleSelection,
      reason: "onboarding_incomplete",
    });
  });
});
