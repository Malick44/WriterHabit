# 04 — Data Model

The planned backend database schema and relationship map now live in
`services/api/docs/DATABASE_SCHEMA.md` and
`services/api/docs/DATA_RELATIONSHIPS.md`, with draft Supabase/Postgres
migrations in `services/api/migrations/`. This document continues to describe
the product and mobile/API-facing TypeScript models. The current cross-layer
TypeScript, Zod, local persistence, and backend record map is documented in
`docs/DATA_STRUCTURES.md`.

## Core Entities

### User

```ts
type UserRole = "student" | "parent" | "teacher" | "admin";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### StudentProfile

```ts
type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface StudentProfile {
  id: string;
  userId: string;
  gradeLevel: GradeLevel;
  writingLevel: "getting_started" | "building" | "steady" | "confident";
  writingGoals: WritingGoal[];
  dailyGoalMinutes: 5 | 10 | 15 | 20 | 30;
  language: string;
  accessibilitySettings: AccessibilitySettings;
  parentUserIds: string[];
  teacherUserIds: string[];
  onboardingCompletedAt?: string;
}
```

Current mobile onboarding keeps recoverable in-progress setup locally through `apps/mobile/src/features/onboarding/stores/onboardingStore.ts` and syncs signed-in student profile progress to `student_profiles` when a profile/grade exists. Completion writes grade, writing goals, writing level, daily goal, and `onboarding_completed_at` to `student_profiles`; non-secret public Supabase auth metadata keeps only `onboarding_complete` and `grade_level` as current route-gate compatibility signals and does not include role, entitlement, writing-goal, confidence, or daily-practice values. Mobile UX role and subscription state are mapped from trusted server-owned `app_metadata` only, with missing or invalid values defaulting to `student` and `free`. Student edit, goals, language settings, and accessibility settings sync to `student_profiles` through Supabase RPCs or RLS-protected profile updates; parent links, teacher approvals, and production API hydration remain future backend work.

Notification preferences are validated settings owned by
`apps/mobile/src/features/profile-settings/services/notificationPreferencesService.ts`.
They are persisted through the existing `preferencesStorage` facade, synced
through Supabase RPCs when a session exists, and scheduled locally through
`apps/mobile/src/core/notifications/notificationDeliveryService.ts` when device
permissions allow. Expo push tokens are registered only through the backend API
boundary and are not stored in mobile local preferences.

```ts
interface NotificationPreferences {
  enabled: boolean;
  timezone: string;
  dailyAssignment: { enabled: boolean; timeOfDay: string };
  streak: { enabled: boolean; timeOfDay: string };
  incompleteAssignment: { enabled: boolean; timeOfDay: string };
  weeklyReport: {
    enabled: boolean;
    timeOfDay: string;
    weekday:
      | "sunday"
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday";
  };
}
```

### WritingGoal

```ts
type WritingGoal =
  | "improve_spelling"
  | "write_better_sentences"
  | "write_paragraphs"
  | "write_essays"
  | "creative_writing"
  | "test_prep"
  | "improve_grammar"
  | "school_assignments"
  | "improve_handwriting";
```

### Assignment

```ts
type AssignmentType =
  | "sentence_practice"
  | "paragraph_writing"
  | "essay_writing"
  | "creative_writing"
  | "reading_response"
  | "grammar_practice"
  | "vocabulary_practice"
  | "test_prep"
  | "journal"
  | "handwriting_practice";

interface Assignment {
  id: string;
  title: string;
  prompt: string;
  assignmentType: AssignmentType;
  gradeLevelMin: GradeLevel;
  gradeLevelMax: GradeLevel;
  skillFocus: WritingSkill[];
  difficulty: "easy" | "moderate" | "challenging";
  estimatedMinutes: number;
  rubricId: string;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### StudentAssignment

```ts
type StudentAssignmentStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "reviewing"
  | "feedback_ready"
  | "revision_in_progress"
  | "completed";

interface StudentAssignment {
  id: string;
  studentId: string;
  assignmentId: string;
  status: StudentAssignmentStatus;
  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  currentSubmissionId?: string;
}
```

Current mobile assignment screens use a feature-owned read model in
`apps/mobile/src/features/assignments/types.ts`, validated with Zod at
`apps/mobile/src/features/assignments/api/assignmentsApi.ts`. It extends the
core assignment fields with student-specific status, draft summary, rubric
checklist, instructions, and UI labels until backend assignment contracts exist.

```ts
interface AssignmentRecord {
  id: string;
  title: string;
  prompt: string;
  assignmentType: AssignmentType;
  gradeLevelMin: GradeLevel;
  gradeLevelMax: GradeLevel;
  skillFocus: WritingSkill[];
  difficulty: "easy" | "moderate" | "challenging";
  estimatedMinutes: number;
  rubricId: string;
  status: StudentAssignmentStatus;
  assignedLabel: string;
  dueLabel: string;
  instructions: string[];
  rubric: {
    id: string;
    label: string;
    description: string;
  }[];
  draft: {
    wordCount: number;
    canvasPageCount: number;
    revisionNumber: number;
    preview: string;
    lastEditedLabel: string;
  } | null;
  currentSubmissionId?: string;
  submittedLabel?: string;
  teacherNote?: string;
}
```

The assignment feature currently supports history tabs, assignment detail,
handwriting canvas entry, image/file upload entry, and guarded submission
confirmation. Student-facing writing assignments and daily practice are
handwriting-first: primary writing actions open canvas or upload/photo capture,
while typed text remains a saved copy/transcription and compatibility path.
Signed-in assignment history/detail reads use Supabase assignment rows, and
signed-in submissions call the backend workflow that persists
`submissions`/`submission_contents` under the authenticated student profile.
When the upload flow extracts or lets the student edit response text, that text
is submitted through the same workflow. Signed-in upload submissions also store
selected photo/file bytes in the private `submission-attachments` Supabase
Storage bucket and bounded attachment metadata in `submission_attachments`,
including upload status and object path, so the submitted evidence record does
not disappear after the screen unmounts.
No-session/demo assignment data remains deterministic mock data.

### Grade 3 Writing Adventure Progress

The Grade 3 Writing Adventure is a 30-day reading and writing program under
`apps/mobile/src/features/grade3-writing-adventure/`.
Program content is bundled in
`apps/mobile/src/features/grade3-writing-adventure/content/grade3WritingProgram.content.ts`.
Signed-in student progress is stored in Supabase `grade3_writing_progress`
under the student's `student_profile_id`. No-session and failed remote saves
fall back to Expo SQLite. The flow does not use AI grading.

```sql
create table if not exists public.grade3_writing_progress (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  day smallint not null,
  draft text not null default '',
  stronger_sentence text not null default '',
  favorite_sentence text not null default '',
  checklist jsonb not null default '{}'::jsonb,
  planning jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  client_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Day 1 is unlocked by default. Each next day unlocks after the previous day has
`completed = 1`. The Grade 3 lesson route renders a focused internal step flow:
Read, Talk, Plan, Write, Check, Submit, then a local celebration state.
`planning` stores the Talk idea and beginning/middle/end planner fields.
The `draft` field stores the student's typed daily writing and is sufficient for
submission when the stronger sentence and checklist requirements are complete.
Canvas and image upload remain optional handwriting supports, not required
completion evidence. Library and badge screens read from the same progress
service, which prefers Supabase for signed-in users and SQLite for fallback.
The progress summary derives completed days, unlocked days, saved draft days,
the ordered Day 1-forward streak, and named milestone badges from these rows.

Daily assignment selection now lives in
`apps/mobile/src/features/assignments/services/dailyAssignmentService.ts`. The
selector chooses from a deterministic daily assignment catalog using grade,
writing goals, weak skills, recent history, daily minutes, repeat avoidance,
inactivity, and gradual difficulty adjustment. The mock assignment API uses this
service for its current daily assignment.

```ts
interface DailyAssignmentSelectionResult {
  assignment: DailyAssignmentTemplate;
  inactivityDays: number | null;
  matchedGoals: WritingGoal[];
  matchedWeakSkills: WritingSkill[];
  recentTypeCount: number;
  reasonCodes: DailyAssignmentReasonCode[];
  score: number;
  targetDifficulty: "easy" | "moderate" | "challenging";
}
```

### StudentHomeDashboard Read Model

The mobile student dashboard currently uses a feature-owned mock API contract in
`apps/mobile/src/features/student-home/api/studentHomeApi.ts`. The contract is
validated by `studentHomeApiResponseSchema` in
`apps/mobile/src/features/student-home/types.ts` before the screen renders it.
It is a read model for the daily hub, not a persisted backend table.

```ts
interface StudentHomeDashboard {
  studentId: string;
  gradeLevel: GradeLevel;
  generatedAt: string;
  connectionStatus: "online" | "offline_cached";
  todayAssignment: StudentHomeAssignment | null;
  continueDraft: StudentHomeDraft | null;
  streak: {
    currentDays: number;
    bestDays: number;
    practicedToday: boolean;
    nextMilestoneDays: number;
  };
  weeklyWriting: {
    minutesCompleted: number;
    minutesGoal: number;
    sessionsCompleted: number;
  };
  dailyPractice: {
    completedToday: boolean;
    minutesGoal: number;
    nextPromptLabel: string;
  };
  skillProgress: StudentHomeSkillProgress[];
  recentFeedback: StudentHomeFeedback[];
  revisionNudges: string[];
}
```

Current dashboard states are loading, empty, error, offline cached, and success.
The mock data supports grade-adaptive variants for elementary, middle, and high
school students while downstream progress and full feedback screens remain future
implementation work.

### WritingDraft

The typed writing workspace uses a feature-owned draft model in
`apps/mobile/src/features/writing-workspace/types.ts`. Signed-in drafts persist
to Supabase `writing_drafts`; no-session and failed remote saves fall back to
`apps/mobile/src/services/storage/localJsonStorage.ts`, which uses the Expo
SQLite localStorage install already available to the mobile runtime.

```ts
interface WritingDraft {
  assignmentId: string;
  canvasAttachment: {
    canvasId: string;
    pageCount: number;
    title: string;
    updatedLabel: string;
  } | null;
  createdAt: string;
  revisionNumber: number;
  studentId: string;
  text: string;
  updatedAt: string;
}
```

Typed drafts are capped at 20,000 characters before persistence. The workspace
derives word, sentence, and paragraph counts locally for display and submission
validation. Empty drafts cannot be submitted. Authenticated production
submission calls now go through `POST /api/v1/student-assignments/:id/submissions`,
where the backend transaction creates the submission/content/review-job rows and
advances assignment status. If the backend call fails, the local draft remains
available for retry.

### WritingSubmission

```ts
interface WritingSubmission {
  id: string;
  studentAssignmentId: string;
  studentId: string;
  typedText: string;
  canvasDocumentIds: string[];
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  revisionNumber: number;
  submittedAt: string;
}
```

### CanvasDocument

```ts
type CanvasTemplate =
  | "blank_page"
  | "lined_paper"
  | "storyboard"
  | "mind_map"
  | "essay_plan"
  | "vocabulary_web"
  | "handwriting_practice"
  | "annotate_passage";

interface CanvasDocument {
  id: string;
  studentId: string;
  assignmentId?: string;
  template: CanvasTemplate;
  title: string;
  strokes: CanvasStroke[];
  syncStatus: "local_only" | "saving" | "saved" | "sync_failed";
  attachedAt?: string;
  clientVersion?: number;
  exportStatus?: "not_requested" | "queued" | "ready" | "failed";
  lastSyncedAt?: string;
  previewImageUrl?: string;
  recognizedText?: string;
  serverVersion?: number;
  storageObjectPath?: string;
  createdAt: string;
  updatedAt: string;
}
```

Current mobile canvas documents live in `apps/mobile/src/features/canvas/types.ts`
and are persisted locally through
`apps/mobile/src/features/canvas/services/canvasPersistenceService.ts`. The
implementation stores compact stroke arrays, not base64 images. Documents are
indexed per student, capped at 24 local documents, and each document is capped at
240 strokes with 16 points per stroke before persistence.

Canvas sync orchestration lives in
`apps/mobile/src/features/canvas/services/canvasSyncService.ts`. It saves local
work before any backend attempt, tracks client/backend versions, uploads the
editable stroke-document JSON artifact to the private `canvas-artifacts`
Supabase Storage bucket for signed-in saves, and preserves the local document
with `sync_failed` when backend sync fails. Deterministic preview export
placeholders exist; actual image/PDF generation, preview object upload, and
handwriting recognition are future work.

Canvas attachment currently sets `assignmentId` locally and exposes a compact
summary to the typed writing workspace so the assignment preview can show the
attached canvas page.

### Feedback

```ts
interface Feedback {
  id: string;
  submissionId: string;
  studentId: string;
  gradeLevel: GradeLevel;
  strengths: string[];
  improvementAreas: string[];
  revisionTask: RevisionTask;
  rubricScores: RubricScore[];
  grammarSuggestions: GrammarSuggestion[];
  feedbackSummary: string;
  createdAt: string;
}
```

Current mobile feedback review screens use a feature-owned mock read model in
`apps/mobile/src/features/feedback-review/types.ts`, validated in
`apps/mobile/src/features/feedback-review/api/feedbackreviewApi.ts`. The current
review facade derives deterministic feedback from assignment mock data and the
locally saved typed draft, but it returns bounded excerpts rather than retaining
full student drafts in review state.

```ts
interface FeedbackReview {
  id: string;
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  assignmentPrompt: string;
  assignmentType: AssignmentType;
  studentId: string;
  gradeLevel: GradeLevel;
  status: "completed";
  connectionStatus: "online" | "offline_cached";
  submittedTextExcerpt: string;
  summary: {
    strength: string;
    improvement: string;
    nextRevisionTask: string;
  };
  revisionTask: {
    id: string;
    instruction: string;
    targetSkill: WritingSkill;
    focusLabel: string;
    guidingQuestion: string;
    originalExcerpt: string;
  };
  rubricScores: {
    criterionId: string;
    label: string;
    description: string;
    score: 1 | 2 | 3 | 4;
    maxScore: 4;
    level: "starting" | "building" | "meeting" | "strong";
    coachingNote: string;
  }[];
  grammarSuggestions: {
    id: string;
    title: string;
    explanation: string;
    originalExcerpt: string;
    studentAction: string;
  }[];
  progressEarned: {
    minutes: number;
    points: number;
    skill: WritingSkill;
  };
  createdAt: string;
}
```

Revision submission validates one focused student-written revised passage.
Signed-in completion goes through the backend revision workflow and writes
`submission_revisions` plus progress side effects; no-session demo paths still
return local completion payloads. In-progress revision text is stored in
Supabase `submission_revision_drafts` for signed-in students through
`apps/mobile/src/features/feedback-review/services/revisionPersistenceService.ts`,
falls back to local recovery storage when needed, and is removed after
successful revision submission.

### ProgressDashboard

The current mobile progress feature lives in `apps/mobile/src/features/progress/`.
It uses a deterministic local mock API in
`apps/mobile/src/features/progress/api/progressApi.ts`, validates response data
with Zod in `apps/mobile/src/features/progress/types.ts`, and builds
grade-adapted dashboard view models in
`apps/mobile/src/features/progress/services/progressViewModel.ts`.

Tracked progress fields include:

```ts
interface ProgressTotals {
  assignmentsCompleted: number;
  minutesThisWeek: number;
  weeklyMinutesGoal: number;
  wordsWritten: number;
  revisionsCompleted: number;
  rubricImprovement: number;
  aiFeedbackApplied: number;
  handwritingMinutes: number;
}
```

Daily activity entries also track date, practiced skills, assignments,
minutes, words, revisions, feedback applied, handwriting minutes, and rubric
improvement. Streaks are computed by
`apps/mobile/src/features/progress/services/streakService.ts`; badge unlocks
are computed by
`apps/mobile/src/features/progress/services/badgeUnlockService.ts`.

Streak continuation status is also derived in
`apps/mobile/src/features/progress/services/streakService.ts` so reminder logic
can distinguish continued, at-risk, missed, and not-started streak states.

### PreparedNotification

MVP notification preparation lives in
`apps/mobile/src/core/notifications/notificationService.ts`. It builds local,
localization-keyed notification payloads and route targets for daily assignment,
streak, incomplete assignment, and weekly report notifications.
`apps/mobile/src/core/notifications/notificationDeliveryService.ts` schedules
enabled reminders locally with `expo-notifications` and registers an Expo push
token through `apps/mobile/src/features/profile-settings/api/profilesettingsApi.ts`
when a native build and permission state allow. Backend push delivery logic lives
in `services/api/src/features/notifications/`; a deployed API runtime, scheduler,
and push credentials are still required before remote push delivery is
production-ready.

```ts
type NotificationType =
  "daily_assignment" | "streak" | "incomplete_assignment" | "weekly_report";

interface PreparedNotification {
  id: string;
  type: NotificationType;
  studentId: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  accessibilityLabelKey: TranslationKey;
  params: TranslationParams;
  scheduledForLocal: string;
  data: {
    notificationType: NotificationType;
    targetRoute: string;
    targetParams: Record<string, string>;
  };
}
```

### RevisionTask

```ts
interface RevisionTask {
  id: string;
  instruction: string;
  targetSkill: WritingSkill;
  example?: string;
}
```

### Rubric

```ts
interface Rubric {
  id: string;
  name: string;
  gradeLevelMin: GradeLevel;
  gradeLevelMax: GradeLevel;
  assignmentType: AssignmentType;
  criteria: RubricCriterion[];
}
```

### ProgressMetric

```ts
type WritingSkill =
  | "spelling"
  | "grammar"
  | "punctuation"
  | "sentence_structure"
  | "vocabulary"
  | "organization"
  | "creativity"
  | "clarity"
  | "evidence_usage"
  | "argument_strength"
  | "revision_quality"
  | "handwriting"
  | "reading_response";

interface ProgressMetric {
  id: string;
  studentId: string;
  skill: WritingSkill;
  currentScore: number;
  previousScore: number;
  level: 1 | 2 | 3 | 4 | 5;
  updatedAt: string;
}
```

### Badge

```ts
interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlockCondition: string;
}
```

### StudentBadge

```ts
interface StudentBadge {
  id: string;
  studentId: string;
  badgeId: string;
  unlockedAt: string;
}
```

### ParentStudentLink

```ts
interface ParentStudentLink {
  id: string;
  parentUserId: string;
  studentUserId: string;
  status: "pending" | "active" | "revoked";
  createdAt: string;
}
```

Parent reporting is currently represented by local mobile API contracts in
`apps/mobile/src/features/parent/types.ts`; these are not database tables yet.
The current contracts include:

```ts
interface ParentStudentSummary {
  id: string;
  displayName: string;
  gradeLevel: GradeLevel;
  schoolLabel: string;
  relationshipLabel: string;
  avatarInitials: string;
}

interface ParentWeeklyProgress {
  weekLabel: string;
  minutesCompleted: number;
  minutesGoal: number;
  sessionsCompleted: number;
  completedAssignments: number;
  assignedAssignments: number;
  streakDays: number;
  skillImprovementPercent: number;
  areaToPractice: WritingSkill;
  areaToPracticeLabel: string;
  areaToPracticeDescription: string;
  celebration: string;
}

interface ParentSettings {
  aiCoachAccess: "hints_and_revision" | "restricted";
  assignmentAlertsEnabled: boolean;
  digestFrequency: "weekly" | "twice_weekly";
  practiceReminderEnabled: boolean;
  quietHoursLabel: string;
  shareWeeklySummaryWithTeacher: boolean;
  weeklyReportEmailEnabled: boolean;
}
```

### Class

```ts
interface Class {
  id: string;
  teacherUserId: string;
  name: string;
  gradeLevel: GradeLevel;
  schoolName?: string;
  createdAt: string;
}
```

### ClassStudent

```ts
interface ClassStudent {
  id: string;
  classId: string;
  studentUserId: string;
  joinedAt: string;
}
```

Teacher experience screens currently use local mobile API contracts in
`apps/mobile/src/features/teacher/types.ts`; these are not database tables yet.
The current contracts include:

```ts
interface TeacherClassSummary {
  id: string;
  name: string;
  gradeLevel: GradeLevel;
  studentCount: number;
  activeAssignmentCount: number;
  submissionsNeedingReview: number;
  averageCompletionPercent: number;
  averageSkillScore: number;
  weeklyWritingMinutes: number;
  trendLabel: string;
}

interface TeacherAssignmentSummary {
  id: string;
  title: string;
  prompt: string;
  assignmentType: AssignmentType;
  classId: string;
  className: string;
  gradeLevel: GradeLevel;
  skillFocus: WritingSkill[];
  dueDate: string;
  dueLabel: string;
  rubric: {
    id: string;
    label: string;
    description: string;
    maxScore: number;
  }[];
  allowCanvas: boolean;
  status: "draft" | "active" | "closed";
  submissionsCount: number;
  completionPercent: number;
  createdAt: string;
}

interface TeacherStudentProgress {
  id: string;
  displayName: string;
  gradeLevel: GradeLevel;
  assignmentCompletionPercent: number;
  averageRubricScore: number;
  revisionRatePercent: number;
  lastSubmissionLabel: string;
  needsSupport: boolean;
  focusSkill: WritingSkill;
}

interface TeacherSubmissionReview {
  id: string;
  assignmentTitle: string;
  assignmentPrompt: string;
  className: string;
  studentName: string;
  gradeLevel: GradeLevel;
  submittedLabel: string;
  wordCount: number;
  writingPreview: string;
  canvasPreview: { title: string; pageCount: number } | null;
  rubric: {
    criterionId: string;
    label: string;
    score: number;
    maxScore: number;
    coachingNote: string;
  }[];
  revisionTask: string;
  teacherComment: string;
  safetyNote: string;
}
```

Teacher assignment creation is validated locally before publication with title,
prompt, grade, class, due date, one to three skill-focus values, at least two
rubric criteria, and a canvas attachment toggle. The current facade is
deterministic mock data; backend persistence, authorization, class roster sync,
and cross-device comment persistence remain future work.
