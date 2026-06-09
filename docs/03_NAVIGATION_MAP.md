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
    progress/index.tsx
    progress/badges.tsx
    progress/skills/[skillId].tsx
    progress/weekly-review.tsx
    profile.tsx
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

Default behavior is signed out. For local development, `EXPO_PUBLIC_WRITEWISE_MOCK_SESSION` can still be set to:

```txt
signed_out
student_onboarding
student
parent
teacher
```

In development builds, the sign-in screen also exposes a developer demo-user
panel backed by `apps/mobile/src/core/auth/demoUsers.ts`. Selecting a demo user
creates the same local `source: "mock"` session shape used by the env fallback,
then normal route guards send the account to onboarding, student, parent, or
teacher areas.

This is public demo state only. Demo sessions use `source: "mock"` and skip Supabase auth subscriptions so a persisted Supabase event does not override the selected demo user. Do not put service-role Supabase keys or other secrets in Expo public env vars, app code, docs, or `.codex` files.

## Student Bottom Tabs

```txt
Home      -> /(student)/home
Write     -> /(student)/assignments/history
Canvas    -> /(student)/canvas
Progress  -> /(student)/progress
Profile   -> /(student)/profile
```

Student detail routes are hidden from the tab bar:

```txt
/(student)/assignments/[assignmentId]
/(student)/assignments/submit
/(student)/canvas/templates
/(student)/canvas/[canvasId]
/(student)/progress/badges
/(student)/progress/skills/[skillId]
/(student)/progress/weekly-review
/(student)/review/[submissionId]
/(student)/review/[submissionId]/summary
/(student)/review/[submissionId]/rubric
/(student)/review/[submissionId]/revision
/(student)/review/[submissionId]/complete
/(student)/write/[assignmentId]
```

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
```

## Deep Linking

Current helper routes are centralized in `apps/mobile/src/core/navigation/deepLinks.ts`:

```txt
writewise://student/assignments/assignment_123
writewise://student/canvas/canvas_123
writewise://student/canvas/templates
writewise://student/write/assignment_123
writewise://student/review/submission_123
writewise://student/review/submission_123/summary
writewise://student/review/submission_123/rubric
writewise://student/review/submission_123/revision
writewise://student/review/submission_123/complete
writewise://parent/students/student_123/report
writewise://teacher/classes/class_123/progress
writewise://teacher/submissions/submission_123
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

`/(auth)/welcome` offers Supabase sign-in/sign-up entry points and local demo role shortcuts. `/(auth)/sign-in` and `/(auth)/sign-up` submit through `apps/mobile/src/core/auth/authStore.ts`, which delegates real email/password operations to `apps/mobile/src/core/auth/sessionService.ts`.

`/paywall` exports `PaywallRouteScreen` from `apps/mobile/src/features/subscriptions/screens/PaywallRouteScreen.tsx`. The screen renders loading, empty, error, free, past-due, and active Plus states from the local subscription entitlement hook. Inline premium gates can send users to this route without blocking free writing flows.

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
