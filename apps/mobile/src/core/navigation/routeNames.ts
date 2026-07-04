import type { Href } from "expo-router";

export const routes = {
  launch: "/" as Href,
  authWelcome: "/(auth)/welcome" as Href,
  authSignIn: "/(auth)/sign-in" as Href,
  authSignUp: "/(auth)/sign-up" as Href,
  onboardingRoleSelection: "/(onboarding)/role-selection" as Href,
  onboardingGradeSelection: "/(onboarding)/grade-selection" as Href,
  onboardingWritingGoals: "/(onboarding)/writing-goals" as Href,
  onboardingWritingConfidence: "/(onboarding)/writing-confidence" as Href,
  onboardingDailyPracticeGoal: "/(onboarding)/daily-practice-goal" as Href,
  onboardingPlanSummary: "/(onboarding)/plan-summary" as Href,
  studentHome: "/(student)/home" as Href,
  studentPractice: "/(student)/practice" as Href,
  studentMessages: "/(student)/messages" as Href,
  studentAssignmentsHistory: "/(student)/assignments/history" as Href,
  studentAssignmentSubmission: "/(student)/assignments/submit" as Href,
  studentCanvasHome: "/(student)/canvas" as Href,
  studentCanvasCreate: "/(student)/canvas/create" as Href,
  studentGrade3Writing: "/(student)/grade3-writing" as Href,
  studentProgress: "/(student)/progress" as Href,
  studentProgressBadges: "/(student)/progress/badges" as Href,
  studentProgressWeeklyReview: "/(student)/progress/weekly-review" as Href,
  studentProfile: "/(student)/profile" as Href,
  studentSettings: "/(student)/settings" as Href,
  studentEditProfile: "/(student)/edit-profile" as Href,
  studentWritingGoals: "/(student)/writing-goals" as Href,
  studentNotificationSettings: "/(student)/notification-settings" as Href,
  studentLanguageSettings: "/(student)/language-settings" as Href,
  studentAccessibilitySettings: "/(student)/accessibility-settings" as Href,
  studentReadAloudVoiceSettings: "/(student)/read-aloud-voice-settings" as Href,
  parentHome: "/(parent)/home" as Href,
  parentReports: "/(parent)/reports" as Href,
  parentAssignments: "/(parent)/assignments" as Href,
  parentSettings: "/(parent)/settings" as Href,
  teacherDashboard: "/(teacher)/dashboard" as Href,
  teacherAssignments: "/(teacher)/assignments" as Href,
  teacherCreateAssignment: "/(teacher)/assignments/create" as Href,
  teacherSubmissions: "/(teacher)/submissions" as Href,
  teacherSettings: "/(teacher)/settings" as Href,
  teacherAccessibilitySettings: "/(teacher)/accessibility-settings" as Href,
  paywall: "/paywall" as Href,
} as const;

export type AppRouteName = keyof typeof routes;
export type AppRoute = (typeof routes)[AppRouteName];

export const studentTabRoutes = [
  routes.studentHome,
  routes.studentPractice,
  routes.studentAssignmentsHistory,
  routes.studentCanvasHome,
] as const;

export const parentTabRoutes = [
  routes.parentHome,
  routes.parentReports,
  routes.parentAssignments,
  routes.parentSettings,
] as const;

export const teacherTabRoutes = [
  routes.teacherDashboard,
  routes.teacherAssignments,
  routes.teacherSubmissions,
  routes.teacherSettings,
] as const;
