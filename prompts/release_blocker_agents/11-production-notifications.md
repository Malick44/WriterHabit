# Agent Prompt: Production Notifications

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close `WW-REL-009` and audit `P1-14`: local scheduling and token-registration boundaries exist, but production push delivery, APNs/FCM credentials, workers, report notifications, and status separation are incomplete.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/expo-ota-vs-rebuild/SKILL.md`.
6. Read this prompt.

## Scope

- Finish remote notification registration and delivery pipeline.
- Separate local preference save, OS permission, Expo token, backend sync, scheduled local reminders, and remote delivery status.
- Do not overstate success to users.

## Files To Inspect

- `apps/mobile/src/core/notifications/notificationDeliveryService.ts`
- `apps/mobile/src/features/profile-settings/screens/StudentProfileSettingsFlowScreens.tsx`
- `apps/mobile/src/features/profile-settings/**`
- `services/api/src/features/notifications/**`
- `services/api/docs/API_CONTRACT.md`
- `apps/mobile/app.json`
- `apps/mobile/eas.json`
- `docs/KNOWN_ISSUES.md`
- `docs/RELEASE_CHECKLIST.md`

## Requirements

- Replace placeholder EAS project id with owner-linked value only if owner has run EAS init. Do not invent IDs.
- Register Expo push tokens only when project id is real.
- Persist token/device records through backend endpoint with auth.
- Implement worker-ready push delivery service for student reminders, parent reports, and teacher notifications.
- Configure APNs/FCM through EAS or document exact blocked owner steps.
- UI must show distinct status for:
  - preference saved
  - OS permission granted/denied
  - local schedule active
  - push token registered
  - backend sync succeeded/failed
  - remote delivery last attempted/succeeded/failed
- Add tests for permission denied, missing project id, token registration failure, backend sync failure, and successful registration.

## Acceptance Criteria

- Notification settings no longer report full success when token/backend sync fails.
- Backend can store and manage device tokens.
- Delivery service is deployable and observable.
- Native QA steps are documented.

## Validation

- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`
- `./script/build_and_run.sh --doctor`
- Native notification QA if credentials/device access are available.

## Final Response

Include token/project-id status, user-visible status model, files changed, tests run, owner actions, and Deployment Impact.
