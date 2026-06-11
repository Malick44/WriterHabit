# 05 — API Contract

The canonical planned backend API contract now lives under `services/api/docs/`.
Use those files for endpoint shapes, error codes, and authorization rules:

- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/ERROR_CODES.md`
- `services/api/docs/AUTHORIZATION_RULES.md`
- `services/api/docs/DATABASE_SCHEMA.md`
- `services/api/docs/DATA_RELATIONSHIPS.md`

Base path:

```txt
/api/v1
```

Mobile API base URL:

- Runtime backend calls go through `apps/mobile/src/core/api/apiClient.ts`.
- Production builds must set `EXPO_PUBLIC_API_BASE_URL` to a valid HTTPS URL
  that includes the API base path, for example
  `https://api.your-domain.example.com/api/v1`.
- Development builds may fall back to `http://localhost:3000/api/v1` only when
  `__DEV__` is true.
- The client attaches a Supabase bearer token when one exists, sends an
  `x-request-id` header, times out requests, parses the standard error shape,
  and supports optional Zod response validation at call sites.

## Current Implementation Reality

The mobile app has a production-safe fetch boundary for planned backend calls,
but there is still no running WriterHabit backend runtime. Most product areas
currently use a mix of public Supabase auth, feature-owned deterministic mock
APIs, direct Supabase persistence, and local device persistence:

| Area | Current path |
| --- | --- |
| Auth/session | `apps/mobile/src/core/auth/sessionService.ts` |
| Public Supabase client | `apps/mobile/src/core/supabase/supabaseClient.ts` |
| Onboarding | `apps/mobile/src/features/onboarding/` |
| Student home | `apps/mobile/src/features/student-home/api/studentHomeApi.ts` |
| Assignments | `apps/mobile/src/features/assignments/api/assignmentsApi.ts` |
| Writing drafts | `apps/mobile/src/features/writing-workspace/` |
| Canvas | `apps/mobile/src/features/canvas/`, including local-first sync in `apps/mobile/src/features/canvas/services/canvasSyncService.ts` |
| AI coach | `apps/mobile/src/features/ai-coach/api/aiCoachApi.ts` |
| Feedback review | `apps/mobile/src/features/feedback-review/api/feedbackreviewApi.ts` |
| Progress | `apps/mobile/src/features/progress/api/progressApi.ts` |
| Parent | `apps/mobile/src/features/parent/api/parentApi.ts` |
| Teacher | `apps/mobile/src/features/teacher/api/teacherApi.ts` |
| Subscriptions | `apps/mobile/src/features/subscriptions/api/subscriptionsApi.ts` |

The backend scaffold is framework-neutral and lives in
`services/api/src/features/`. It contains endpoint boundary stubs, typed canvas
metadata/upload/export placeholders in `services/api/src/features/canvas/`, plus
framework-neutral AI coaching/review services in
`services/api/src/features/ai/`. Draft Supabase/Postgres migrations now live in
`services/api/migrations/`.

## Planned Endpoint Groups

The canonical endpoint details are in `services/api/docs/API_CONTRACT.md`.
Planned groups include:

- Auth
- Students
- Onboarding
- Assignments
- Submissions and drafts
- Canvas
- AI coach
- AI review and feedback
- Progress
- Parents
- Teachers
- Subscriptions
- Notifications

## Error Shape

The standard error response is:

```ts
interface ApiErrorResponse {
  error: {
    code: string;
    messageKey: string;
    fallbackMessage: string;
    details?: Record<string, unknown>;
    requestId: string;
    retryable: boolean;
  };
}
```

The canonical code catalog is `services/api/docs/ERROR_CODES.md`.

## Safety Boundary

AI endpoints must remain coaching-only. They may provide hints, brainstorming,
sentence checks, grammar explanations, vocabulary suggestions, and revision
questions. They must not provide finished essays, full assignment answers, or
polished replacement drafts.
