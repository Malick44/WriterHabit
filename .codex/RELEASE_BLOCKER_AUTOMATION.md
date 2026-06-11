# Release Blocker Automation

Use `script/release_blocker_agent_runner.sh` to run the release-blocker prompt pack with an implementation agent and a review agent loop.

## What It Runs

The runner reads prompt files from `prompts/release_blocker_agents/`:

- implementation agent: executes the selected release-blocker prompt
- standard checks: typecheck, zero-warning lint, Jest, Expo Doctor
- review agent: audits the result and writes a report under `docs/reviews/release-blockers/`
- loop: if the review report ends with `REVIEW_STATUS: changes_requested`, the implementation agent runs again with that report as input
- commit: after `REVIEW_STATUS: approved`, the runner stages and commits the task result

The review report must end with exactly one of:

```txt
REVIEW_STATUS: approved
REVIEW_STATUS: changes_requested
REVIEW_STATUS: blocked
```

## Commands

Preview all tasks:

```bash
./script/release_blocker_agent_runner.sh --dry-run
```

Run one task:

```bash
./script/release_blocker_agent_runner.sh --task 01
```

Run a range:

```bash
./script/release_blocker_agent_runner.sh --from 01 --to 04
```

Allow more review rounds:

```bash
./script/release_blocker_agent_runner.sh --task 03 --max-review-rounds 5
```

Run without committing, useful for inspecting the loop:

```bash
./script/release_blocker_agent_runner.sh --task 01 --no-commit
```

## Preconditions

- Git worktree must be clean before starting.
- Local secrets must remain ignored.
- Failed implementation, failed checks, blocked review, or max review rounds stop the run.
- Nested Codex runs use full filesystem access and bypass approval prompts; use this only in this trusted local workspace.
- The runner does not push commits or open pull requests.

## Review Reports

Reports are written to:

```txt
docs/reviews/release-blockers/
```

Reports are committed with the approved task so the rationale and validation trail stay with the code.
