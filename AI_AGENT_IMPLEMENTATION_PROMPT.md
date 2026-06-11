# AI Coding Agent Prompt — Implement WriterHabit AI Feature-Based Architecture

You are a senior Expo/React Native engineer and product-minded full-stack architect.

Implement the WriterHabit AI project using the feature-based architecture in this repository.

## Critical Rules

1. Keep Expo Router route files thin.
2. Put business logic inside `src/features`.
3. Each feature owns its screens, components, hooks, API, services, stores, and tests.
4. Do not create a generic global `components/screens/hooks/services` dump.
5. Use shared components only for truly reusable UI.
6. Use TanStack Query for server state.
7. Use Zustand only for local UI state.
8. Keep AI coaching in learning mode. Do not create UI actions that let students cheat.
9. Make all screens grade-adaptive where relevant.
10. Include accessibility labels and localization-ready text keys.

## First Implementation Order

1. App shell and providers
2. Auth/welcome flow
3. Onboarding flow
4. Student home dashboard
5. Assignment detail
6. Writing workspace
7. Canvas template picker
8. Handwriting canvas
9. Canvas attachment
10. AI review loading and feedback
11. Progress dashboard
12. Parent report
13. Teacher dashboard
14. Paywall and entitlements

## Output Requirements

For each feature you implement, include:

- Screens
- Components
- Hooks
- API methods
- Types
- Tests
- Empty states
- Error states
- Loading states
