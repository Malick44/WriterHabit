# 04 — Data Model

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
  dailyGoalMinutes: 10 | 15 | 20 | 30;
  language: string;
  accessibilitySettings: AccessibilitySettings;
  parentUserIds: string[];
  teacherUserIds: string[];
  onboardingCompletedAt?: string;
}
```

Current mobile onboarding persists in-progress setup locally through `apps/mobile/src/features/onboarding/stores/onboardingStore.ts`. Completion currently writes non-secret public Supabase auth metadata keys: `onboarding_complete`, `role`, `grade_level`, `writing_goals`, `confidence_level`, and `daily_practice_minutes`. Dedicated student profile tables and API persistence are still future backend work.

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
start-writing/start-canvas routes, and guarded submission confirmation. Data is
deterministic mock data; real assignment persistence and submission APIs remain
future backend work.

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

The typed writing workspace currently uses a feature-owned local draft model in
`apps/mobile/src/features/writing-workspace/types.ts`. Drafts are validated with
Zod and persisted through `apps/mobile/src/services/storage/localJsonStorage.ts`,
which uses the Expo SQLite localStorage install already available to the mobile
runtime.

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
validation. Empty drafts cannot be submitted. Submission currently routes to the
AI review loading screen with a deterministic local `submissionId`; backend draft
and submission persistence remain future work.

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
  previewImageUrl?: string;
  recognizedText?: string;
  createdAt: string;
  updatedAt: string;
}
```

Current mobile canvas documents live in `apps/mobile/src/features/canvas/types.ts`
and are persisted locally through
`apps/mobile/src/features/canvas/services/canvasPersistenceService.ts`. The
implementation stores compact stroke arrays, not base64 images. Documents are
indexed per student, capped at 24 local documents, and each document is capped at
240 strokes with 16 points per stroke before persistence. Preview image export,
PDF export, object storage sync, and handwriting recognition are future work.

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

Revision submission currently validates one focused student-written revised
passage and returns a local completion payload. In-progress revision text is
stored locally through
`apps/mobile/src/features/feedback-review/services/revisionPersistenceService.ts`
and removed after successful revision submission. Progress earned is a
placeholder shown in the completion screen until the Prompt 15 progress feature
and backend progress APIs exist.

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
