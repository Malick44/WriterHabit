/**
 * Stable mobile persistence keys.
 *
 * Keep this file as the first stop for new local/SecureStore keys so ownership,
 * versioning, and privacy level are visible in one place. The storage facades
 * add their own physical prefixes (`WriterHabit.pref.`, `WriterHabit.local.`,
 * `WriterHabit.secure.`), so these keys should describe logical ownership only.
 */

export const storageKeys = {
  accessibilitySettings: "profile-settings.accessibility",

  readAloudVoice: "speech.read-aloud-voice",
  readAloudRate: "speech.read-aloud-rate",
  readAloudWordHighlight: "speech.read-aloud-word-highlight",

  onboardingProgress(userId: string): string {
    return `onboarding.progress.${userId}`;
  },

  notificationPreferences(studentId: string): string {
    return `profile-settings.notifications.${studentId}`;
  },

  studentProfileSettings(studentId: string): string {
    return `profile-settings.student-profile.${studentId}`;
  },

  assignmentRubricChecks(assignmentId: string): string {
    return `assignments.rubric-checks.${assignmentId}`;
  },

  assignmentTypedCopy(assignmentId: string): string {
    return `assignments.typed-copy.${assignmentId}`;
  },

  typedCopyInputEnabled: "assignments.typed-copy-input-enabled",

  teacherDashboardInsightDismissed(userId: string): string {
    return `teacher.dashboard.insight-dismissed.${userId}`;
  },

  writingDraft(studentId: string, assignmentId: string): string {
    return `writing-draft.${studentId}.${assignmentId}`;
  },
} as const;
