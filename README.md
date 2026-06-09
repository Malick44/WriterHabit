# WriteWise AI — Feature-Based Project Architecture

This package defines a production-ready, feature-based architecture for an AI writing assistant app for students in Grades 1–12.

The product includes:

- Student onboarding
- Daily assignments
- Typed writing workspace
- Handwriting/canvas workspace
- AI writing coach
- Feedback and revision workflow
- Progress tracking
- Parent dashboard
- Teacher dashboard
- Subscription/paywall flow
- Safety, privacy, and academic-integrity guardrails

## Recommended Stack

### Mobile App
- Expo + React Native
- Expo Router
- TypeScript
- TanStack Query for server state
- Zustand for local UI/session state
- React Hook Form + Zod for forms
- React Native Reanimated for motion
- Canvas layer using a dedicated drawing/canvas library
- AsyncStorage/SecureStore for local persistence

### Backend API
- Node.js + NestJS, or Spring Boot if your team prefers Java
- PostgreSQL
- Redis for caching and rate limiting
- Object storage for canvas files and exports
- Background jobs for weekly reports and AI review processing

### Shared Package
- Shared TypeScript types
- Shared validation schemas
- Shared AI prompt contracts
- Shared role and permission constants

## Architecture Style

This is a feature-based architecture.

Each feature owns its:

- Screens
- Components
- Hooks
- API calls
- Types
- Stores
- Services
- Tests
- Localization keys
- Feature-specific utilities

Shared code lives in `packages/shared` or `apps/mobile/src/shared`.

## Top-Level Structure

```txt
writewise-ai/
  apps/
    mobile/
    teacher-web/
  services/
    api/
  packages/
    shared/
  docs/
```

## Start Here

Read these files first:

1. `docs/01_FEATURE_BASED_ARCHITECTURE.md`
2. `docs/02_SCREEN_TO_FEATURE_MAP.md`
3. `docs/03_NAVIGATION_MAP.md`
4. `docs/04_DATA_MODEL.md`
5. `docs/05_API_CONTRACT.md`
6. `docs/06_AI_COACH_ARCHITECTURE.md`
7. `docs/07_CANVAS_ARCHITECTURE.md`
8. `docs/08_IMPLEMENTATION_PLAN.md`
