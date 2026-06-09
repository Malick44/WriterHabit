import type { UserRole } from "@writewise/shared";

import type { AuthSession, NavigableUserRole } from "./authTypes";

export function canAccessStudentArea(role: UserRole) {
  return role === "student" || role === "admin";
}

export function canAccessParentArea(role: UserRole) {
  return role === "parent" || role === "admin";
}

export function canAccessTeacherArea(role: UserRole) {
  return role === "teacher" || role === "admin";
}

export function canAccessRoleArea(role: UserRole, area: Exclude<NavigableUserRole, "admin">) {
  switch (area) {
    case "student":
      return canAccessStudentArea(role);
    case "parent":
      return canAccessParentArea(role);
    case "teacher":
      return canAccessTeacherArea(role);
  }
}

export function isAuthenticatedSession(session: AuthSession | null): session is AuthSession {
  return Boolean(session);
}

export function hasCompletedOnboarding(session: AuthSession | null): boolean {
  return Boolean(session?.onboardingComplete);
}
