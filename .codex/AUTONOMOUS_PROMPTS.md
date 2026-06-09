# Autonomous Prompt Runner

Use `script/autonomous_prompt_runner.sh` to run implementation prompts in canonical order without manually pasting each prompt.

The runner:

- reads the canonical prompt order from its internal map matching `docs/PROMPT_INDEX.json`
- defaults `--from auto` to the next prompt after the highest completed prompt in `.codex/EXECUTION_STATE.md`
- runs each prompt with `codex exec --dangerously-bypass-approvals-and-sandbox`
- runs `typecheck`, `test`, and `doctor` after each prompt
- stages and commits each prompt result
- blocks commits that include local env files, `node_modules/`, `.expo/`, or generated native folders

## Commands

Preview the next sequence:

```bash
./script/autonomous_prompt_runner.sh --dry-run
```

Run from a selected prompt through the final QA prompt:

```bash
./script/autonomous_prompt_runner.sh --from auto --to 27
```

Run a smaller batch:

```bash
./script/autonomous_prompt_runner.sh --from 14 --to 16
```

## Preconditions

- Git worktree must be clean before starting.
- Local secrets must remain ignored.
- The runner does not push commits.
- Failed prompts or failed checks stop the run.
- Nested Codex runs have full filesystem access and do not prompt for approvals. Use this only in this local development workspace.

## Current Project Default

`.codex/EXECUTION_STATE.md` currently marks Prompt 27 complete, so the canonical
implementation prompt sequence has no remaining prompt after `--from auto`.
