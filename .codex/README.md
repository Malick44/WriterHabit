# WriteWise Codex Setup

This directory contains project-local Codex configuration for `/Users/malickdes/WorkSpace/writewise`.

## Required Startup Context

Before every implementation, review, debugging, documentation, or planning task, read:

1. `AGENTS.md`
2. `docs/00_CONTEXT_BRIEF.md`
3. `prompts/01_master_agent_rules.md`
4. `.codex/EXECUTION_STATE.md`

The same checklist is also stored in `.codex/TASK_STARTUP.md` for quick handoff.

## Actions

Codex app actions are defined in `.codex/environments/environment.toml`.

- `Run`: starts the Expo dev server for `apps/mobile`.
- `Run iOS`: starts Expo and opens iOS.
- `Expo Doctor`: runs Expo diagnostics.
- `Typecheck`: runs the mobile TypeScript check.
- `Test`: runs the mobile Jest suite.
- `Supabase Health`: checks the local development Supabase admin connection.
- `Autonomous: Plan Prompts`: previews the next implementation prompt sequence.
- `Autonomous: Continue Prompts`: runs remaining implementation prompts with `codex exec`, checks, and commits.
- `Review: AI Safety`: runs the AI safety and academic-integrity review agent.
- `Generate: Assets`: runs the asset generation agent.
- `Review: Backend`: runs the backend architecture review agent.
- `Review: Design`: runs the product design review agent.
- `Review: Frontend Polish`: runs the React Native polish review agent.
- `Review: Product`: runs the product readiness review agent.
- `Review: Testing`: runs the test automation review agent.
- `List Prompts`: prints project prompt files.
- `List Specialist Agents`: prints available review and generation agent commands.
- `List Screen Prompts`: prints screen design prompt files.
- `List Skills`: prints project skill files.

Review and specialist generation actions are backed by `script/review_agent.sh`. Use `print` mode to inspect a generated prompt without launching Codex, for example:

```bash
./script/review_agent.sh design print
./script/review_agent.sh assets print
```

Autonomous implementation actions are backed by `script/autonomous_prompt_runner.sh`; see `.codex/AUTONOMOUS_PROMPTS.md`.

## Prompt Library

Use the required startup context above, then follow `docs/00_PROMPT_ORDER.md`.

Prompt assets stay in `prompts/`. This `.codex` directory only indexes them; it does not duplicate prompt content.

## Skill Library

Project-specific skills stay in `skills/`. Read the relevant `SKILL.md` before applying a skill.

Current project skills include:

- `skills/expo-ota-vs-rebuild/SKILL.md`
- `skills/mobile-memory-guard/SKILL.md`
- `skills/supabase-postgres-best-practices/SKILL.md`
- `skills/ux-flow/SKILL.md`
- `skills/writing-screen-review/SKILL.md`

## Secret Handling

Do not put secrets in `.codex`.

Local Supabase admin access uses `.env.supabase-admin`, which is ignored by git and should remain local-development only.
