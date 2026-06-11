# Agent Prompt: Web Support Release Surface

Working directory: `/Users/malickdes/WorkSpace/writewise`

## Goal

Close `WW-REL-006`: web export is not a valid release check. Current docs are partly contradictory because web was previously descoped, but release checklist still asks for web support to be explicitly accepted or removed from release-gate scripts.

## Required Startup

1. Read `AGENTS.md`.
2. Read `docs/00_CONTEXT_BRIEF.md`.
3. Read `prompts/01_master_agent_rules.md`.
4. Read `.codex/EXECUTION_STATE.md`.
5. Read `skills/expo-ota-vs-rebuild/SKILL.md` if changing dependencies or app config.
6. Read this prompt.

## Scope

- Make one explicit product/release decision:
  - Option A: web is unsupported and all release scripts/docs stop requiring web export.
  - Option B: web is supported and dependencies/config/testing are added.
- Do not leave contradictory docs.

## Files To Inspect

- `script/build_and_run.sh`
- `.codex/environments/environment.toml`
- `.github/workflows/mobile-release.yml`
- `docs/RELEASE_CHECKLIST.md`
- `docs/KNOWN_ISSUES.md`
- `docs/APP_IMPLEMENTATION_AUDIT.md`
- `apps/mobile/package.json`
- `apps/mobile/app.json`

## Requirements

- Prefer Option A unless product explicitly requires web, because the current app is a mobile Expo app and previous audit says web is descoped.
- If Option A:
  - Remove or clearly mark web export commands as unsupported.
  - Ensure CI/release checks do not fail on web.
  - Update docs to state iOS/Android are the release platforms.
- If Option B:
  - Install required web dependencies.
  - Validate web export.
  - Add web-specific QA notes.
  - Include Deployment Impact for dependency/config changes.

## Acceptance Criteria

- Release docs and scripts agree on web support.
- `WW-REL-006` is closed or rewritten as a documented product decision.
- CI does not run unsupported web gates.

## Validation

- `./script/build_and_run.sh --help`
- `./script/build_and_run.sh --typecheck`
- `cd apps/mobile && npm run lint -- --max-warnings=0`
- `./script/build_and_run.sh --test`
- If web supported: `./script/build_and_run.sh --export-web`

## Final Response

Include the product decision, files changed, tests run, and Deployment Impact if dependencies/config changed.
