# Backend Feature Boundaries

This folder is the framework-neutral scaffold for the planned WriteWise backend.
It intentionally does not choose NestJS, Spring Boot, or another runtime yet.

Each feature folder owns its controllers/services/contracts once a backend
framework is selected:

| Feature | Boundary |
| --- | --- |
| `auth` | Auth provider integration and session hydration. |
| `students` | Student profiles and student home read model. |
| `onboarding` | Onboarding progress, completion, and personalized plans. |
| `assignments` | Daily assignment, assignment listing, detail, start, submit entry points. |
| `submissions` | Draft persistence, submission lifecycle, and revisions. |
| `canvas` | Canvas metadata, signed upload URLs, export, attachment, recognition. |
| `ai-coach` | Policy-safe coaching actions and usage limits. |
| `ai-review` | Review jobs, feedback storage, and progress update boundary. |
| `progress` | Progress dashboard, skill trends, badges, weekly review. |
| `parents` | Parent dashboards, linked student reports, settings. |
| `teachers` | Teacher dashboards, classes, assignments, submissions, comments. |
| `subscriptions` | Entitlements, checkout, restore, provider webhooks. |

Canonical planned contracts:

- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/ERROR_CODES.md`
- `services/api/docs/AUTHORIZATION_RULES.md`
