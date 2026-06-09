# WriteWise API Service

This folder is the framework-neutral backend planning and scaffold area. It does
not contain a running API server, package manifest, database migrations, or
deployment configuration yet.

Canonical planned backend docs:

- `services/api/docs/API_CONTRACT.md`
- `services/api/docs/ERROR_CODES.md`
- `services/api/docs/AUTHORIZATION_RULES.md`

Feature boundary stubs live in `services/api/src/features/`.

Recommended backend responsibilities:

- Authentication integration
- User, student, parent, teacher management
- Daily assignment generation
- Assignment lifecycle
- Draft persistence
- Canvas file storage
- AI review queue
- Progress calculation
- Parent and teacher reporting
- Subscription entitlement sync
- Notifications and weekly reports

This folder is intentionally framework-neutral. You can implement it with NestJS or Spring Boot.
