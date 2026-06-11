# Agent Prompt: Canvas Storage, Export, And Sync

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close `WW-REL-008` and the canvas storage portion of audit `P1-9`: canvas is local-first with sync scaffolding, but real file export, object upload, signed URLs, and storage authorization are not implemented.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/mobile-memory-guard/SKILL.md`.
6. Read `skills/writing-screen-review/SKILL.md`.
7. Read `skills/expo-ota-vs-rebuild/SKILL.md` if touching native modules/config.
8. Read this prompt.

## Scope

- Implement production canvas export and object storage sync.
- Add signed upload/download endpoints and authorized object path derivation.
- Keep memory usage bounded on low-memory student devices.

## Files To Inspect

- `apps/mobile/src/features/canvas/**`
- `apps/mobile/src/features/writing-workspace/api/writingWorkspaceApi.ts`
- `apps/mobile/src/services/fileSystem.ts`
- `services/api/src/features/canvas/**`
- `services/api/docs/CANVAS_STORAGE.md`
- `services/api/migrations/*.sql`
- `docs/RELEASE_CHECKLIST.md`

## Requirements

- Replace placeholder `placeholder://` upload/download behavior.
- Implement object path derivation that prevents cross-user access.
- Add signed upload/download endpoints with expiry and audit logging.
- Implement local file export/cache facade or document and remove unsupported file flows.
- Avoid base64 for large previews/exports unless there is no practical alternative.
- Add retry/backoff and visible sync failure recovery.
- Add pruning/TTL/byte budget for local canvas/export cache.
- Add tests for authorized upload, denied cross-user access, expired URLs, retry behavior, export failure, and low-memory-safe list behavior.

## Acceptance Criteria

- Canvas documents can sync to object storage through authorized backend endpoints.
- Attachments can be exported/downloaded without exposing other users' work.
- Local cache is bounded.
- Student work remains available after sync failure.

## Validation

- Canvas mobile tests.
- Backend canvas/storage tests.
- RLS/storage authorization tests.
- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`
- `./script/build_and_run.sh --doctor`

## Final Response

Include storage design, memory decisions, files changed, tests run, and Deployment Impact if native/config changed.
