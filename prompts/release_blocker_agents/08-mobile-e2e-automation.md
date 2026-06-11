# Agent Prompt: Mobile E2E Automation

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close `WW-REL-004` and audit `P1-4`: flow docs exist, but there is no mobile E2E runner for installed-build behavior.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/ux-flow/SKILL.md`.
6. Read `skills/writing-screen-review/SKILL.md`.
7. Read `skills/expo-ota-vs-rebuild/SKILL.md` if adding dependencies or native config.
8. Read this prompt.

## Scope

- Choose Maestro or Detox for Expo/React Native E2E.
- Add an executable E2E setup and CI-friendly scripts.
- Automate the most important release flows.

## Files To Inspect

- `tests/e2e/flow-1-student-first-assignment.md`
- `tests/e2e/flow-2-canvas-assignment.md`
- `apps/mobile/package.json`
- `apps/mobile/app/**`
- `apps/mobile/src/core/navigation/**`
- `apps/mobile/src/features/**`
- `.github/workflows/mobile-release.yml`
- `apps/mobile/eas.json`

## Required Flows

- Student first assignment: sign up/sign in, onboarding, daily assignment, draft, submit, review, revision, completion.
- Canvas assignment: create canvas, draw strokes and tap dots, attach, submit, sync/offline failure recovery.
- Parent report review.
- Teacher assignment creation and student submission review.
- Paywall gate and restore/entitlement state.
- Auth guard and deep-link routing.
- Notification permission path if available in native build.

## Requirements

- Add stable test IDs where needed using localized/accessibility-safe patterns.
- Keep route files thin.
- Do not make production UI worse just for tests.
- E2E should run locally and have clear CI instructions.
- If using native test runner/dependency changes, include Deployment Impact.

## Acceptance Criteria

- E2E runner is installed/configured.
- At least Flow 1 and Flow 2 are automated end to end.
- CI has an E2E job or a documented/manual trigger.
- Docs explain setup, simulator/device requirements, and known limitations.

## Validation

- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`
- Run the new E2E command locally or document why device/runtime access blocked it.

## Final Response

Include runner choice, flows automated, commands run, CI status, and Deployment Impact if applicable.
