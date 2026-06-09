# WriteWise AI — Context Brief

WriteWise AI is an AI-powered writing assistant app for students in Grades 1–12.

## Product Vision
A safe AI writing coach that helps students practice writing every day, complete assignments, use handwriting or typed work, and visibly improve over time.

## Core Features
- Student onboarding
- Grade-level personalization
- Daily writing assignments
- Typed writing workspace
- Handwriting/drawing canvas
- Canvas templates
- AI coach
- AI review and feedback
- Revision tasks
- Rubric scoring
- Progress tracking
- Parent reports
- Teacher assignment management
- Subscription/paywall flow

## Target Users
### Grades 1–5
Need simple UI, large controls, friendly feedback, handwriting support, audio/read-aloud affordances, and short tasks.

### Grades 6–8
Need paragraph structure, grammar support, argument writing, summaries, revision, and progress.

### Grades 9–12
Need essay planning, thesis support, evidence organization, rubric scoring, tone, style, and revision tools.

### Parents
Need trust, visibility, weekly progress, completed assignments, and areas needing practice.

### Teachers
Need assignment creation, class progress, submissions, rubrics, and student analytics.

## Required Architecture
Use feature-based architecture. Each feature owns its screens, components, hooks, api, services, stores, types, constants, and tests.

## Recommended Stack
- Expo + React Native
- Expo Router
- TypeScript
- TanStack Query
- Zustand
- React Hook Form
- Zod
- PostgreSQL backend
- Object storage for canvas files
- AI service boundary with safety controls

## Critical AI Safety Rule
The AI coach must help students learn. It must not complete assignments for them.

Forbidden CTAs:
- Write my essay
- Finish my assignment
- Give me the answer
- Generate final draft

Approved CTAs:
- Give me a hint
- Help me brainstorm
- Check my sentence
- Explain this mistake
- Help me revise
- Suggest a stronger word
