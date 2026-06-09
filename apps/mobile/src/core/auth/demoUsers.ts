import type { GradeLevel } from "@writewise/shared";

import type { TranslationKey } from "@/i18n";

import type { AuthSession, DemoUserId, MockSessionRole } from "./authTypes";

export type DemoUserProfile = {
  id: DemoUserId;
  authUserId: string;
  email: string;
  displayName: string;
  role: MockSessionRole;
  gradeLevel?: GradeLevel;
  onboardingComplete: boolean;
  subscriptionStatus: AuthSession["subscriptionStatus"];
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  accessibilityKey: TranslationKey;
};

export const demoUsers = [
  {
    id: "elementary_student",
    authUserId: "demo-student-elementary",
    email: "mira.elementary@example.test",
    displayName: "Mira Rivera",
    role: "student",
    gradeLevel: 4,
    onboardingComplete: true,
    subscriptionStatus: "free",
    labelKey: "auth.demoUsers.elementaryStudent.label",
    descriptionKey: "auth.demoUsers.elementaryStudent.description",
    accessibilityKey: "auth.demoUsers.elementaryStudent.accessibility",
  },
  {
    id: "middle_school_student",
    authUserId: "demo-student-middle",
    email: "jordan.middle@example.test",
    displayName: "Jordan Lee",
    role: "student",
    gradeLevel: 7,
    onboardingComplete: true,
    subscriptionStatus: "trial",
    labelKey: "auth.demoUsers.middleSchoolStudent.label",
    descriptionKey: "auth.demoUsers.middleSchoolStudent.description",
    accessibilityKey: "auth.demoUsers.middleSchoolStudent.accessibility",
  },
  {
    id: "high_school_student",
    authUserId: "demo-student-high",
    email: "avery.high@example.test",
    displayName: "Avery Chen",
    role: "student",
    gradeLevel: 10,
    onboardingComplete: true,
    subscriptionStatus: "active",
    labelKey: "auth.demoUsers.highSchoolStudent.label",
    descriptionKey: "auth.demoUsers.highSchoolStudent.description",
    accessibilityKey: "auth.demoUsers.highSchoolStudent.accessibility",
  },
  {
    id: "student_needs_onboarding",
    authUserId: "demo-student-onboarding",
    email: "sam.setup@example.test",
    displayName: "Sam Patel",
    role: "student",
    gradeLevel: 6,
    onboardingComplete: false,
    subscriptionStatus: "free",
    labelKey: "auth.demoUsers.studentNeedsOnboarding.label",
    descriptionKey: "auth.demoUsers.studentNeedsOnboarding.description",
    accessibilityKey: "auth.demoUsers.studentNeedsOnboarding.accessibility",
  },
  {
    id: "parent_reviewer",
    authUserId: "demo-parent-reviewer",
    email: "taylor.parent@example.test",
    displayName: "Taylor Rivera",
    role: "parent",
    onboardingComplete: true,
    subscriptionStatus: "active",
    labelKey: "auth.demoUsers.parentReviewer.label",
    descriptionKey: "auth.demoUsers.parentReviewer.description",
    accessibilityKey: "auth.demoUsers.parentReviewer.accessibility",
  },
  {
    id: "teacher_coach",
    authUserId: "demo-teacher-coach",
    email: "casey.teacher@example.test",
    displayName: "Casey Morgan",
    role: "teacher",
    onboardingComplete: true,
    subscriptionStatus: "active",
    labelKey: "auth.demoUsers.teacherCoach.label",
    descriptionKey: "auth.demoUsers.teacherCoach.description",
    accessibilityKey: "auth.demoUsers.teacherCoach.accessibility",
  },
] as const satisfies readonly DemoUserProfile[];

export function getDemoUserById(id: DemoUserId): DemoUserProfile {
  return demoUsers.find((user) => user.id === id) ?? demoUsers[0];
}

export function getDefaultDemoUserForRole(role: MockSessionRole, onboardingComplete = true): DemoUserProfile {
  if (role === "student" && !onboardingComplete) {
    return getDemoUserById("student_needs_onboarding");
  }

  switch (role) {
    case "student":
      return getDemoUserById("middle_school_student");
    case "parent":
      return getDemoUserById("parent_reviewer");
    case "teacher":
      return getDemoUserById("teacher_coach");
  }

  return getDemoUserById("middle_school_student");
}
