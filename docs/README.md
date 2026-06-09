# WriteWise AI — Ordered AI Agent Implementation Prompts

This ZIP contains ordered implementation prompts you can give to AI coding agents to build WriteWise AI using a feature-based architecture.

## How to Use

1. Open `00_PROMPT_ORDER.md`.
2. Run one prompt at a time.
3. After each prompt, review the diff, run typecheck/lint/tests, and commit.
4. Continue to the next prompt.

Do not ask an AI agent to build the whole app in one prompt. Sequential prompts produce better code, cleaner architecture, and fewer accidental rewrites.

## Recommended Usage Pattern

```txt
Use 00_CONTEXT_BRIEF.md as product context.
Follow the rules in prompts/01_master_agent_rules.md.
Now implement prompts/[NEXT_PROMPT].md.
Do not modify unrelated files.
Keep route files thin.
Preserve feature-based architecture.
```

## Folder Contents

```txt
prompts/                 Ordered implementation prompts
prompts/specialists/     Review and specialist prompts
templates/               Reusable prompt templates
00_CONTEXT_BRIEF.md      Product context for every agent
00_PROMPT_ORDER.md       Best execution order
QUICK_START.md           Copy/paste shortcuts
PROMPT_INDEX.json        Machine-readable prompt index
```
