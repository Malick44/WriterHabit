# Agent Prompt: Release Operations, EAS, Store, And Observability

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close `WW-REL-012`: release surface exists, but real EAS project linking, credentials, store metadata, screenshots, privacy labels, crash reporting, rollback, incident response, and support procedures remain incomplete.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/expo-ota-vs-rebuild/SKILL.md`.
6. Read Expo deployment/CI guidance if available.
7. Read this prompt.

## Scope

- Finish production release operations without inventing owner credentials.
- Replace placeholder EAS project id only after owner links the actual project.
- Add store/ops docs and CI/release checks.

## Files To Inspect

- `apps/mobile/app.json`
- `apps/mobile/eas.json`
- `apps/mobile/.eas/workflows/release.yml`
- `.github/workflows/mobile-release.yml`
- `docs/RELEASE_CHECKLIST.md`
- `docs/KNOWN_ISSUES.md`
- `docs/APP_IMPLEMENTATION_AUDIT.md`
- `apps/mobile/assets/**`

## Requirements

- Owner must choose Expo owner (`malickb` vs `ai-orbit-studio`) and run EAS init/configure. Do not fabricate `extra.eas.projectId` or update URL.
- Verify `cd apps/mobile && npx eas-cli@latest config` once linked.
- Configure or document blocked setup for iOS/Android credentials, APNs/FCM, build profiles, submit profiles, update channels, and rollback.
- Prepare store metadata checklist: name, subtitle/short description, full description, categories, age rating, privacy labels, screenshots, support URL, privacy URL.
- Select crash reporting/analytics/support diagnostics strategy with safe metadata rules.
- Document release rollback, incident response, data-deletion support, and support escalation.
- Add or update CI gates for typecheck, lint, tests, Expo Doctor, package check, and iOS/Android export.

## Acceptance Criteria

- Real EAS project id and update URL are committed only if owner linking succeeded.
- Store and operations docs are complete enough for a release candidate.
- Rollback/support/incident procedures are documented.
- Release checklist is accurate.

## Validation

- `cd apps/mobile && npx eas-cli@latest config` if linked.
- `cd apps/mobile && npx expo install --check`
- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`
- `./script/build_and_run.sh --doctor`
- `cd apps/mobile && npx expo export --platform ios --output-dir /tmp/WriterHabit-release-ios`
- `cd apps/mobile && npx expo export --platform android --output-dir /tmp/WriterHabit-release-android`

## Final Response

Include what was linked/configured, owner actions still blocked, validation results, and Deployment Impact.
