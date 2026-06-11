# WriterHabit API Service

This folder now contains a runnable Node/TypeScript API runtime shell plus the
existing backend contracts, migration drafts, and framework-neutral feature
services.

Current runtime status:

- Fastify server entrypoint in `services/api/src/index.ts`.
- Local base path: `/api/v1`.
- Public `GET /api/v1/health`.
- Authenticated `GET /api/v1/auth/session` and `GET /api/v1/me/profile` smoke
  endpoints derived from a verified Supabase bearer JWT.
- Backend role derivation ignores client-writable `user_metadata.role`; the
  runtime uses trusted `app_metadata.role` when present and otherwise defaults
  to least-privileged `student`.
- Registered route shells for auth, students, onboarding, assignments,
  submissions, canvas, AI coach, feedback, progress, parent, teacher,
  subscriptions, and notifications.
- Incomplete production workflows fail closed with the standard
  `501 feature.disabled` API error envelope.

The runtime does not yet implement production persistence, resource-level
authorization, a migration runner, payment provider calls, signed object storage,
AI provider calls, notification workers, or deployment infrastructure. Those
remain separate release blockers.

## Commands

```bash
cd services/api
npm install
npm run dev
npm run build
npm start
npm run typecheck
npm test
```

`npm run dev` starts the TypeScript server with `tsx`. `npm run build` emits a
bundled Node 20 server under `dist/`, and `npm start` runs that built artifact.

## Runtime Configuration

Required for authenticated protected endpoints:

```txt
SUPABASE_JWT_SECRET=...
```

or:

```txt
SUPABASE_URL=https://your-project.supabase.co
```

`SUPABASE_JWT_SECRET` verifies HS256 access tokens. If it is not set,
`SUPABASE_URL` derives the Supabase JWKS URL at
`/auth/v1/.well-known/jwks.json`; `SUPABASE_JWKS_URL` can override that path.
If neither JWT configuration is present, the server still starts for health
checks, but every protected endpoint fails closed with `503 system.unavailable`.

Optional:

```txt
PORT=3000
HOST=0.0.0.0
API_BASE_PATH=/api/v1
LOG_LEVEL=info
CORS_ORIGINS=https://app.example.com,https://admin.example.com
SUPABASE_JWT_ISSUER=...
SUPABASE_JWT_AUDIENCE=authenticated
```

Browser CORS origins are deny-by-default in production unless listed in
`CORS_ORIGINS`. Native/mobile requests without an `Origin` header are allowed.

Canonical planned backend docs:

- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/ERROR_CODES.md`
- `services/api/docs/AUTHORIZATION_RULES.md`
- `services/api/docs/DATABASE_SCHEMA.md`
- `services/api/docs/DATA_RELATIONSHIPS.md`

Draft Supabase/Postgres migrations live in `services/api/migrations/`.

Feature boundary stubs live in `services/api/src/features/`.

Framework-neutral AI backend services live in `services/api/src/features/ai/`.
They include safe coaching and review orchestration, grade-aware prompt builders,
academic-integrity policy checks, deterministic moderation placeholders, usage
limit/cost controls, a structured feedback parser, and a mock provider. They do
not call an external model provider or require provider credentials yet.

Recommended backend responsibilities:

- Authentication integration
- User, student, parent, teacher management
- Daily assignment generation
- Assignment lifecycle
- Draft persistence
- Canvas file storage
- AI review queue
- AI coaching and review service orchestration
- Progress calculation
- Parent and teacher reporting
- Subscription entitlement sync
- Notifications and weekly reports

Feature services remain framework-neutral where practical, but the selected API
runtime shell is Fastify.
