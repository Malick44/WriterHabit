# Backend Feature Boundaries

This folder keeps WriterHabit backend feature contracts and framework-neutral
services. The production API runtime shell now lives outside this folder in
`services/api/src/runtime/`, `services/api/src/routes/`, and
`services/api/src/index.ts`.

Each feature folder owns its controllers/services/contracts once a backend
workflow is implemented:

| Feature | Boundary |
| --- | --- |
| `auth` | Auth provider integration and session hydration. |
| `audit` | Metadata-only security and operational audit event contracts, sanitization, and future persistence adapter boundary. |
| `students` | Student profiles and student home read model. |
| `onboarding` | Onboarding progress, completion, and personalized plans. |
| `assignments` | Daily assignment, assignment listing, detail, start, submit entry points. |
| `submissions` | Draft persistence, submission lifecycle, and revisions. |
| `canvas` | Canvas metadata, signed upload URLs, export, attachment, recognition. |
| `ai` | Framework-neutral AI coaching/review services, safety, moderation, prompt building, usage controls, structured feedback parsing, and mock provider. |
| `ai-coach` | Compatibility re-export for policy-safe coaching endpoints and `AiCoachService`. |
| `ai-review` | Compatibility re-export for review endpoints and `AiReviewService`. |
| `progress` | Progress dashboard, skill trends, badges, weekly review. |
| `parents` | Parent dashboards, linked student reports, settings. |
| `teachers` | Teacher dashboards, classes, assignments, submissions, comments. |
| `subscriptions` | Entitlements, checkout, restore, provider webhooks. |

Canonical planned contracts:

- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/ERROR_CODES.md`
- `services/api/docs/AUTHORIZATION_RULES.md`

Current runtime behavior:

- `GET /api/v1/health` is public.
- `GET /api/v1/auth/session` and `GET /api/v1/me/profile` require a verified
  Supabase bearer JWT and return token-derived public profile metadata.
- Registered but incomplete feature routes authenticate first and then return
  `501 feature.disabled`.
- Public auth proxy and payment webhook routes are registered but disabled; they
  do not parse or trust provider payloads yet.
