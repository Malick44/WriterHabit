# 03 — Navigation Map

This document describes the current Expo Router implementation under `apps/mobile/app/`.

## Core Routing Files

Navigation decisions live outside route files:

```txt
apps/mobile/src/core/auth/authTypes.ts
apps/mobile/src/core/auth/authStore.ts
apps/mobile/src/core/auth/AuthSessionProvider.tsx
apps/mobile/src/core/auth/sessionService.ts
apps/mobile/src/core/auth/useAuthSession.ts
apps/mobile/src/core/auth/roleGuards.ts
apps/mobile/src/core/navigation/routeNames.ts
apps/mobile/src/core/navigation/roleRouter.ts
apps/mobile/src/core/navigation/deepLinks.ts
apps/mobile/src/core/navigation/RouteGate.tsx
```

Route files stay thin and import/export feature screens. Layout files define Expo Router stacks/tabs and delegate access decisions to `RouteGate`.

## Expo Router Groups

```txt
apps/mobile/app/
  _layout.tsx                       Root stack and app providers
  index.tsx                         Launch redirect screen
  +not-found.tsx                    Fallback route
  paywall.tsx                       Guarded paywall entry
  (auth)/
    _layout.tsx                     Signed-out stack gate
    welcome.tsx
    sign-in.tsx
    sign-up.tsx
  (onboarding)/
    _layout.tsx                     Onboarding stack gate
    role-selection.tsx
    grade-selection.tsx
    writing-goals.tsx
    writing-confidence.tsx
    daily-practice-goal.tsx
    plan-summary.tsx
  (student)/
    _layout.tsx                     Student bottom tabs
    home.tsx
    assignments/history.tsx
    assignments/[assignmentId].tsx
    assignments/submit.tsx
    canvas/index.tsx
    canvas/templates.tsx
    canvas/[canvasId].tsx
    grade3-writing/index.tsx
    grade3-writing/[day].tsx
    grade3-writing/progress.tsx
    grade3-writing/library.tsx
    grade3-writing/parent-guide.tsx
    progress/index.tsx
    progress/badges.tsx
    progress/skills/[skillId].tsx
    progress/weekly-review.tsx
    profile.tsx
    settings.tsx
    edit-profile.tsx
    writing-goals.tsx
    notification-settings.tsx
    language-settings.tsx
    review/[submissionId]/index.tsx
    review/[submissionId]/summary.tsx
    review/[submissionId]/rubric.tsx
    review/[submissionId]/revision.tsx
    review/[submissionId]/complete.tsx
    write/[assignmentId].tsx
  (parent)/
    _layout.tsx                     Parent bottom tabs
    home.tsx
    reports.tsx
    assignments/index.tsx
    assignments/[submissionId].tsx
    settings.tsx
    students/[studentId]/report.tsx
  (teacher)/
    _layout.tsx                     Teacher bottom tabs
    dashboard.tsx
    assignments/index.tsx
    assignments/create.tsx
    classes/[classId]/progress.tsx
    submissions/index.tsx
    submissions/[submissionId].tsx
```

## Launch Routing Logic

`apps/mobile/src/features/auth/screens/LaunchScreen.tsx` uses `getLaunchRoute` from `apps/mobile/src/core/navigation/roleRouter.ts`.

On app launch:

1. If the session is hydrating, show a loading state.
2. If no session exists, route to `/(auth)/welcome`.
3. If a session exists but onboarding is incomplete, route to `/(onboarding)/role-selection`.
4. If the role is `student`, route to `/(student)/home`.
5. If the role is `parent`, route to `/(parent)/home`.
6. If the role is `teacher`, route to `/(teacher)/dashboard`.
7. `admin` is supported by the shared role type and currently defaults to the teacher dashboard.

## Auth Session And Demo Mode

Auth state is exposed through the core store and hook:

```txt
apps/mobile/src/core/auth/authStore.ts
apps/mobile/src/core/auth/useAuthSession.ts
apps/mobile/src/core/auth/AuthSessionProvider.tsx
```

Supabase-backed session operations live in:

```txt
apps/mobile/src/core/auth/sessionService.ts
apps/mobile/src/core/supabase/supabaseClient.ts
apps/mobile/src/core/config/supabaseConfig.ts
```

The mobile client may use only public Expo Supabase env vars:

```txt
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

The auth feature exposes the entry screens and form contracts here:

```txt
apps/mobile/src/features/auth/screens/WelcomeScreen.tsx
apps/mobile/src/features/auth/screens/SignInScreen.tsx
apps/mobile/src/features/auth/screens/SignUpScreen.tsx
apps/mobile/src/features/auth/components/AuthForm.tsx
apps/mobile/src/features/auth/types.ts
```

Default behavior is signed out. For local development, `EXPO_PUBLIC_WriterHabit_MOCK_SESSION` can still be set to:

```txt
signed_out
student_onboarding
student
parent
teacher
```

In development builds, demo-user switching is available from the floating
development panel backed by `apps/mobile/src/core/auth/demoUsers.ts`, including
while signed out on auth screens. Tapping a demo user creates the same local
`source: "mock"` session shape used by the env fallback, then normal route
guards send the account to onboarding, student, parent, or teacher areas.

The same panel also exposes onboarding screen previews backed by
`apps/mobile/src/features/onboarding/services/onboardingPreviewService.ts`.
These previews sign in the setup demo student, seed the local onboarding
progress required for the selected step, and route directly to role selection,
grade selection, writing goals, writing confidence, daily practice, or plan
summary.

Development builds expose a floating `Dev` button on auth, student, parent, and
teacher screens. The button opens the demo panel without sending the user back
to the sign-in screen.

This is public demo state only. Demo sessions use `source: "mock"` and skip Supabase auth subscriptions so a persisted Supabase event does not override the selected demo user. Do not put service-role Supabase keys or other secrets in Expo public env vars, app code, docs, or `.codex` files.

## Student Bottom Tabs

```txt
Home        -> /(student)/home
Assignments -> /(student)/assignments/history
Library     -> /(student)/canvas
```

Student detail routes are hidden from the tab bar:

```txt
/(student)/assignments/[assignmentId]
/(student)/assignments/submit
/(student)/canvas/templates
/(student)/canvas/[canvasId]
/(student)/grade3-writing
/(student)/grade3-writing/[day]
/(student)/grade3-writing/progress
/(student)/grade3-writing/library
/(student)/grade3-writing/parent-guide
/(student)/progress
/(student)/progress/badges
/(student)/progress/skills/[skillId]
/(student)/progress/weekly-review
/(student)/profile
/(student)/edit-profile
/(student)/writing-goals
/(student)/notification-settings
/(student)/language-settings
/(student)/review/[submissionId]
/(student)/review/[submissionId]/summary
/(student)/review/[submissionId]/rubric
/(student)/review/[submissionId]/revision
/(student)/review/[submissionId]/complete
/(student)/write/[assignmentId]
```

`/(student)/write/[assignmentId]` accepts an optional `stage` query parameter
with `understand`, `draft`, `revise`, or `submit`. Student assignment and
practice entry points are handwriting-first: primary writing actions open the
canvas or an upload/photo path. The write route remains available for typed
copies, recovery, revision checklist, and submission plumbing, but its primary
CTA also sends students back to canvas handwriting.

Student Home also includes a Grade 3 Writing Adventure card that opens
`/(student)/grade3-writing`. The Grade 3 routes are local-first detail routes
inside the student stack and do not require a backend assignment or login sync
to function.

## Parent Bottom Tabs

```txt
Home        -> /(parent)/home
Reports     -> /(parent)/reports
Assignments -> /(parent)/assignments
Settings    -> /(parent)/settings
```

Parent tab screens export feature screens from `apps/mobile/src/features/parent/screens/`. The assignments tab is a list surface, and individual assignment reviews are opened through the hidden submission route.

Parent detail routes are hidden from the tab bar:

```txt
/(parent)/assignments/[submissionId]
/(parent)/students/[studentId]/report
```

## Teacher Navigation

Teacher navigation currently uses bottom tabs:

```txt
Dashboard   -> /(teacher)/dashboard
Assignments -> /(teacher)/assignments
Submissions -> /(teacher)/submissions
Settings    -> /(teacher)/settings
```

Teacher tab screens export feature screens from `apps/mobile/src/features/teacher/screens/`.
The dashboard opens class progress details, the assignments tab opens the hidden
assignment creation flow, and the submissions tab opens individual review
details.

Teacher detail routes are hidden from the tab bar:

```txt
/(teacher)/assignments/create
/(teacher)/classes/[classId]/progress
/(teacher)/submissions/[submissionId]
/(teacher)/accessibility-settings
```

Student, parent, and teacher route groups share the reusable animated bottom
menu from `apps/mobile/src/shared/components/navigation/bottom-menu/`. Downward
scroll collapses secondary menu items so only the home/dashboard item remains.
Pressing that home/dashboard item while collapsed expands the menu; pressing it
while expanded navigates back to the role dashboard.

## Deep Linking

Current helper routes are centralized in `apps/mobile/src/core/navigation/deepLinks.ts`:

```txt
writerhabit://student/assignments/assignment_123
writerhabit://student/canvas/canvas_123
writerhabit://student/canvas/templates
writerhabit://student/write/assignment_123
writerhabit://student/review/submission_123
writerhabit://student/review/submission_123/summary
writerhabit://student/review/submission_123/rubric
writerhabit://student/review/submission_123/revision
writerhabit://student/review/submission_123/complete
writerhabit://parent/students/student_123/report
writerhabit://teacher/classes/class_123/progress
writerhabit://teacher/submissions/submission_123
```

These helpers return Expo Router `Href` objects for:

- Assignment detail
- Assignment submission confirmation
- Canvas template picker
- Canvas document
- Student AI review loading
- Student feedback summary
- Student rubric score
- Student revision task
- Student completion celebration
- Writing workspace
- Parent student report
- Teacher class progress
- Teacher submission review
- Paywall

## Protected Routes

`RouteGate` applies the current access behavior:

- Auth routes allow signed-out users and redirect authenticated users to their launch route.
- Onboarding routes require authentication and incomplete onboarding.
- Student routes require authentication, completed onboarding, and `role=student` or `role=admin`.
- Parent routes require authentication, completed onboarding, and `role=parent` or `role=admin`.
- Teacher routes require authentication, completed onboarding, and `role=teacher` or `role=admin`.
- Paywall requires authentication and completed onboarding, but does not require a specific role.
- Unknown routes render `+not-found.tsx`, then send the user back to the launch destination.

Auth routes currently include:

```txt
/(auth)/welcome
/(auth)/sign-in
/(auth)/sign-up
```

`/(auth)/welcome` offers Supabase sign-in/sign-up entry points and local demo role shortcuts. `/(auth)/sign-in` sends Supabase email login links and recovers sessions from auth deep-link callbacks through `apps/mobile/src/core/auth/sessionService.ts`. `/(auth)/sign-up` still submits email/password account creation through `apps/mobile/src/core/auth/authStore.ts`.

`/paywall` exports `PaywallRouteScreen` from `apps/mobile/src/features/subscriptions/screens/PaywallRouteScreen.tsx`. The screen renders loading, empty, error, free, past-due, and active Plus states from the server-backed subscription entitlement hook. Inline premium gates can send users to this route without blocking free writing flows.

Student onboarding routes currently include:

```txt
/(onboarding)/role-selection
/(onboarding)/grade-selection
/(onboarding)/writing-goals
/(onboarding)/writing-confidence
/(onboarding)/daily-practice-goal
/(onboarding)/plan-summary
```

The primary student setup flow is `role-selection -> grade-selection -> writing-goals -> daily-practice-goal -> plan-summary`. `writing-confidence` remains a route for existing deep links and older prompt coverage, but the current UI stores the default steady coaching pace when writing goals are confirmed.

Onboarding progress is validated and persisted by:

```txt
apps/mobile/src/features/onboarding/types.ts
apps/mobile/src/features/onboarding/stores/onboardingStore.ts
apps/mobile/src/features/onboarding/services/onboardingPersistenceService.ts
apps/mobile/src/features/onboarding/services/personalizedPlanService.ts
```

The summary step calls `apps/mobile/src/core/auth/authStore.ts` to complete onboarding. For Supabase sessions, public auth metadata currently stores `onboarding_complete`, `role`, `grade_level`, `writing_goals`, `confidence_level`, and `daily_practice_minutes`.
