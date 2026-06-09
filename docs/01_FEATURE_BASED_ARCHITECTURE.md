# 01 — Feature-Based Architecture

## Goal

The goal is to make the app easy to build, test, scale, and hand off to AI coding agents.

Instead of organizing files by technical type only, organize the product by business capability.

Bad structure:

```txt
components/
screens/
hooks/
services/
types/
```

Better structure:

```txt
features/
  assignments/
  writing-workspace/
  canvas/
  ai-coach/
  progress/
```

Each feature contains its own screens, components, hooks, API calls, types, tests, and state.

## Why Feature-Based Architecture Works for This App

This product has clear business domains:

- Onboarding
- Assignments
- Writing
- Canvas
- AI feedback
- Progress
- Parent reporting
- Teacher management
- Subscriptions

Each domain will evolve independently. Feature-based architecture prevents the project from becoming a large, tangled app with unrelated code mixed together.

## Recommended Monorepo

```txt
writewise-ai/
  apps/
    mobile/                  # Expo React Native app
    teacher-web/             # Optional Next.js teacher/admin portal
  services/
    api/                     # Backend API
  packages/
    shared/                  # Shared types, schemas, constants
  docs/                      # Architecture and implementation docs
```

## Mobile App Structure

```txt
apps/mobile/
  app/                       # Expo Router routes only
  src/
    core/                    # App-level infrastructure
    shared/                  # Reusable UI and utilities
    features/                # Business features
    assets/                  # Fonts, images, icons
```

## Important Rule

The `app/` directory should stay thin.

Expo Router route files should mostly import feature screens.

Example:

```tsx
// apps/mobile/app/(student)/assignments/[assignmentId].tsx
import { AssignmentDetailScreen } from "@/features/assignments/screens/AssignmentDetailScreen";

export default AssignmentDetailScreen;
```

The actual logic belongs inside the feature folder.

## Feature Folder Standard

Each feature should follow this pattern:

```txt
features/{feature-name}/
  screens/
  components/
  hooks/
  api/
  services/
  stores/
  types.ts
  constants.ts
  routes.ts
  index.ts
  __tests__/
```

Not every feature needs every folder. Add folders only when needed.

## Feature Ownership

| Feature | Owns |
|---|---|
| auth | Sign in, sign up, session, role routing |
| onboarding | Grade, goals, writing confidence, daily plan setup |
| student-home | Student dashboard, daily assignment preview |
| assignments | Assignment detail, history, submission lifecycle |
| writing-workspace | Typed editor, drafts, revision text editor |
| canvas | Handwriting, drawing, templates, canvas attachment |
| ai-coach | AI chat, hints, prompt helpers, coaching guardrails |
| feedback-review | Review loading, rubric, feedback summary, revision tasks |
| progress | Streaks, skill growth, badges, weekly review |
| parent | Parent dashboard, reports, assignment review |
| teacher | Class dashboard, create assignment, review submissions |
| subscriptions | Paywall, upgrade prompts, entitlement checks |
| profile-settings | Profile, accessibility, notifications, privacy settings |

## Dependency Rule

A feature can import from:

- `core`
- `shared`
- `packages/shared`
- Its own feature folder

A feature should not directly import implementation details from another feature.

Allowed:

```ts
import { AssignmentCard } from "@/shared/components/cards/AssignmentCard";
```

Avoid:

```ts
import { AssignmentApiClient } from "@/features/assignments/api/AssignmentApiClient";
```

If cross-feature sharing is needed, promote the shared code to `shared/` or `packages/shared`.

## Layering

```txt
Route file
  -> Feature screen
    -> Feature components
      -> Feature hooks
        -> Feature services
          -> API client / local storage / AI service
```

## Naming Rules

Use clear business names.

Good:

```txt
DailyAssignmentCard.tsx
RubricChecklist.tsx
CanvasTemplatePicker.tsx
RevisionTaskCard.tsx
```

Avoid vague names:

```txt
Card1.tsx
MainComponent.tsx
Helper.ts
```

## State Management

Use three state categories:

### Server State
Use TanStack Query.

Examples:

- assignments
- student progress
- parent reports
- teacher class data
- AI feedback result

### Local UI State
Use component state or Zustand.

Examples:

- selected canvas tool
- active editor tab
- selected grade during onboarding
- temporary coach drawer state

### Persistent Local State
Use storage facades under `apps/mobile/src/services/storage/` for app data. Supabase auth persistence is configured through `apps/mobile/src/core/supabase/supabaseClient.ts`.

Examples:

- unsaved draft
- offline canvas document
- Supabase auth session
- accessibility preferences

## Testing Strategy

Each feature should include:

- Unit tests for utilities and services
- Component tests for important UI components
- Integration tests for core flows
- E2E tests for onboarding, assignment completion, canvas flow, and paywall flow

## AI Agent Implementation Rule

When asking an AI coding agent to work on a feature, give it only that feature folder plus relevant shared contracts. This keeps scope tight and reduces accidental rewrites.
