import type { UserRole } from "@writewise/shared";

import type { AuthSession, AuthSessionSnapshot } from "@/core/auth/authTypes";
import { canAccessRoleArea, hasCompletedOnboarding, isAuthenticatedSession } from "@/core/auth/roleGuards";

import { routes, type AppRoute } from "./routeNames";

export type RouteAccessArea = "auth" | "onboarding" | "student" | "parent" | "teacher" | "paywall";

export type RouteAccessDecision =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      redirectTo: AppRoute;
      reason: "unauthenticated" | "onboarding_incomplete" | "already_authenticated" | "role_mismatch";
    };

export function getHomeRouteForRole(role: UserRole): AppRoute {
  switch (role) {
    case "student":
      return routes.studentHome;
    case "parent":
      return routes.parentHome;
    case "teacher":
    case "admin":
      return routes.teacherDashboard;
  }
}

export function getLaunchRoute(session: AuthSession | null): AppRoute {
  if (!isAuthenticatedSession(session)) {
    return routes.authWelcome;
  }

  if (!hasCompletedOnboarding(session)) {
    return routes.onboardingRoleSelection;
  }

  return getHomeRouteForRole(session.user.role);
}

function shouldForceOnboardingAfterDevLogin(session: AuthSession | null): session is AuthSession {
  return Boolean(__DEV__ && isAuthenticatedSession(session));
}

export function getPostLoginRoute(session: AuthSession | null): AppRoute {
  if (shouldForceOnboardingAfterDevLogin(session)) {
    return routes.onboardingRoleSelection;
  }

  return getLaunchRoute(session);
}

export function getLaunchRouteFromSnapshot(snapshot: AuthSessionSnapshot): AppRoute | null {
  if (snapshot.status === "hydrating") {
    return null;
  }

  return getLaunchRoute(snapshot.session);
}

export function getRouteAccessDecision(session: AuthSession | null, area: RouteAccessArea): RouteAccessDecision {
  if (area === "auth") {
    if (!session) {
      return { allowed: true };
    }

    return {
      allowed: false,
      redirectTo: getPostLoginRoute(session),
      reason: "already_authenticated",
    };
  }

  if (!session) {
    return {
      allowed: false,
      redirectTo: routes.authWelcome,
      reason: "unauthenticated",
    };
  }

  if (area === "onboarding") {
    if (__DEV__ || !session.onboardingComplete) {
      return { allowed: true };
    }

    return {
      allowed: false,
      redirectTo: getHomeRouteForRole(session.user.role),
      reason: "already_authenticated",
    };
  }

  if (!session.onboardingComplete) {
    return {
      allowed: false,
      redirectTo: routes.onboardingRoleSelection,
      reason: "onboarding_incomplete",
    };
  }

  if (area === "paywall") {
    return { allowed: true };
  }

  if (canAccessRoleArea(session.user.role, area)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    redirectTo: getHomeRouteForRole(session.user.role),
    reason: "role_mismatch",
  };
}
