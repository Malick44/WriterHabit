import type { GradeLevel, UserRole, WritingGoal } from "@WriterHabit/shared";

export type NavigableUserRole = Extract<UserRole, "student" | "parent" | "teacher" | "admin">;

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: NavigableUserRole;
  gradeLevel?: GradeLevel;
};

export type AuthSession = {
  token: string;
  refreshToken?: string;
  expiresAt?: string;
  user: AuthUser;
  onboardingComplete: boolean;
  subscriptionStatus: "free" | "trial" | "active" | "past_due";
  source: "supabase" | "mock";
};

export type AuthSessionStatus = "hydrating" | "ready";
export type AuthOperationStatus = "idle" | "loading";
export type AuthErrorCode =
  | "restore_failed"
  | "sign_in_failed"
  | "sign_up_failed"
  | "complete_onboarding_failed";

export type AuthSessionSnapshot = {
  status: AuthSessionStatus;
  session: AuthSession | null;
};

export type MockSessionScenario =
  | "signed_out"
  | "student_onboarding"
  | "student"
  | "parent"
  | "teacher";

export type MockSessionRole = Exclude<NavigableUserRole, "admin">;

export type DemoUserId =
  | "elementary_student"
  | "middle_school_student"
  | "high_school_student"
  | "student_needs_onboarding"
  | "parent_reviewer"
  | "teacher_coach";

export type AuthSignInInput = {
  email: string;
  password: string;
};

export type AuthLoginLinkInput = {
  email: string;
};

export type AuthSignUpInput = {
  email: string;
  password: string;
  displayName: string;
  role: MockSessionRole;
};

export type AuthOnboardingCompletionInput = {
  role?: MockSessionRole;
  gradeLevel?: GradeLevel;
  writingGoals?: WritingGoal[];
  confidenceLevel?: "getting_started" | "building" | "steady" | "confident";
  dailyPracticeMinutes?: 5 | 10 | 15 | 20 | 30;
};

export type AuthActionResult = {
  session: AuthSession | null;
  requiresEmailConfirmation?: boolean;
  errorCode?: AuthErrorCode;
};
